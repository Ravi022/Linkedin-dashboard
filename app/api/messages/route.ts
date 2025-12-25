import { NextResponse } from 'next/server';
import { getMessages } from '@/lib/csvParser';

export async function GET() {
  try {
    const messages = getMessages();
    return NextResponse.json({ data: messages || [] });
  } catch (error) {
    console.warn('Could not fetch messages (file may be missing):', error);
    // Return empty array instead of error - handle gracefully
    return NextResponse.json({ data: [] });
  }
}

