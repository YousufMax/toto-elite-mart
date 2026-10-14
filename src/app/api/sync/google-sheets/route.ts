import { NextResponse } from 'next/server';
import { syncDatabaseToGoogleSheets, testSpreadsheetConnection, isGoogleSheetsConfigured } from '@/lib/google-sheets';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const isConfigured = isGoogleSheetsConfigured();
    let connectionTest: { success: boolean; title?: string; error?: string } = {
      success: false,
      error: 'Not configured',
    };

    if (isConfigured) {
      connectionTest = await testSpreadsheetConnection();
    }

    let recentRuns: any[] = [];
    try {
      recentRuns = await prisma.syncRun.findMany({
        orderBy: { startedAt: 'desc' },
        take: 10,
      });
    } catch {
      // ignore if DB is offline
    }

    return NextResponse.json({
      success: true,
      isConfigured,
      connectionTest,
      recentRuns,
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || 'Not set',
      webAppUrl: process.env.GOOGLE_SHEETS_WEBAPP_URL || null,
      deploymentId: process.env.GOOGLE_SHEETS_DEPLOYMENT_ID || null,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'integrations:write')) {
      return NextResponse.json({ error: 'Unauthorized. Integration management permissions required.' }, { status: 403 });
    }

    const { syncType } = await req.json().catch(() => ({ syncType: 'FULL' }));
    const result = await syncDatabaseToGoogleSheets(syncType || 'FULL');

    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Sync failure';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
