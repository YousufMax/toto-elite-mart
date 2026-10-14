import { NextResponse } from 'next/server';
import { changeUserPassword } from '@/lib/data-store';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // Allow user to change their own password OR require employees:write permission
    const isSelf = session.userId === params.id;
    if (!isSelf && !hasPermission(session.role, 'employees:write')) {
      return NextResponse.json({ error: 'Unauthorized. Staff password management permissions required.' }, { status: 403 });
    }

    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    await changeUserPassword(params.id, newPassword);

    await logAudit({
      userId: session.userId,
      action: isSelf ? 'CHANGE_OWN_PASSWORD' : 'RESET_EMPLOYEE_PASSWORD',
      entityType: 'USER',
      entityId: params.id,
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully!' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
