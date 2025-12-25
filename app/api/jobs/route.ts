import { NextResponse } from 'next/server';
import { getJobPostings } from '@/lib/csvParser';

export async function GET() {
  try {
    const jobs = getJobPostings();
    return NextResponse.json({ data: jobs || [] });
  } catch (error) {
    console.warn('Could not fetch job postings (file may be missing):', error);
    // Return empty array instead of error - handle gracefully
    return NextResponse.json({ data: [] });
  }
}

