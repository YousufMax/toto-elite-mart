import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'integrations:write')) {
      return NextResponse.json({ error: 'Unauthorized. Integration management permissions required.' }, { status: 403 });
    }

    const { customToken, customChatId } = await req.json().catch(() => ({}));

    const testMessage = `
✅ <b>TELEGRAM NOTIFICATION TEST SUCCESSFUL!</b>
━━━━━━━━━━━━━━━━━━
🏢 <b>Store:</b> Toto Elite Mart
👤 <b>Triggered By:</b> ${user.fullName} (${user.email})
⏰ <b>Timestamp:</b> ${new Date().toLocaleString('en-BD')}
━━━━━━━━━━━━━━━━━━
<i>Your Telegram bot is actively connected and ready to broadcast instant operational alerts!</i>
    `.trim();

    const result = await sendTelegramMessage(testMessage, customToken, customChatId);

    // Fetch outbox log
    let outbox: any[] = [];
    try {
      outbox = await prisma.notificationOutbox.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: result.success,
      error: result.error,
      outbox,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
