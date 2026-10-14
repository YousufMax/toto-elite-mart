import { NextResponse } from 'next/server';
import { getDashboardMetrics } from '@/lib/data-store';
import { getSessionUser, hasPermission } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'reports:read')) {
      return NextResponse.json({ error: 'Unauthorized. Reports access required.' }, { status: 403 });
    }

    const metrics = await getDashboardMetrics();
    return NextResponse.json({ success: true, metrics });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
