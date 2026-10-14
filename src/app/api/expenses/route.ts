import { NextResponse } from 'next/server';
import { getExpenses, addExpense } from '@/lib/data-store';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'expenses:read')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const expenses = await getExpenses();
    return NextResponse.json({ success: true, count: expenses.length, expenses });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'expenses:write')) {
      return NextResponse.json({ error: 'Unauthorized. Expense write permissions required.' }, { status: 403 });
    }

    const { category, description, amount, paymentMethod } = await req.json();

    if (!category || !description || !amount) {
      return NextResponse.json({ error: 'Category, description, and amount are required' }, { status: 400 });
    }

    const expense = await addExpense({
      category,
      description,
      amount: Number(amount),
      paymentMethod: paymentMethod || 'COD',
      createdById: user.userId,
    });

    await logAudit({
      userId: user.userId,
      action: 'CREATE_EXPENSE',
      entityType: 'EXPENSE',
      entityId: expense.id,
      afterState: { category, description, amount },
    });

    return NextResponse.json({ success: true, expense });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
