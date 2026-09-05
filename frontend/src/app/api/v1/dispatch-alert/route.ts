import { NextRequest, NextResponse } from 'next/server';
import { backendRequest } from '@/lib/backend';

export async function POST(req: NextRequest) {
  try {
    const response = await backendRequest('/api/v1/dispatch-alert', { method: 'POST', body: await req.text() });
    return new NextResponse(await response.text(), { status: response.status, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process dispatch alert', details: String(error) },
      { status: 503 }
    );
  }
}
