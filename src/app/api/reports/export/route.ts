import { NextRequest, NextResponse } from 'next/server';
import { getComprehensiveFinancialReport, FinancialTimeRange } from '@/lib/financial-analytics';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  // Mitigate CSV Formula Injection
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'` + str;
  }
  // Escape quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'reports:read')) {
      return NextResponse.json({ error: 'Unauthorized. Reports access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const exportType = searchParams.get('type') || 'summary';
    const range = (searchParams.get('range') as FinancialTimeRange) || 'this_month';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const report = await getComprehensiveFinancialReport({
      range,
      startDate,
      endDate,
    });

    let filename = `financial-${exportType}-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    const rows: string[][] = [];

    if (exportType === 'products') {
      rows.push([
        'Product Name',
        'SKU',
        'Category',
        'Units Sold',
        'Delivered Revenue (BDT)',
        'Total Cost / COGS (BDT)',
        'Gross Profit (BDT)',
        'Gross Margin %',
      ]);
      for (const item of report.productProfitability) {
        rows.push([
          item.productName,
          item.sku,
          item.categoryName,
          String(item.unitsSold),
          String(item.totalRevenue),
          String(item.totalCost),
          String(item.grossProfit),
          `${item.marginPercent}%`,
        ]);
      }
    } else if (exportType === 'orders') {
      rows.push([
        'Order #',
        'Date Placed',
        'Customer Name',
        'Customer Phone',
        'Order Status',
        'Payment Status',
        'Payment Method',
        'Subtotal (BDT)',
        'Discount (BDT)',
        'Delivery Fee (BDT)',
        'Total (BDT)',
        'COGS (BDT)',
        'Gross Profit (BDT)',
        'Net Contribution (BDT)',
      ]);
      for (const order of report.orderLedger) {
        rows.push([
          order.orderNumber,
          new Date(order.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }),
          order.customerName,
          order.customerPhone,
          order.orderStatus,
          order.paymentStatus,
          order.paymentMethod,
          String(order.subtotal),
          String(order.discount),
          String(order.deliveryFee),
          String(order.totalAmount),
          String(order.cogs),
          String(order.grossProfit),
          String(order.netContribution),
        ]);
      }
    } else {
      // Summary Statement
      rows.push(['TOTO ELITE MART - EXECUTIVE FINANCIAL STATEMENT']);
      rows.push([`Reporting Period: ${report.filter.startDate} to ${report.filter.endDate} (${report.filter.range})`]);
      rows.push([`Comparison Period: ${report.filter.previousStartDate} to ${report.filter.previousEndDate}`]);
      rows.push([]);
      rows.push(['METRIC', 'CURRENT PERIOD (BDT)', 'PREVIOUS PERIOD (BDT)', 'CHANGE %', 'TREND']);
      rows.push([
        'Total Booked Sales (GMV)',
        String(report.summary.bookedSales.current),
        String(report.summary.bookedSales.previous),
        `${report.summary.bookedSales.changePercent}%`,
        report.summary.bookedSales.trend,
      ]);
      rows.push([
        'Recognized Delivered Revenue',
        String(report.summary.deliveredRevenue.current),
        String(report.summary.deliveredRevenue.previous),
        `${report.summary.deliveredRevenue.changePercent}%`,
        report.summary.deliveredRevenue.trend,
      ]);
      rows.push([
        'Actual Cash Collections',
        String(report.summary.cashCollected.current),
        String(report.summary.cashCollected.previous),
        `${report.summary.cashCollected.changePercent}%`,
        report.summary.cashCollected.trend,
      ]);
      rows.push([
        'Outstanding Receivables',
        String(report.summary.outstandingReceivables.current),
        String(report.summary.outstandingReceivables.previous),
        `${report.summary.outstandingReceivables.changePercent}%`,
        report.summary.outstandingReceivables.trend,
      ]);
      rows.push([
        'Cost of Goods Sold (COGS)',
        String(report.summary.cogs.current),
        String(report.summary.cogs.previous),
        `${report.summary.cogs.changePercent}%`,
        report.summary.cogs.trend,
      ]);
      rows.push([
        'Gross Profit',
        String(report.summary.grossProfit.current),
        String(report.summary.grossProfit.previous),
        `${report.summary.grossProfit.changePercent}%`,
        report.summary.grossProfit.trend,
      ]);
      rows.push(['Gross Margin %', `${report.summary.grossMarginPercent}%`, '-', '-', '-']);
      rows.push([
        'Delivery Fee Revenue',
        String(report.summary.deliveryRevenue.current),
        String(report.summary.deliveryRevenue.previous),
        `${report.summary.deliveryRevenue.changePercent}%`,
        report.summary.deliveryRevenue.trend,
      ]);
      rows.push([
        'Delivery Logistics Cost',
        String(report.summary.deliveryCost.current),
        String(report.summary.deliveryCost.previous),
        `${report.summary.deliveryCost.changePercent}%`,
        report.summary.deliveryCost.trend,
      ]);
      rows.push([
        'Operating Expenses (OPEX)',
        String(report.summary.operatingExpenses.current),
        String(report.summary.operatingExpenses.previous),
        `${report.summary.operatingExpenses.changePercent}%`,
        report.summary.operatingExpenses.trend,
      ]);
      rows.push([
        'Refunds & Returns',
        String(report.summary.refundsAndReturns.current),
        String(report.summary.refundsAndReturns.previous),
        `${report.summary.refundsAndReturns.changePercent}%`,
        report.summary.refundsAndReturns.trend,
      ]);
      rows.push([
        'Net Profit',
        String(report.summary.netProfit.current),
        String(report.summary.netProfit.previous),
        `${report.summary.netProfit.changePercent}%`,
        report.summary.netProfit.trend,
      ]);
      rows.push(['Net Margin %', `${report.summary.netMarginPercent}%`, '-', '-', '-']);
      rows.push([]);
      rows.push(['COD TRACKING', 'VOLUME (BDT)']);
      rows.push(['Total COD Booked', String(report.codTracking.bookedVolume)]);
      rows.push(['COD Collected & Settled', String(report.codTracking.collectedVolume)]);
      rows.push(['COD In Transit / Custody', String(report.codTracking.inTransitVolume)]);
      rows.push(['COD Returned / Cancelled', String(report.codTracking.returnedVolume)]);
      rows.push(['Collection Rate %', `${report.codTracking.collectionRatePercent}%`]);
    }

    const csvBody = rows.map((r) => r.map(escapeCsvCell).join(',')).join('\r\n');
    const bom = '\uFEFF';
    const csvContent = bom + csvBody;

    logAudit({
      userId: user.userId,
      action: 'EXPORT_FINANCIAL_REPORT',
      entityType: 'REPORT',
      entityId: exportType,
      afterState: { exportType, range, startDate, endDate, userEmail: user.email },
    }).catch((err) => console.error('[Report Export Audit Error]:', err));

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error exporting financial report';
    console.error('[Financial Export Error]:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
