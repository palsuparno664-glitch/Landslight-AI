import { NextRequest, NextResponse } from 'next/server';
import { backendRequest } from '@/lib/backend';
import type { LoginResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const response = await backendRequest('/api/v1/auth/login', { method: 'POST', body: await req.text() });
    const data = await response.json();

    if (!response.ok || data.status !== 'success' || !data.token) {
      return NextResponse.json(
        { error: data.detail || 'Login failed. Check your credentials.' },
        { status: response.status === 200 ? 401 : response.status }
      );
    }

    const session: LoginResponse = { status: data.status, role: data.role, user: data.user };
    const res = NextResponse.json(session);
    res.cookies.set('ls_session', data.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 12 * 60 * 60,
    });
    return res;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reach the LANDSIGHT identity service', details: String(error) },
      { status: 503 }
    );
  }
}