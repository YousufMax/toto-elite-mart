import { NextResponse } from 'next/server';
import { getUploadAuthParams } from '@/lib/imagekit';
import { getSessionUser, hasPermission } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'products:write')) {
      return NextResponse.json({ error: 'Unauthorized. Only authorized administrators can upload assets.' }, { status: 403 });
    }

    const authParams = getUploadAuthParams();
    return NextResponse.json({ success: true, ...authParams });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
