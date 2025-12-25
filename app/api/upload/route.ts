import { NextRequest, NextResponse } from 'next/server';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Use /tmp directory for Vercel serverless (only writable directory)
    // In local development, use process.cwd()/uploads
    const uploadsDir = process.env.VERCEL 
      ? path.join('/tmp', 'uploads')
      : path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Extract the date from filename or use current date
    const fileName = file.name;
    const dateMatch = fileName.match(/Basic_LinkedInDataExport_(\d{2}-\d{2}-\d{4})/i);
    const exportDate = dateMatch ? dateMatch[1] : new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    
    const extractDir = path.join(uploadsDir, `Basic_LinkedInDataExport_${exportDate}`);
    
    // Remove existing directory if it exists
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
    }
    fs.mkdirSync(extractDir, { recursive: true });

    // Save uploaded file temporarily
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempZipPath = path.join(uploadsDir, `temp_${Date.now()}.zip`);
    fs.writeFileSync(tempZipPath, buffer);

    // Extract ZIP file
    const zip = new AdmZip(tempZipPath);
    zip.extractAllTo(extractDir, true);

    // Clean up temp file
    fs.unlinkSync(tempZipPath);

    // Check which files exist (all are optional - handle gracefully)
    const optionalFiles = [
      'Invitations.csv',
      'messages.csv',
      'Rich_Media.csv',
      'Connections.csv',
      path.join('Jobs', 'Online Job Postings.csv'),
    ];

    const existingFiles: string[] = [];
    const missingFiles: string[] = [];
    for (const filePath of optionalFiles) {
      const fullPath = path.join(extractDir, filePath);
      if (fs.existsSync(fullPath)) {
        existingFiles.push(filePath);
      } else {
        missingFiles.push(filePath);
      }
    }

    if (existingFiles.length === 0) {
      return NextResponse.json(
        { error: 'No valid CSV files found in the ZIP archive. Please ensure your LinkedIn export contains at least one CSV file.' },
        { status: 400 }
      );
    }

    // Log missing files but continue processing
    if (missingFiles.length > 0) {
      console.warn(`Some optional files are missing: ${missingFiles.join(', ')}. Continuing with available files.`);
    }

    // Store the export date in a config file
    const configPath = path.join(uploadsDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ currentExport: exportDate }));

    // In serverless environments, we need to process and return data immediately
    // because /tmp is not shared between function invocations
    // Import and process all data here - handle missing files gracefully
    const { getInvitations, getJobPostings, getMessages, getRichMedia, getConnections } = await import('@/lib/csvParser');
    
    // Force refresh the data directory
    const csvParser = await import('@/lib/csvParser');
    // Clear any cached directory path
    delete (csvParser as any).DATA_DIR;
    
    // Process each file individually with error handling
    let invitations: any[] = [];
    let jobs: any[] = [];
    let messages: any[] = [];
    let richMedia: any[] = [];
    let connections: any[] = [];

    try {
      invitations = getInvitations();
      console.log(`Loaded ${invitations.length} invitations`);
    } catch (error) {
      console.warn('Could not load invitations:', error);
      invitations = [];
    }

    try {
      jobs = getJobPostings();
      console.log(`Loaded ${jobs.length} job postings`);
    } catch (error) {
      console.warn('Could not load job postings:', error);
      jobs = [];
    }

    try {
      messages = getMessages();
      console.log(`Loaded ${messages.length} messages`);
    } catch (error) {
      console.warn('Could not load messages:', error);
      messages = [];
    }

    try {
      richMedia = getRichMedia();
      console.log(`Loaded ${richMedia.length} rich media items`);
    } catch (error) {
      console.warn('Could not load rich media:', error);
      richMedia = [];
    }

    try {
      connections = getConnections();
      console.log(`Loaded ${connections.length} connections`);
    } catch (error) {
      console.warn('Could not load connections:', error);
      connections = [];
    }

    return NextResponse.json({
      success: true,
      message: 'File processed successfully',
      exportDate,
      data: {
        invitations,
        jobs,
        messages,
        richMedia,
        connections,
      },
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process file' },
      { status: 500 }
    );
  }
}

