import { prisma } from './prisma';
import { formatBDT } from './currency';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

interface OrderNotificationPayload {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity?: string;
  items: Array<{ productName: string; quantity: number; unitPrice: number | string }>;
  totalAmount: number | string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

interface StockAlertPayload {
  productName: string;
  sku: string;
  currentStock: number;
  threshold: number;
}

/**
 * Direct Telegram Bot message sender
 */
export async function sendTelegramMessage(text: string, customToken?: string, customChatId?: string): Promise<{ success: boolean; error?: string }> {
  const token = customToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = customChatId || process.env.TELEGRAM_CHAT_ID;

  if (!token || token.startsWith('mock_') || !chatId || chatId.startsWith('mock_')) {
    return { success: false, error: 'Telegram credentials are not configured or still using placeholder values.' };
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      return { success: false, error: data.description || `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Queue a notification into PostgreSQL NotificationOutbox table
 */
export async function queueNotification(eventType: string, payload: Record<string, unknown>): Promise<string | null> {
  const chatId = process.env.TELEGRAM_CHAT_ID || 'UNCONFIGURED';
  try {
    const outbox = await prisma.notificationOutbox.create({
      data: {
        eventType,
        channel: 'TELEGRAM',
        recipient: chatId,
        payload: JSON.parse(JSON.stringify(payload)),
        status: 'PENDING',
      },
    });

    // Proactively attempt delivery non-blockingly
    setTimeout(() => {
      processOutboxItem(outbox.id).catch((err) => console.error('[TELEGRAM_ASYNC_DISPATCH_FAIL]', err));
    }, 100);

    return outbox.id;
  } catch (err) {
    console.error('[OUTBOX_QUEUE_ERROR]', err);
    return null;
  }
}

/**
 * Format and process a single outbox item
 */
export async function processOutboxItem(outboxId: string): Promise<boolean> {
  const item = await prisma.notificationOutbox.findUnique({
    where: { id: outboxId },
  });

  if (!item || item.status === 'SENT') return true;

  // Format message text based on event type
  let messageHtml = '';
  const payload = item.payload as Record<string, unknown>;

  if (item.eventType === 'NEW_ORDER') {
    const order = payload as unknown as OrderNotificationPayload;
    const itemsList = (order.items || [])
      .map((i) => `• <b>${i.productName}</b> × ${i.quantity} (${formatBDT(i.unitPrice)})`)
      .join('\n');

    messageHtml = `
🛒 <b>NEW ORDER RECEIVED!</b> — Toto Elite Mart
━━━━━━━━━━━━━━━━━━
📦 <b>Order ID:</b> <code>${order.orderNumber}</code>
👤 <b>Customer:</b> ${order.customerName}
📞 <b>Phone:</b> <code>${order.customerPhone}</code>
📍 <b>Address:</b> ${order.deliveryAddress}, ${order.deliveryCity || 'Dhaka'}

📋 <b>Ordered Items:</b>
${itemsList}

💰 <b>Total Amount:</b> <b>${formatBDT(order.totalAmount)}</b>
💳 <b>Payment:</b> ${order.paymentMethod} (${order.paymentStatus})
⏰ <b>Time:</b> ${new Date(order.createdAt).toLocaleString('en-BD')}
━━━━━━━━━━━━━━━━━━
🔗 <i>View in Admin: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/orders</i>
    `.trim();
  } else if (item.eventType === 'LOW_STOCK') {
    const stock = payload as unknown as StockAlertPayload;
    messageHtml = `
⚠️ <b>LOW STOCK ALERT!</b>
━━━━━━━━━━━━━━━━━━
📦 <b>Product:</b> ${stock.productName}
🔖 <b>SKU:</b> <code>${stock.sku}</code>
📉 <b>Current Stock:</b> <b>${stock.currentStock}</b> (Threshold: ${stock.threshold})
━━━━━━━━━━━━━━━━━━
<i>Please reorder or restock promptly.</i>
    `.trim();
  } else if (item.eventType === 'ORDER_CANCELLED') {
    messageHtml = `
❌ <b>ORDER CANCELLED</b>
━━━━━━━━━━━━━━━━━━
📦 <b>Order ID:</b> <code>${payload.orderNumber}</code>
👤 <b>Customer:</b> ${payload.customerName}
Reason / Note: ${payload.reason || 'Customer request'}
    `.trim();
  } else {
    messageHtml = `
🔔 <b>SYSTEM NOTIFICATION</b> [${item.eventType}]
━━━━━━━━━━━━━━━━━━
${JSON.stringify(payload, null, 2)}
    `.trim();
  }

  const result = await sendTelegramMessage(messageHtml);

  if (result.success) {
    await prisma.notificationOutbox.update({
      where: { id: outboxId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        lastError: null,
      },
    });
    return true;
  } else {
    await prisma.notificationOutbox.update({
      where: { id: outboxId },
      data: {
        status: item.retryCount >= 5 ? 'FAILED' : 'PENDING',
        retryCount: { increment: 1 },
        lastError: result.error,
        nextRetryAt: new Date(Date.now() + Math.min(1000 * 60 * Math.pow(2, item.retryCount), 1000 * 60 * 30)),
      },
    });
    return false;
  }
}
