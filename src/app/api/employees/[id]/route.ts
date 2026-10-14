import { NextResponse } from 'next/server';
import { updateUser, deleteUser, getUserById } from '@/lib/data-store';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'employees:write')) {
      return NextResponse.json({ error: 'Unauthorized. Staff management permissions required.' }, { status: 403 });
    }

    const body = await req.json();
    const { fullName, email, phone, role, status, customPermissions } = body;

    const updated = await updateUser(params.id, {
      fullName,
      email,
      phone,
      role,
      status,
      customPermissions,
    });

    await logAudit({
      userId: session.userId,
      action: 'UPDATE_EMPLOYEE',
      entityType: 'USER',
      entityId: params.id,
      afterState: { email: updated.email, role: updated.role, status: updated.status },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'employees:write')) {
      return NextResponse.json({ error: 'Unauthorized. Staff management permissions required.' }, { status: 403 });
    }

    await deleteUser(params.id);

    await logAudit({
      userId: session.userId,
      action: 'DEACTIVATE_EMPLOYEE',
      entityType: 'USER',
      entityId: params.id,
    });

    return NextResponse.json({ success: true, message: 'Employee account deactivated.' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
