import { google } from 'googleapis';
import { prisma } from './prisma';
import { getAllOrders } from './data-store';

/**
 * Sanitize strings to prevent CSV/Spreadsheet formula injection
 * Values starting with =, +, -, @, or tab are escaped safely with a leading single quote.
 */
export function sanitizeSpreadsheetCell(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

export function getGoogleSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (
    !email ||
    email.startsWith('mock_') ||
    !privateKey ||
    privateKey.startsWith('mock_') ||
    !spreadsheetId ||
    spreadsheetId.startsWith('mock_')
  ) {
    return null;
  }

  // Handle newline escape characters in env string
  privateKey = privateKey.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return {
    sheets: google.sheets({ version: 'v4', auth }),
    spreadsheetId,
  };
}

export function getGoogleSheetsWebAppUrl(): string | null {
  const url = process.env.GOOGLE_SHEETS_WEBAPP_URL;
  if (!url || url.startsWith('mock_')) return null;
  return url;
}

export function isGoogleSheetsConfigured(): boolean {
  return getGoogleSheetsClient() !== null || getGoogleSheetsWebAppUrl() !== null;
}

/**
 * Push a single order directly to Google Sheets via Web App
 */
export async function pushOrderToGoogleSheets(order: any): Promise<{ success: boolean; error?: string }> {
  const webAppUrl = getGoogleSheetsWebAppUrl();
  if (!webAppUrl) return { success: false, error: 'Google Sheets Web App URL not configured.' };

  try {
    const payload = {
      action: 'NEW_ORDER',
      orderNumber: order.orderNumber,
      date: new Date(order.createdAt || Date.now()).toLocaleDateString('en-BD'),
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryCity: order.deliveryCity || 'Dhaka',
      deliveryAddress: order.deliveryAddress || '',
      itemsSummary: Array.isArray(order.items)
        ? order.items.map((i: any) => `${i.productName || 'Item'} (x${i.quantity || 1})`).join(', ')
        : '',
      subtotal: Number(order.subtotal) || 0,
      deliveryFee: Number(order.deliveryFee) || 60,
      totalAmount: Number(order.totalAmount) || 0,
      paymentMethod: order.paymentMethod || 'COD',
      paymentStatus: order.paymentStatus || 'UNPAID',
      orderStatus: order.orderStatus || 'PENDING',
      notes: order.notes || '',
    };

    const res = await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return { success: res.ok };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Verify spreadsheet connection and permissions
 */
export async function testSpreadsheetConnection(): Promise<{ success: boolean; title?: string; error?: string; type?: string }> {
  const webAppUrl = getGoogleSheetsWebAppUrl();
  if (webAppUrl) {
    try {
      const res = await fetch(webAppUrl, { method: 'GET' });
      return {
        success: true,
        title: 'TOTO ELITE MART (Apps Script Web App)',
        type: 'WEB_APP',
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reach Apps Script Web App',
      };
    }
  }

  const client = getGoogleSheetsClient();
  if (!client) {
    return {
      success: false,
      error: 'Google Service Account credentials or Web App URL not configured in environment variables.',
    };
  }

  try {
    const res = await client.sheets.spreadsheets.get({
      spreadsheetId: client.spreadsheetId,
    });
    return {
      success: true,
      title: res.data.properties?.title || 'Connected Spreadsheet',
      type: 'SERVICE_ACCOUNT',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reach Google Sheets API';
    return { success: false, error: message };
  }
}

/**
 * Ensure worksheet (tab) exists, or create it if missing
 */
async function ensureWorksheet(sheets: any, spreadsheetId: string, sheetTitle: string, headers: string[]) {
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = meta.data.sheets || [];
    const exists = existingSheets.some((s: any) => s.properties?.title === sheetTitle);

    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: sheetTitle },
              },
            },
          ],
        },
      });
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetTitle}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      });
    }
  } catch (e) {
    console.warn(`[WORKSHEET_CHECK_WARNING] ${sheetTitle}:`, e);
  }
}

/**
 * Full synchronization of transactional records to Google Sheets
 */
