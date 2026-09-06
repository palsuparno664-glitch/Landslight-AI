import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session';

export async function GET(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get('ls_session')?.value);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json({
    role: session.role,
    user: {
      id: session.sub,
      name: session.name,
      state: session.state,
      district: session.district ?? null,
      department: session.department ?? null,
    },
  });
}