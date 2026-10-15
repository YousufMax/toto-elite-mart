import { NextRequest, NextResponse } from 'next/server';
import { getComprehensiveFinancialReport, FinancialTimeRange } from '@/lib/financial-analytics';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'reports:read')) {
      return NextResponse.json({ error: 'Unauthorized. Reports access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = (searchParams.get('range') as FinancialTimeRange) || 'this_month';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const report = await getComprehensiveFinancialReport({
      range,
      startDate,
      endDate,
    });

    // Fire and forget audit log to keep report fast
    logAudit({
      userId: user.userId,
      action: 'VIEW_FINANCIAL_REPORT',
      entityType: 'REPORT',
      entityId: range,
      afterState: { range, startDate, endDate, userEmail: user.email },
    }).catch((err) => console.error('[Report Audit Error]:', err));

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error generating financial report';
    console.error('[Financial Report Error]:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

