import { NextResponse } from 'next/server';
import { updateOrderStatus, getOrderByNumber, deleteOrder } from '@/lib/data-store';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'orders:read')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const order = await getOrderByNumber(params.id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'orders:status')) {
      return NextResponse.json({ error: 'Unauthorized. Order status update permissions required.' }, { status: 403 });
    }

    const { status, paymentStatus, internalNotes } = await req.json();

    if (status) {
      await updateOrderStatus(params.id, status, internalNotes, user.userId);
    }

    if (paymentStatus) {
      try {
        await prisma.order.update({
          where: { id: params.id },
          data: { paymentStatus },
        });
      } catch {
        // in-memory fallback handled in updateOrderStatus
      }
    }

    await logAudit({
      userId: user.userId,
      action: 'UPDATE_ORDER',
      entityType: 'ORDER',
      entityId: params.id,
      afterState: { status, paymentStatus, internalNotes },
    });

    return NextResponse.json({ success: true, message: 'Order updated successfully' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    
    // STRICT SECURITY GATE: Only SUPER_ADMIN can delete orders
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only Super Administrators can permanently delete customer orders.' },
        { status: 403 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // empty body fallback
    }

    const restoreInventory = body.restoreInventory !== false;
    const reason = body.reason || 'Purged by Super Admin';

    const result = await deleteOrder(params.id, {
      restoreInventory,
      reason,
      employeeId: user.userId,
    });

    return NextResponse.json({
      success: true,
      message: `Order ${result.orderNumber || params.id} deleted successfully.`,
      orderNumber: result.orderNumber,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to delete order';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}

