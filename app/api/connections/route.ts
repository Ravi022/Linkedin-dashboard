import { NextResponse } from 'next/server';
import { getConnections } from '@/lib/csvParser';

export async function GET() {
  try {
    const connections = getConnections();
    return NextResponse.json({ data: connections || [] });
  } catch (error) {
    console.warn('Could not fetch connections (file may be missing):', error);
    // Return empty array instead of error - handle gracefully
    return NextResponse.json({ data: [] });
  }
}

