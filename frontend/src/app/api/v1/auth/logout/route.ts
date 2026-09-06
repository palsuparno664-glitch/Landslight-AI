import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ status: 'success' });
  res.cookies.set('ls_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}