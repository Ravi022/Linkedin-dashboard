import { NextResponse } from 'next/server';
import { getInvitations } from '@/lib/csvParser';

export async function GET() {
  try {
    const invitations = getInvitations();
    return NextResponse.json({ data: invitations });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

