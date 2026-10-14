import { NextResponse } from 'next/server';
import { getAllUsers, createUser } from '@/lib/data-store';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'employees:read')) {
      return NextResponse.json({ error: 'Unauthorized. Staff view permissions required.' }, { status: 403 });
    }

    const users = await getAllUsers();
    return NextResponse.json({
      success: true,
      count: users.length,
      users,
      currentUser: {
        id: user.userId,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'employees:write')) {
      return NextResponse.json({ error: 'Unauthorized. Staff management permissions required.' }, { status: 403 });
    }

    const body = await req.json();
    const { fullName, email, phone, role, password, status, customPermissions } = body;

    if (!fullName || !email || !password || !role) {
      return NextResponse.json({ error: 'Full name, email, password, and role are required.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    // BD Phone validation if provided
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length > 0 && !/^01[3-9]\d{8}$/.test(cleanPhone)) {
        return NextResponse.json({ error: 'Invalid Bangladeshi mobile number format (e.g. 01712345678).' }, { status: 400 });
      }
    }

    const newUser = await createUser({
      fullName,
      email,
      phone,
      role,
      password,
      status: status || 'ACTIVE',
      customPermissions: Array.isArray(customPermissions) ? customPermissions : [],
    });

    await logAudit({
      userId: session.userId,
      action: 'CREATE_EMPLOYEE',
      entityType: 'USER',
      entityId: newUser.id,
      afterState: { email: newUser.email, role: newUser.role, fullName: newUser.fullName },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
