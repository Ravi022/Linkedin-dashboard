import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

export interface Invitation {
  From: string;
  To: string;
  'Sent At': string;
  Message: string;
  Direction: string;
  inviterProfileUrl: string;
  inviteeProfileUrl: string;
}

export interface JobPosting {
  'Company Name': string;
  Title: string;
  'Employment Status': string;
  'Company Description': string;
  'Job Description': string;
  'Location Description': string;
  'Job Functions': string;
  'Company Industries': string;
  'Seniority Level': string;
  'Required Skills': string;
  'Education Levels': string;
  'Onsite Apply': string;
  'Contact Email': string;
  'Company Apply Url': string;
  'Base Salary': string;
  'Additional Compensation': string;
  'Job State': string;
  'Create Date': string;
  'List Date': string;
  'Close Date': string;
  'Expiration Date': string;
}

export interface Message {
  'CONVERSATION ID': string;
  'CONVERSATION TITLE': string;
  FROM: string;
  'SENDER PROFILE URL': string;
  TO: string;
  'RECIPIENT PROFILE URLS': string;
  DATE: string;
  SUBJECT: string;
  CONTENT: string;
  FOLDER: string;
  ATTACHMENTS: string;
  'IS MESSAGE DRAFT': string;
}

export interface RichMedia {
  'Date/Time': string;
  'Media Description': string;
  'Media Link': string;
}

export interface Connection {
  'First Name': string;
  'Last Name': string;
  URL: string;
  'Email Address': string;
  Company: string;
  Position: string;
  'Connected On': string;
}

// Get the data directory - check uploads first, then fallback to parent directory
function getDataDir(): string {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const configPath = path.join(uploadsDir, 'config.json');
  
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const exportDir = path.join(uploadsDir, `Basic_LinkedInDataExport_${config.currentExport}`);
      if (fs.existsSync(exportDir)) {
        return exportDir;
      }
    } catch (e) {
      console.error('Error reading config:', e);
    }
  }
  
  // Fallback to parent directory
  return path.resolve(process.cwd(), '..', 'Basic_LinkedInDataExport_12-24-2025');
}

const DATA_DIR = getDataDir();

function parseCSV<T>(filePath: string): T[] {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return [];
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const result = Papa.parse<T>(fileContent, {
      header: true,
      skipEmptyLines: true,
    });
    return result.data;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return [];
  }
}

export function getInvitations(): Invitation[] {
  const filePath = path.join(DATA_DIR, 'Invitations.csv');
  return parseCSV<Invitation>(filePath);
}

export function getJobPostings(): JobPosting[] {
  const filePath = path.join(DATA_DIR, 'Jobs', 'Online Job Postings.csv');
  return parseCSV<JobPosting>(filePath);
}

export function getMessages(): Message[] {
  const filePath = path.join(DATA_DIR, 'messages.csv');
  return parseCSV<Message>(filePath);
}

export function getRichMedia(): RichMedia[] {
  const filePath = path.join(DATA_DIR, 'Rich_Media.csv');
  return parseCSV<RichMedia>(filePath);
}

export function getConnections(): Connection[] {
  const filePath = path.join(DATA_DIR, 'Connections.csv');
  
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return [];
    }
    
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Split into lines
    const lines = fileContent.split('\n');
    
    // Find the header row (should be "First Name,Last Name,URL,Email Address,Company,Position,Connected On")
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('First Name,Last Name')) {
        headerIndex = i;
        break;
      }
    }
    
    if (headerIndex === -1) {
      console.error('Could not find header row in Connections.csv');
      return [];
    }
    
    // Get the content starting from the header row
    const contentFromHeader = lines.slice(headerIndex).join('\n');
    
    // Parse with PapaParse
    const result = Papa.parse<Connection>(contentFromHeader, {
      header: true,
      skipEmptyLines: true,
    });
    
    // Filter out rows that don't have proper data
    const filtered = result.data.filter(conn => {
      const firstName = conn['First Name']?.trim();
      const lastName = conn['Last Name']?.trim();
      const connectedOn = conn['Connected On']?.trim();
      
      // Exclude rows that are clearly notes or invalid data
      return firstName && 
             lastName && 
             connectedOn && 
             firstName !== 'Notes:' &&
             !firstName.toLowerCase().includes('when exporting') &&
             !firstName.toLowerCase().includes('first name');
    });
    
    console.log(`Parsed ${filtered.length} connections from Connections.csv`);
    return filtered;
  } catch (error) {
    console.error(`Error parsing Connections.csv:`, error);
    return [];
  }
}

