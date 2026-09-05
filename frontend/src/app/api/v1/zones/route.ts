import { NextResponse } from 'next/server';
import { backendRequest } from '@/lib/backend';

export async function GET() {
  try {
    const response = await backendRequest('/api/v1/zones');
    return new NextResponse(await response.text(), { status: response.status, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return NextResponse.json({ error: 'Risk backend unavailable', details: String(error) }, { status: 503 });
  }
}