export async function syncDatabaseToGoogleSheets(syncType = 'FULL'): Promise<{
  success: boolean;
  recordsSynced: number;
  error?: string;
}> {
  const webAppUrl = getGoogleSheetsWebAppUrl();
  if (webAppUrl) {
    try {
      const orders = await getAllOrders();
      let syncedCount = 0;
      for (const ord of orders) {
        await pushOrderToGoogleSheets(ord);
        syncedCount++;
      }
      return { success: true, recordsSynced: syncedCount };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      return { success: false, recordsSynced: 0, error: msg };
    }
  }

  const client = getGoogleSheetsClient();
  if (!client) {
    return { success: false, recordsSynced: 0, error: 'Google Sheets is not configured or in mock mode.' };
  }

  try {
    let totalProcessed = 0;
    const { sheets, spreadsheetId } = client;

    // 1. Sync Products
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    const productHeaders = [
      'Product_ID',
      'SKU',
      'Name',
      'Category',
      'Purchase_Cost_BDT',
      'Selling_Price_BDT',
      'Sale_Price_BDT',
      'Stock_Quantity',
      'Status',
      'Updated_At',
    ];
    await ensureWorksheet(sheets, spreadsheetId, 'Products', productHeaders);

    const productRows = [
      productHeaders,
      ...products.map((p) => [
        p.id,
        sanitizeSpreadsheetCell(p.sku),
        sanitizeSpreadsheetCell(p.name),
        sanitizeSpreadsheetCell(p.category.name),
        Number(p.purchaseCost),
        Number(p.sellingPrice),
        p.salePrice ? Number(p.salePrice) : '',
        p.stockQuantity,
        p.status,
        p.updatedAt.toISOString(),
      ]),
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Products!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: productRows },
    });
    totalProcessed += products.length;

    // 2. Sync Orders
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const orderHeaders = [
      'Order_ID',
      'Order_Number',
      'Customer_Name',
      'Customer_Phone',
      'Delivery_City',
      'Subtotal_BDT',
      'Discount_BDT',
      'Delivery_Fee_BDT',
      'Total_Amount_BDT',
      'Payment_Method',
      'Payment_Status',
      'Order_Status',
      'Created_At',
    ];
    await ensureWorksheet(sheets, spreadsheetId, 'Orders', orderHeaders);

    const orderRows = [
      orderHeaders,
      ...orders.map((o) => [
        o.id,
        sanitizeSpreadsheetCell(o.orderNumber),
        sanitizeSpreadsheetCell(o.customerName),
        sanitizeSpreadsheetCell(o.customerPhone),
        sanitizeSpreadsheetCell(o.deliveryCity),
        Number(o.subtotal),
        Number(o.discount),
        Number(o.deliveryFee),
        Number(o.totalAmount),
        o.paymentMethod,
        o.paymentStatus,
        o.orderStatus,
        o.createdAt.toISOString(),
      ]),
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Orders!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: orderRows },
    });
    totalProcessed += orders.length;

    // 3. Sync Expenses
    const expenses = await prisma.expense.findMany({
      where: { isDeleted: false },
      orderBy: { expenseDate: 'desc' },
      take: 500,
    });

    const expenseHeaders = [
      'Expense_ID',
      'Date',
      'Category',
      'Description',
      'Amount_BDT',
      'Payment_Method',
      'Created_At',
    ];
    await ensureWorksheet(sheets, spreadsheetId, 'Expenses', expenseHeaders);

    const expenseRows = [
      expenseHeaders,
      ...expenses.map((e) => [
        e.id,
        e.expenseDate.toISOString().split('T')[0],
        sanitizeSpreadsheetCell(e.category),
        sanitizeSpreadsheetCell(e.description),
        Number(e.amount),
        e.paymentMethod,
        e.createdAt.toISOString(),
      ]),
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Expenses!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: expenseRows },
    });
    totalProcessed += expenses.length;

    return { success: true, recordsSynced: totalProcessed };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Google Sheets API error';
    return { success: false, recordsSynced: 0, error: errorMsg };
  }
}
