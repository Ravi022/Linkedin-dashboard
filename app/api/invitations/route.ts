import { NextResponse } from 'next/server';
import { getInvitations } from '@/lib/csvParser';

export async function GET() {
  try {
    const invitations = getInvitations();
    return NextResponse.json({ data: invitations || [] });
  } catch (error) {
    console.warn('Could not fetch invitations (file may be missing):', error);
    // Return empty array instead of error - handle gracefully
    return NextResponse.json({ data: [] });
  }
}

