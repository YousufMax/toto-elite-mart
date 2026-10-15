import { NextResponse } from 'next/server';
import {
  getStoreSettings,
  getAllOrders,
  getBlacklistedPhones,
  addBlacklistedPhone,
  removeBlacklistedPhone,
  getWhitelistedPhones,
  addWhitelistedPhone,
  removeWhitelistedPhone,
} from '@/lib/data-store';
import { getSessionUser } from '@/lib/auth';
import { evaluateOrderFraudRisk } from '@/lib/fraud-engine';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const blacklisted = await getBlacklistedPhones();
    const whitelisted = await getWhitelistedPhones();

    return NextResponse.json({
      success: true,
      blacklisted,
      whitelisted,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action || 'check';

    // Real-time risk check (used by checkout or admin)
    if (action === 'check') {
      const { phone, name, address, city, zone, subtotal, totalAmount, paymentMethod } = body;
      const settings = await getStoreSettings();
      const pastOrders = await getAllOrders();

      const evaluation = evaluateOrderFraudRisk({
        phone: phone || '',
        name: name || '',
        address: address || '',
        city: city || 'Dhaka',
        zone: zone || 'Inside Dhaka',
        subtotal: Number(subtotal) || 0,
        totalAmount: Number(totalAmount) || 0,
        paymentMethod: paymentMethod || 'COD',
        pastOrders,
        blacklistedPhones: settings.blacklistedPhones,
        whitelistedPhones: settings.whitelistedPhones,
        settings,
      });

      return NextResponse.json({
        success: true,
        evaluation,
      });
    }

    // Admin Blacklist/Whitelist actions
    const user = await getSessionUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }

    const { phone } = body;
    if (!phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }

    if (action === 'blacklist') {
      const updated = await addBlacklistedPhone(phone);
      return NextResponse.json({ success: true, message: 'Phone added to blacklist', blacklisted: updated });
    } else if (action === 'unblacklist') {
      const updated = await removeBlacklistedPhone(phone);
      return NextResponse.json({ success: true, message: 'Phone removed from blacklist', blacklisted: updated });
    } else if (action === 'whitelist') {
      const updated = await addWhitelistedPhone(phone);
      return NextResponse.json({ success: true, message: 'Phone added to whitelist', whitelisted: updated });
    } else if (action === 'unwhitelist') {
      const updated = await removeWhitelistedPhone(phone);
      return NextResponse.json({ success: true, message: 'Phone removed from whitelist', whitelisted: updated });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
