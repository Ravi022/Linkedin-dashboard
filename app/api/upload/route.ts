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

    // Verify required files exist
    const requiredFiles = [
      'Invitations.csv',
      'messages.csv',
      'Rich_Media.csv',
      'Connections.csv',
      path.join('Jobs', 'Online Job Postings.csv'),
    ];

    const missingFiles: string[] = [];
    for (const filePath of requiredFiles) {
      const fullPath = path.join(extractDir, filePath);
      if (!fs.existsSync(fullPath)) {
        missingFiles.push(filePath);
      }
    }

    if (missingFiles.length > 0) {
      return NextResponse.json(
        { error: `Missing required files: ${missingFiles.join(', ')}` },
        { status: 400 }
      );
    }

    // Store the export date in a config file
    const configPath = path.join(uploadsDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ currentExport: exportDate }));

    return NextResponse.json({
      success: true,
      message: 'File processed successfully',
      exportDate,
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process file' },
      { status: 500 }
    );
  }
}

