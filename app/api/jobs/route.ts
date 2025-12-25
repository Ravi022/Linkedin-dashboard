import { NextResponse } from 'next/server';
import { getJobPostings } from '@/lib/csvParser';

export async function GET() {
  try {
    const jobs = getJobPostings();
    return NextResponse.json({ data: jobs });
  } catch (error) {
    console.error('Error fetching job postings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job postings' },
      { status: 500 }
    );
  }
}

