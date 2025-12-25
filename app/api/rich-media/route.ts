import { NextResponse } from 'next/server';
import { getRichMedia } from '@/lib/csvParser';

export async function GET() {
  try {
    const richMedia = getRichMedia();
    return NextResponse.json({ data: richMedia || [] });
  } catch (error) {
    console.warn('Could not fetch rich media (file may be missing):', error);
    // Return empty array instead of error - handle gracefully
    return NextResponse.json({ data: [] });
  }
}

