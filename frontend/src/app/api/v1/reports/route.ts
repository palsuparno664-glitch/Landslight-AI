import { NextRequest, NextResponse } from 'next/server';
import { backendRequest } from '@/lib/backend';

export async function GET() {
  try {
    const response = await backendRequest('/api/v1/reports');
    return new NextResponse(await response.text(), { status: response.status, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return NextResponse.json({ error: 'Risk backend unavailable', details: String(error) }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const response = await backendRequest('/api/v1/reports', { method: 'POST', body: await req.text() });
    return new NextResponse(await response.text(), { status: response.status, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to submit report', details: String(error) },
      { status: 500 }
    );
  }
}
