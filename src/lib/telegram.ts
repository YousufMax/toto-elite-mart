import { prisma } from './prisma';
import { formatBDT } from './currency';
import { getStoreSettings } from './data-store';

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
 * Helper to resolve Telegram credentials from StoreSettings or process.env
 */
export async function getActiveTelegramCredentials(customToken?: string, customChatId?: string): Promise<{ token: string; chatId: string; isConfigured: boolean }> {
  let token = customToken;
  let chatId = customChatId;

  if (!token || !chatId) {
    try {
      const settings = await getStoreSettings();
      if (!token && settings.telegramBotToken) {
        token = settings.telegramBotToken.trim();
      }
      if (!chatId && settings.telegramChatId) {
        chatId = settings.telegramChatId.trim();
      }
    } catch {
      // ignore
    }
  }

  // Fallback to environment variables
  if (!token) token = process.env.TELEGRAM_BOT_TOKEN;
  if (!chatId) chatId = process.env.TELEGRAM_CHAT_ID;

  const isConfigured = Boolean(
    token &&
    !token.startsWith('mock_') &&
    chatId &&
    !chatId.startsWith('mock_')
  );

  return {
    token: token || '',
    chatId: chatId || '',
    isConfigured,
  };
}

/**
 * Direct Telegram Bot message sender
 */
export async function sendTelegramMessage(text: string, customToken?: string, customChatId?: string): Promise<{ success: boolean; error?: string }> {
  const { token, chatId, isConfigured } = await getActiveTelegramCredentials(customToken, customChatId);

  if (!isConfigured) {
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
 * Format message HTML based on event type
 */
export function formatTelegramNotificationHtml(eventType: string, payload: Record<string, unknown>): string {
  if (eventType === 'NEW_ORDER') {
    const order = payload as unknown as OrderNotificationPayload;
    const itemsList = (order.items || [])
      .map((i) => `• <b>${i.productName}</b> × ${i.quantity} (${formatBDT(i.unitPrice)})`)
      .join('\n');

    return `
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
  } else if (eventType === 'LOW_STOCK') {
    const stock = payload as unknown as StockAlertPayload;
    return `
⚠️ <b>LOW STOCK ALERT!</b>
━━━━━━━━━━━━━━━━━━
📦 <b>Product:</b> ${stock.productName}
🔖 <b>SKU:</b> <code>${stock.sku}</code>
📉 <b>Current Stock:</b> <b>${stock.currentStock}</b> (Threshold: ${stock.threshold})
━━━━━━━━━━━━━━━━━━
<i>Please reorder or restock promptly.</i>
    `.trim();
  } else if (eventType === 'ORDER_CANCELLED') {
    return `
❌ <b>ORDER CANCELLED</b>
━━━━━━━━━━━━━━━━━━
📦 <b>Order ID:</b> <code>${payload.orderNumber}</code>
👤 <b>Customer:</b> ${payload.customerName}
Reason / Note: ${payload.reason || 'Customer request'}
    `.trim();
  } else {
    return `
🔔 <b>SYSTEM NOTIFICATION</b> [${eventType}]
━━━━━━━━━━━━━━━━━━
${JSON.stringify(payload, null, 2)}
    `.trim();
  }
}

/**
 * Queue or dispatch a notification into PostgreSQL NotificationOutbox table (or direct dispatch in memory mode)
 */
export async function queueNotification(eventType: string, payload: Record<string, unknown>): Promise<string | null> {
  const { chatId } = await getActiveTelegramCredentials();

  // 1. Try to record into PostgreSQL NotificationOutbox
  try {
    const outbox = await prisma.notificationOutbox.create({
      data: {
        eventType,
        channel: 'TELEGRAM',
        recipient: chatId || 'UNCONFIGURED',
        payload: JSON.parse(JSON.stringify(payload)),
        status: 'PENDING',
      },
    });

    // Proactively attempt delivery asynchronously
    setTimeout(() => {
      processOutboxItem(outbox.id).catch((err) => console.error('[TELEGRAM_ASYNC_DISPATCH_FAIL]', err));
    }, 100);

    return outbox.id;
  } catch (err) {
    // 2. Direct Fallback if PostgreSQL is unreachable or table doesn't exist
    console.warn('[OUTBOX_QUEUE_FALLBACK_DIRECT_DISPATCH]', err instanceof Error ? err.message : err);
    setTimeout(async () => {
      try {
        const messageHtml = formatTelegramNotificationHtml(eventType, payload);
        const res = await sendTelegramMessage(messageHtml);
        if (!res.success) {
          console.warn('[TELEGRAM_DIRECT_DISPATCH_FAILED]', res.error);
        } else {
          console.log(`[TELEGRAM_DIRECT_DISPATCH_SUCCESS] Event: ${eventType}`);
        }
      } catch (directErr) {
        console.error('[TELEGRAM_DIRECT_DISPATCH_ERROR]', directErr);
      }
    }, 100);
    return 'direct-dispatch';
  }
}

/**
 * Format and process a single outbox item
 */
export async function processOutboxItem(outboxId: string): Promise<boolean> {
  let item: any = null;
  try {
    item = await prisma.notificationOutbox.findUnique({
      where: { id: outboxId },
    });
  } catch (e) {
    console.warn('[OUTBOX_FETCH_FAIL]', e);
    return false;
  }

  if (!item || item.status === 'SENT') return true;

  const payload = item.payload as Record<string, unknown>;
  const messageHtml = formatTelegramNotificationHtml(item.eventType, payload);

  const result = await sendTelegramMessage(messageHtml);

  if (result.success) {
    try {
      await prisma.notificationOutbox.update({
        where: { id: outboxId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          lastError: null,
        },
      });
    } catch {
      // ignore
    }
    return true;
  } else {
    try {
      await prisma.notificationOutbox.update({
        where: { id: outboxId },
        data: {
          status: item.retryCount >= 5 ? 'FAILED' : 'PENDING',
          retryCount: { increment: 1 },
          lastError: result.error,
          nextRetryAt: new Date(Date.now() + Math.min(1000 * 60 * Math.pow(2, item.retryCount), 1000 * 60 * 30)),
        },
      });
    } catch {
      // ignore
    }
    return false;
  }
}
