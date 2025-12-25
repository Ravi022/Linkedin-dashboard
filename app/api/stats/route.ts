import { NextResponse } from 'next/server';
import { getInvitations, getJobPostings, getMessages, getRichMedia, getConnections } from '@/lib/csvParser';
import { format, parse, startOfMonth, endOfMonth } from 'date-fns';

export async function GET() {
  try {
    const invitations = getInvitations();
    const jobs = getJobPostings();
    const messages = getMessages();
    const richMedia = getRichMedia();
    const connections = getConnections();

    // Invitations stats
    const outgoingInvitations = invitations.filter(inv => inv.Direction === 'OUTGOING').length;
    const incomingInvitations = invitations.filter(inv => inv.Direction === 'INCOMING').length;
    const invitationsWithMessage = invitations.filter(inv => inv.Message && inv.Message.trim() !== '').length;

    // Jobs stats
    const activeJobs = jobs.filter(job => job['Job State'] === 'OPEN' || job['Job State'] === 'LISTED').length;
    const closedJobs = jobs.filter(job => job['Job State'] === 'CLOSED').length;
    const draftJobs = jobs.filter(job => job['Job State'] === 'DRAFT').length;
    const uniqueCompanies = new Set(jobs.map(job => job['Company Name'])).size;

    // Messages stats
    const inboxMessages = messages.filter(msg => msg.FOLDER === 'INBOX').length;
    const sentMessages = messages.filter(msg => msg.FOLDER === 'SENT').length;
    const draftMessages = messages.filter(msg => msg['IS MESSAGE DRAFT'] === 'Yes').length;
    const uniqueConversations = new Set(messages.map(msg => msg['CONVERSATION ID'])).size;

    // Rich Media stats
    const totalMedia = richMedia.length;
    const profilePhotos = richMedia.filter(media => 
      media['Media Description']?.toLowerCase().includes('profile photo')
    ).length;
    const feedPhotos = richMedia.filter(media => 
      media['Media Description']?.toLowerCase().includes('feed photo')
    ).length;
    const backgroundPhotos = richMedia.filter(media => 
      media['Media Description']?.toLowerCase().includes('background photo')
    ).length;

    // Monthly breakdown for invitations
    const monthlyInvitations: Record<string, number> = {};
    invitations.forEach(inv => {
      try {
        const date = parse(inv['Sent At'], 'M/d/yy, h:mm a', new Date());
        const monthKey = format(date, 'yyyy-MM');
        monthlyInvitations[monthKey] = (monthlyInvitations[monthKey] || 0) + 1;
      } catch (e) {
        // Skip invalid dates
      }
    });

    // Connections stats
    const connectionsWithEmail = connections.filter(conn => conn['Email Address'] && conn['Email Address'].trim() !== '').length;
    const uniqueConnectionCompanies = new Set(connections.map(conn => conn.Company).filter(Boolean)).size;
    
    // Monthly breakdown for connections
    const monthlyConnections: Record<string, number> = {};
    connections.forEach(conn => {
      try {
        const date = parse(conn['Connected On'], 'dd MMM yyyy', new Date());
        const monthKey = format(date, 'yyyy-MM');
        monthlyConnections[monthKey] = (monthlyConnections[monthKey] || 0) + 1;
      } catch (e) {
        // Skip invalid dates
      }
    });

    // Top companies by connection count
    const companyCounts: Record<string, number> = {};
    connections.forEach(conn => {
      if (conn.Company && conn.Company.trim() !== '') {
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

