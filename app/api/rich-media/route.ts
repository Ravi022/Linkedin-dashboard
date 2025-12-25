import { NextResponse } from 'next/server';
import { getRichMedia } from '@/lib/csvParser';

export async function GET() {
  try {
    const richMedia = getRichMedia();
    return NextResponse.json({ data: richMedia });
  } catch (error) {
    console.error('Error fetching rich media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rich media' },
      { status: 500 }
    );
  }
}

