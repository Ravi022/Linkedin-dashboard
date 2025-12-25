# LinkedIn Data Analytics Dashboard

A professional Next.js dashboard for analyzing LinkedIn data exports. This application provides comprehensive insights and statistics from your LinkedIn data, including invitations, job postings, messages, and rich media.

## Features

- **Comprehensive Statistics**: View key metrics and statistics for all your LinkedIn data
- **Interactive Data Tables**: Browse through invitations, job postings, messages, and rich media with pagination
- **Advanced Filtering**: Filter data by various criteria (direction, status, folder, etc.)
- **Search Functionality**: Search across all data fields
- **Export to CSV**: Export filtered data to CSV files
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Mode Support**: Built-in dark mode support

## Getting Started

### Prerequisites

- Node.js 18+ installed
- LinkedIn data export in the format: `Basic_LinkedInDataExport_MM-DD-YYYY`

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Make sure your LinkedIn data export is in the parent directory:
```
linkedin/
├── Basic_LinkedInDataExport_12-24-2025/
│   ├── Invitations.csv
│   ├── Jobs/
│   │   └── Online Job Postings.csv
│   ├── messages.csv
│   └── Rich_Media.csv
└── frontend/
```

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Data Sources

The dashboard analyzes the following CSV files from your LinkedIn export:

1. **Invitations.csv**: Connection invitations sent and received
2. **Jobs/Online Job Postings.csv**: Job postings created
3. **messages.csv**: LinkedIn messages and conversations
4. **Rich_Media.csv**: Uploaded photos and media

## Dashboard Sections

### Statistics Overview
- Total invitations (outgoing/incoming breakdown)
- Job postings (active/closed/draft status)
- Messages (inbox/sent/drafts)
- Rich media (profile photos, feed photos, background photos)

### Data Tables
Each section provides:
- Sortable columns
- Search functionality
- Pagination
- Export to CSV
- Advanced filtering options

## Technologies Used

- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **PapaParse**: CSV parsing library
- **Lucide React**: Icon library
- **date-fns**: Date formatting utilities

## Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   ├── invitations/route.ts
│   │   ├── jobs/route.ts
│   │   ├── messages/route.ts
│   │   ├── rich-media/route.ts
│   │   └── stats/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── DataTable.tsx
│   ├── FilterBar.tsx
│   └── StatsCard.tsx
└── lib/
    └── csvParser.ts
```

## Building for Production

```bash
npm run build
npm start
```

## License

This project is for personal use with your LinkedIn data export.
