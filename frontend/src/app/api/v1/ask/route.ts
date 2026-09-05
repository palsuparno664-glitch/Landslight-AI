import { NextRequest, NextResponse } from 'next/server';
import { backendRequest } from '@/lib/backend';

export async function POST(req: NextRequest) {
  try {
    const response = await backendRequest('/api/v1/ask', { method: 'POST', body: await req.text() });
    return new NextResponse(await response.text(), { status: response.status, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reach the LANDSIGHT Ask-AI engine', details: String(error) },
      { status: 503 }
    );
  }
}