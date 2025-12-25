import { NextResponse } from 'next/server';
import { getConnections } from '@/lib/csvParser';

export async function GET() {
  try {
    const connections = getConnections();
    return NextResponse.json({ data: connections });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

