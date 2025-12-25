import { NextResponse } from 'next/server';
import { getInvitations, getJobPostings, getMessages, getRichMedia, getConnections } from '@/lib/csvParser';
import { format, parse, startOfMonth, endOfMonth } from 'date-fns';

export async function GET() {
  try {
    // Handle missing files gracefully
    let invitations: any[] = [];
    let jobs: any[] = [];
    let messages: any[] = [];
    let richMedia: any[] = [];
    let connections: any[] = [];

    try {
      invitations = getInvitations();
    } catch (error) {
      console.warn('Could not load invitations:', error);
    }

    try {
      jobs = getJobPostings();
    } catch (error) {
      console.warn('Could not load job postings:', error);
    }

    try {
      messages = getMessages();
    } catch (error) {
      console.warn('Could not load messages:', error);
    }

    try {
      richMedia = getRichMedia();
    } catch (error) {
      console.warn('Could not load rich media:', error);
    }

    try {
      connections = getConnections();
    } catch (error) {
      console.warn('Could not load connections:', error);
    }

    // Invitations stats (handle missing fields gracefully)
    const outgoingInvitations = invitations.filter(inv => inv?.Direction === 'OUTGOING').length;
    const incomingInvitations = invitations.filter(inv => inv?.Direction === 'INCOMING').length;
    const invitationsWithMessage = invitations.filter(inv => inv?.Message && inv.Message.trim() !== '').length;

    // Jobs stats (handle missing fields gracefully)
    const activeJobs = jobs.filter(job => job?.['Job State'] === 'OPEN' || job?.['Job State'] === 'LISTED').length;
    const closedJobs = jobs.filter(job => job?.['Job State'] === 'CLOSED').length;
    const draftJobs = jobs.filter(job => job?.['Job State'] === 'DRAFT').length;
    const uniqueCompanies = new Set(jobs.map(job => job?.['Company Name']).filter(Boolean)).size;

    // Messages stats (handle missing fields gracefully)
    const inboxMessages = messages.filter(msg => msg?.FOLDER === 'INBOX').length;
    const sentMessages = messages.filter(msg => msg?.FOLDER === 'SENT').length;
    const draftMessages = messages.filter(msg => msg?.['IS MESSAGE DRAFT'] === 'Yes').length;
    const uniqueConversations = new Set(messages.map(msg => msg?.['CONVERSATION ID']).filter(Boolean)).size;

    // Rich Media stats (handle missing fields gracefully)
    const totalMedia = richMedia.length;
    const profilePhotos = richMedia.filter(media => 
      media?.['Media Description']?.toLowerCase()?.includes('profile photo')
    ).length;
    const feedPhotos = richMedia.filter(media => 
      media?.['Media Description']?.toLowerCase()?.includes('feed photo')
    ).length;
    const backgroundPhotos = richMedia.filter(media => 
      media?.['Media Description']?.toLowerCase()?.includes('background photo')
    ).length;

    // Monthly breakdown for invitations (handle missing fields gracefully)
    const monthlyInvitations: Record<string, number> = {};
    invitations.forEach(inv => {
      try {
        if (!inv?.['Sent At']) return;
        const date = parse(inv['Sent At'], 'M/d/yy, h:mm a', new Date());
        const monthKey = format(date, 'yyyy-MM');
        monthlyInvitations[monthKey] = (monthlyInvitations[monthKey] || 0) + 1;
      } catch (e) {
        // Skip invalid dates
      }
    });

    // Connections stats (handle missing fields gracefully)
    const connectionsWithEmail = connections.filter(conn => conn?.['Email Address'] && conn['Email Address'].trim() !== '').length;
    const uniqueConnectionCompanies = new Set(connections.map(conn => conn?.Company).filter(Boolean)).size;
    
    // Monthly breakdown for connections (handle missing fields gracefully)
    const monthlyConnections: Record<string, number> = {};
    connections.forEach(conn => {
      try {
        if (!conn?.['Connected On']) return;
        const date = parse(conn['Connected On'], 'dd MMM yyyy', new Date());
        const monthKey = format(date, 'yyyy-MM');
        monthlyConnections[monthKey] = (monthlyConnections[monthKey] || 0) + 1;
      } catch (e) {
        // Skip invalid dates
      }
    });

    // Top companies by connection count (handle missing fields gracefully)
    const companyCounts: Record<string, number> = {};
    connections.forEach(conn => {
      if (conn?.Company && conn.Company.trim() !== '') {
        companyCounts[conn.Company] = (companyCounts[conn.Company] || 0) + 1;
      }
    });
    const topCompanies = Object.entries(companyCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([company, count]) => ({ name: company, value: count }));

    return NextResponse.json({
      invitations: {
        total: invitations.length,
        outgoing: outgoingInvitations,
        incoming: incomingInvitations,
        withMessage: invitationsWithMessage,
        monthly: monthlyInvitations,
      },
      jobs: {
        total: jobs.length,
        active: activeJobs,
        closed: closedJobs,
        draft: draftJobs,
        uniqueCompanies,
      },
      messages: {
        total: messages.length,
        inbox: inboxMessages,
        sent: sentMessages,
        drafts: draftMessages,
        uniqueConversations,
      },
      richMedia: {
        total: totalMedia,
        profilePhotos,
        feedPhotos,
        backgroundPhotos,
      },
      connections: {
        total: connections.length,
        withEmail: connectionsWithEmail,
        uniqueCompanies: uniqueConnectionCompanies,
        monthly: monthlyConnections,
        topCompanies,
      },
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    return NextResponse.json(
      { error: 'Failed to calculate stats' },
      { status: 500 }
    );
  }
}

