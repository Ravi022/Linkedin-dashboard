'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import FilterBar from '@/components/FilterBar';
import DateRangePicker from '@/components/DateRangePicker';
import ChartCard from '@/components/ChartCard';
import MessageModal from '@/components/MessageModal';
import {
  UserPlus,
  Briefcase,
  MessageSquare,
  Image as ImageIcon,
  TrendingUp,
  ArrowLeft,
  Users,
} from 'lucide-react';
import { format, parse, isWithinInterval } from 'date-fns';

interface Stats {
  invitations: {
    total: number;
    outgoing: number;
    incoming: number;
    withMessage: number;
    monthly: Record<string, number>;
  };
  jobs: {
    total: number;
    active: number;
    closed: number;
    draft: number;
    uniqueCompanies: number;
  };
  messages: {
    total: number;
    inbox: number;
    sent: number;
    drafts: number;
    uniqueConversations: number;
  };
  richMedia: {
    total: number;
    profilePhotos: number;
    feedPhotos: number;
    backgroundPhotos: number;
  };
  connections: {
    total: number;
    withEmail: number;
    uniqueCompanies: number;
    monthly: Record<string, number>;
    topCompanies: { name: string; value: number }[];
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [richMedia, setRichMedia] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invitations' | 'jobs' | 'messages' | 'richMedia' | 'connections'>('invitations');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First, check if we have data in sessionStorage (from upload)
        const storedData = sessionStorage.getItem('linkedinData');
        
        if (storedData) {
          try {
            const data = JSON.parse(storedData);
            console.log('Loading data from sessionStorage');
            
            // Calculate stats from stored data
            const statsData = calculateStats(data);
            
            setStats(statsData);
            setInvitations(data.invitations || []);
            setJobs(data.jobs || []);
            setMessages(data.messages || []);
            setRichMedia(data.richMedia || []);
            setConnections(data.connections || []);
            
            setLoading(false);
            return;
          } catch (e) {
            console.error('Error parsing stored data:', e);
            sessionStorage.removeItem('linkedinData');
          }
        }

        // Fallback to API routes (for local development or if sessionStorage fails)
        const [statsRes, invRes, jobsRes, msgRes, mediaRes, connRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/invitations'),
          fetch('/api/jobs'),
          fetch('/api/messages'),
          fetch('/api/rich-media'),
          fetch('/api/connections'),
        ]);

        if (!statsRes.ok || !invRes.ok || !jobsRes.ok || !msgRes.ok || !mediaRes.ok || !connRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const statsData = await statsRes.json();
        const invData = await invRes.json();
        const jobsData = await jobsRes.json();
        const msgData = await msgRes.json();
        const mediaData = await mediaRes.json();
        const connData = await connRes.json();

        console.log('Stats data:', statsData);
        console.log('Invitations count:', invData.data?.length || 0);
        console.log('Jobs count:', jobsData.data?.length || 0);
        console.log('Messages count:', msgData.data?.length || 0);
        console.log('Rich Media count:', mediaData.data?.length || 0);
        console.log('Connections count:', connData.data?.length || 0);
        
        setStats(statsData);
        setInvitations(invData.data || []);
        setJobs(jobsData.data || []);
        setMessages(msgData.data || []);
        setRichMedia(mediaData.data || []);
        const connectionsData = connData.data || [];
        console.log('Connections data loaded:', connectionsData.length, 'items');
        setConnections(connectionsData);
        
        // Check if we have any data
        const totalItems = (invData.data?.length || 0) + 
                          (jobsData.data?.length || 0) + 
                          (msgData.data?.length || 0) + 
                          (mediaData.data?.length || 0) + 
                          (connData.data?.length || 0);
        
        if (totalItems === 0) {
          console.warn('No data found! This might be a serverless filesystem issue.');
          setError('No data found. Please upload your LinkedIn export file.');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try uploading the file again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Helper function to calculate stats from data
  const calculateStats = (data: any): Stats => {
    const invitations = data.invitations || [];
    const jobs = data.jobs || [];
    const messages = data.messages || [];
    const richMedia = data.richMedia || [];
    const connections = data.connections || [];

    // Calculate stats similar to API route
    const outgoingInvitations = invitations.filter((inv: any) => inv.Direction === 'OUTGOING').length;
    const incomingInvitations = invitations.filter((inv: any) => inv.Direction === 'INCOMING').length;
    const invitationsWithMessage = invitations.filter((inv: any) => inv.Message && inv.Message.trim() !== '').length;

    const monthlyInvitations: Record<string, number> = {};
    invitations.forEach((inv: any) => {
      try {
        const date = parse(inv['Sent At'], 'M/d/yy, h:mm a', new Date());
        const monthKey = format(date, 'yyyy-MM');
        monthlyInvitations[monthKey] = (monthlyInvitations[monthKey] || 0) + 1;
      } catch (e) {}
    });

    const activeJobs = jobs.filter((job: any) => job['Job State'] === 'OPEN' || job['Job State'] === 'LISTED').length;
    const closedJobs = jobs.filter((job: any) => job['Job State'] === 'CLOSED').length;
    const draftJobs = jobs.filter((job: any) => job['Job State'] === 'DRAFT').length;
    const uniqueCompanies = new Set(jobs.map((job: any) => job['Company Name'])).size;

    const inboxMessages = messages.filter((msg: any) => msg.FOLDER === 'INBOX').length;
    const sentMessages = messages.filter((msg: any) => msg.FOLDER === 'SENT').length;
    const draftMessages = messages.filter((msg: any) => msg['IS MESSAGE DRAFT'] === 'Yes').length;
    const uniqueConversations = new Set(messages.map((msg: any) => msg['CONVERSATION ID'])).size;

    const totalMedia = richMedia.length;
    const profilePhotos = richMedia.filter((media: any) => 
      media['Media Description']?.toLowerCase().includes('profile photo')
    ).length;
    const feedPhotos = richMedia.filter((media: any) => 
      media['Media Description']?.toLowerCase().includes('feed photo')
    ).length;
    const backgroundPhotos = richMedia.filter((media: any) => 
      media['Media Description']?.toLowerCase().includes('background photo')
    ).length;

    const connectionsWithEmail = connections.filter((conn: any) => conn['Email Address'] && conn['Email Address'].trim() !== '').length;
    const uniqueConnectionCompanies = new Set(connections.map((conn: any) => conn.Company).filter(Boolean)).size;

    const monthlyConnections: Record<string, number> = {};
    connections.forEach((conn: any) => {
      try {
        const date = parse(conn['Connected On'], 'dd MMM yyyy', new Date());
        const monthKey = format(date, 'yyyy-MM');
        monthlyConnections[monthKey] = (monthlyConnections[monthKey] || 0) + 1;
      } catch (e) {}
    });

    const companyCounts: Record<string, number> = {};
    connections.forEach((conn: any) => {
      if (conn.Company && conn.Company.trim() !== '') {
        companyCounts[conn.Company] = (companyCounts[conn.Company] || 0) + 1;
      }
    });
    const topCompanies = Object.entries(companyCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([company, count]) => ({ name: company, value: count }));

    return {
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
    };
  };

  const filterByDateRange = (items: any[], dateField: string, dateFormat?: string) => {
    if (!dateRange.start && !dateRange.end) return items;
    
    return items.filter((item) => {
      const dateStr = item[dateField];
      if (!dateStr) return false;
      
      try {
        let itemDate: Date;
        if (dateFormat) {
          itemDate = parse(dateStr, dateFormat, new Date());
        } else {
          itemDate = new Date(dateStr);
        }
        
        if (isNaN(itemDate.getTime())) return false;
        
        if (dateRange.start && dateRange.end) {
          return isWithinInterval(itemDate, { start: dateRange.start, end: dateRange.end });
        } else if (dateRange.start) {
          return itemDate >= dateRange.start;
        } else if (dateRange.end) {
          return itemDate <= dateRange.end;
        }
        return true;
      } catch {
        return false;
      }
    });
  };

  const filteredInvitations = useMemo(() => {
    let filtered = filterByDateRange(invitations, 'Sent At', 'M/d/yy, h:mm a');
    
    if (filters.direction) {
      filtered = filtered.filter((inv) => inv.Direction === filters.direction);
    }
    if (filters.hasMessage) {
      filtered = filtered.filter((inv) =>
        filters.hasMessage === 'yes' ? inv.Message && inv.Message.trim() !== '' : !inv.Message || inv.Message.trim() === ''
      );
    }
    return filtered;
  }, [invitations, filters, dateRange]);

  const filteredJobs = useMemo(() => {
    let filtered = filterByDateRange(jobs, 'Create Date');
    
    if (filters.jobState) {
      filtered = filtered.filter((job) => job['Job State'] === filters.jobState);
    }
    if (filters.company) {
      filtered = filtered.filter((job) => job['Company Name'] === filters.company);
    }
    if (filters.employmentStatus) {
      filtered = filtered.filter((job) => job['Employment Status'] === filters.employmentStatus);
    }
    return filtered;
  }, [jobs, filters, dateRange]);

  const filteredMessages = useMemo(() => {
    let filtered = filterByDateRange(messages, 'DATE');
    
    if (filters.folder) {
      filtered = filtered.filter((msg) => msg.FOLDER === filters.folder);
    }
    if (filters.isDraft) {
      filtered = filtered.filter((msg) => msg['IS MESSAGE DRAFT'] === filters.isDraft);
    }
    return filtered;
  }, [messages, filters, dateRange]);

  const filteredRichMedia = useMemo(() => {
    let filtered = filterByDateRange(richMedia, 'Date/Time');
    
    if (filters.mediaType) {
      filtered = filtered.filter((media) => {
        const desc = media['Media Description']?.toLowerCase() || '';
        return desc.includes(filters.mediaType.toLowerCase());
      });
    }
    return filtered;
  }, [richMedia, filters, dateRange]);

  const filteredConnections = useMemo(() => {
    let filtered = filterByDateRange(connections, 'Connected On', 'dd MMM yyyy');
    console.log('After date filter:', filtered.length, 'connections');
    
    if (filters.company && filters.company !== 'Unknown') {
      filtered = filtered.filter((conn) => 
        conn.Company?.trim() === filters.company
      );
      console.log('After company filter:', filtered.length, 'connections');
    }
    if (filters.hasEmail) {
      filtered = filtered.filter((conn) =>
        filters.hasEmail === 'yes' 
          ? conn['Email Address'] && conn['Email Address'].trim() !== ''
          : !conn['Email Address'] || conn['Email Address'].trim() === ''
      );
      console.log('After email filter:', filtered.length, 'connections');
    }
    if (filters.position && filters.position !== 'Unknown') {
      filtered = filtered.filter((conn) =>
        conn.Position?.trim() === filters.position
      );
      console.log('After position filter:', filtered.length, 'connections');
    }
    console.log('Final filtered connections:', filtered.length);
    return filtered;
  }, [connections, filters, dateRange]);

  // Prepare chart data - Dynamic based on filtered data
  const monthlyInvitationsData = useMemo(() => {
    const monthlyData: Record<string, number> = {};
    filteredInvitations.forEach(inv => {
      try {
        const date = parse(inv['Sent At'], 'M/d/yy, h:mm a', new Date());
        const monthKey = format(date, 'yyyy-MM');
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      } catch (e) {
        // Skip invalid dates
      }
    });
    
    return Object.entries(monthlyData)
      .map(([month, count]) => ({
        name: format(new Date(month + '-01'), 'MMM yyyy'),
        value: count,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredInvitations]);

  const jobStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    filteredJobs.forEach(job => {
      const status = job['Job State'] || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return Object.entries(statusCounts)
      .map(([status, count]) => ({
        name: status,
        value: count,
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredJobs]);


  const mediaTypeData = useMemo(() => {
    if (!stats?.richMedia) return [];
    return [
      { name: 'Profile Photos', value: stats.richMedia.profilePhotos },
      { name: 'Feed Photos', value: stats.richMedia.feedPhotos },
      { name: 'Background Photos', value: stats.richMedia.backgroundPhotos },
    ].filter(item => item.value > 0);
  }, [stats]);

  const monthlyConnectionsData = useMemo(() => {
    const monthlyData: Record<string, number> = {};
    filteredConnections.forEach(conn => {
      try {
        const date = parse(conn['Connected On'], 'dd MMM yyyy', new Date());
        const monthKey = format(date, 'yyyy-MM');
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      } catch (e) {
        // Skip invalid dates
      }
    });
    
    return Object.entries(monthlyData)
      .map(([month, count]) => ({
        name: format(new Date(month + '-01'), 'MMM yyyy'),
        value: count,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredConnections]);

  const topCompaniesData = useMemo(() => {
    const companyCounts: Record<string, number> = {};
    filteredConnections.forEach(conn => {
      if (conn.Company && conn.Company.trim() !== '') {
        const company = conn.Company.trim();
        companyCounts[company] = (companyCounts[company] || 0) + 1;
      }
    });
    
    return Object.entries(companyCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([company, count]) => ({
        name: company.length > 30 ? company.substring(0, 30) + '...' : company,
        value: count,
        fullName: company,
      }));
  }, [filteredConnections]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const invitationFilters = [
    {
      label: 'Direction',
      key: 'direction',
      options: [
        { label: 'Outgoing', value: 'OUTGOING' },
        { label: 'Incoming', value: 'INCOMING' },
      ],
    },
    {
      label: 'Has Message',
      key: 'hasMessage',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
  ];

  const jobFilters = [
    {
      label: 'Job State',
      key: 'jobState',
      options: [
        { label: 'Open', value: 'OPEN' },
        { label: 'Closed', value: 'CLOSED' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Listed', value: 'LISTED' },
      ],
    },
    {
      label: 'Employment Status',
      key: 'employmentStatus',
      options: [
        { label: 'Full Time', value: 'FULL_TIME' },
        { label: 'Part Time', value: 'PART_TIME' },
        { label: 'Contract', value: 'CONTRACT' },
      ],
    },
    {
      label: 'Company',
      key: 'company',
      options: Array.from(new Set(jobs.map((j) => j['Company Name']))).slice(0, 20).map((company) => ({
        label: company || 'Unknown',
        value: company || 'Unknown',
      })),
    },
  ];

  const messageFilters = [
    {
      label: 'Folder',
      key: 'folder',
      options: [
        { label: 'Inbox', value: 'INBOX' },
        { label: 'Sent', value: 'SENT' },
        { label: 'Archived', value: 'ARCHIVED' },
      ],
    },
    {
      label: 'Is Draft',
      key: 'isDraft',
      options: [
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' },
      ],
    },
  ];

  const richMediaFilters = [
    {
      label: 'Media Type',
      key: 'mediaType',
      options: [
        { label: 'Profile Photo', value: 'profile photo' },
        { label: 'Feed Photo', value: 'feed photo' },
        { label: 'Background Photo', value: 'background photo' },
      ],
    },
  ];

  const connectionFilters = [
    {
      label: 'Has Email',
      key: 'hasEmail',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
    {
      label: 'Company',
      key: 'company',
      options: Array.from(new Set(connections.map((c) => c.Company).filter(Boolean))).slice(0, 30).map((company) => ({
        label: company || 'Unknown',
        value: company || 'Unknown',
      })),
    },
    {
      label: 'Position',
      key: 'position',
      options: Array.from(new Set(connections.map((c) => c.Position).filter(Boolean))).slice(0, 30).map((position) => ({
        label: position || 'Unknown',
        value: position || 'Unknown',
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                LinkedIn Data Analytics Dashboard
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Comprehensive insights from your LinkedIn data export
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Upload New File
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {stats && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
              <StatsCard
                title="Total Invitations"
                value={stats.invitations.total}
                icon={UserPlus}
                color="blue"
                trend={{
                  value: stats.invitations.outgoing,
                  label: 'outgoing',
                }}
              />
              <StatsCard
                title="Job Postings"
                value={stats.jobs.total}
                icon={Briefcase}
                color="green"
                trend={{
                  value: stats.jobs.active,
                  label: 'active',
                }}
              />
              <StatsCard
                title="Messages"
                value={stats.messages.total}
                icon={MessageSquare}
                color="purple"
                trend={{
                  value: stats.messages.uniqueConversations,
                  label: 'conversations',
                }}
              />
              <StatsCard
                title="Posts Uploaded"
                value={stats.richMedia.total}
                icon={ImageIcon}
                color="orange"
                trend={{
                  value: stats.richMedia.profilePhotos,
                  label: 'profile photos',
                }}
              />
              <StatsCard
                title="Connections"
                value={stats.connections.total}
                icon={Users}
                color="blue"
                trend={{
                  value: stats.connections.uniqueCompanies,
                  label: 'companies',
                }}
              />
            </div>

            {/* Charts Section */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {monthlyInvitationsData.length > 0 && (
                <ChartCard
                  title="Invitations Over Time"
                  data={monthlyInvitationsData}
                  type="line"
                  dataKey="value"
                  xKey="name"
                />
              )}
              {monthlyConnectionsData.length > 0 && (
                <ChartCard
                  title="Connections Over Time"
                  data={monthlyConnectionsData}
                  type="line"
                  dataKey="value"
                  xKey="name"
                />
              )}
              {topCompaniesData.length > 0 && (
                <ChartCard
                  title="Top Companies by Connections"
                  data={topCompaniesData}
                  type="bar"
                  dataKey="value"
                  xKey="name"
                />
              )}
              {jobStatusData.length > 0 && (
                <ChartCard
                  title="Job Postings by Status"
                  data={jobStatusData}
                  type="pie"
                  dataKey="value"
                />
              )}
            </div>
          </>
        )}

        <div className="mb-6 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 dark:border-gray-800">
            <nav className="flex space-x-1 p-1" aria-label="Tabs">
              {[
                { id: 'invitations', label: 'Invitations', icon: UserPlus },
                { id: 'jobs', label: 'Job Postings', icon: Briefcase },
                { id: 'messages', label: 'Messages', icon: MessageSquare },
                { id: 'richMedia', label: 'Posts Uploaded', icon: ImageIcon },
                { id: 'connections', label: 'Connections', icon: Users },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {activeTab === 'invitations' && 'Invitations'}
            {activeTab === 'jobs' && 'Job Postings'}
            {activeTab === 'messages' && 'Messages'}
            {activeTab === 'richMedia' && 'Posts Uploaded'}
            {activeTab === 'connections' && 'Connections'}
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <DateRangePicker
              onDateRangeChange={(start, end) => setDateRange({ start, end })}
            />
            {activeTab === 'invitations' && (
              <FilterBar filters={invitationFilters} onFilterChange={setFilters} />
            )}
            {activeTab === 'jobs' && (
              <FilterBar filters={jobFilters} onFilterChange={setFilters} />
            )}
            {activeTab === 'messages' && (
              <FilterBar filters={messageFilters} onFilterChange={setFilters} />
            )}
            {activeTab === 'richMedia' && (
              <FilterBar filters={richMediaFilters} onFilterChange={setFilters} />
            )}
            {activeTab === 'connections' && (
              <FilterBar filters={connectionFilters} onFilterChange={setFilters} />
            )}
          </div>
        </div>

        {activeTab === 'invitations' && (
          <DataTable
            data={filteredInvitations}
            title="Invitations"
            columns={[
              { key: 'From', label: 'From', sortable: true },
              { key: 'To', label: 'To', sortable: true },
              {
                key: 'Sent At',
                label: 'Sent At',
                sortable: true,
                render: (value) => {
                  try {
                    return format(parse(value, 'M/d/yy, h:mm a', new Date()), 'MMM dd, yyyy');
                  } catch {
                    return value;
                  }
                },
              },
              {
                key: 'Message',
                label: 'Message',
                render: (value, row) => {
                  const message = value?.trim() || '-';
                  const isTruncated = message.length > 50;
                  const displayText = isTruncated ? message.substring(0, 50) + '...' : message;
                  return (
                    <div
                      className={`max-w-md ${isTruncated ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline' : ''}`}
                      title={isTruncated ? 'Click to view full message' : message}
                      onClick={() => isTruncated && message !== '-' && setModalContent({
                        title: `Message from ${row.From} to ${row.To}`,
                        content: message,
                      })}
                    >
                      {displayText}
                    </div>
                  );
                },
              },
              {
                key: 'Direction',
                label: 'Direction',
                render: (value) => (
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      value === 'OUTGOING'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    {value}
                  </span>
                ),
              },
            ]}
          />
        )}

        {activeTab === 'jobs' && (
          <DataTable
            data={filteredJobs}
            title="Job Postings"
            columns={[
              { key: 'Company Name', label: 'Company', sortable: true },
              { key: 'Title', label: 'Title', sortable: true },
              { key: 'Location Description', label: 'Location', sortable: true },
              {
                key: 'Job State',
                label: 'Status',
                render: (value) => (
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      value === 'OPEN' || value === 'LISTED'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : value === 'CLOSED'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}
                  >
                    {value}
                  </span>
                ),
              },
              { key: 'Employment Status', label: 'Type', sortable: true },
              {
                key: 'Create Date',
                label: 'Created',
                sortable: true,
                render: (value) => {
                  if (!value) return '-';
                  try {
                    return format(new Date(value), 'MMM dd, yyyy');
                  } catch {
                    return value;
                  }
                },
              },
            ]}
          />
        )}

        {activeTab === 'messages' && (
          <DataTable
            data={filteredMessages}
            title="Messages"
            columns={[
              { key: 'FROM', label: 'From', sortable: true },
              { key: 'TO', label: 'To', sortable: true },
              {
                key: 'DATE',
                label: 'Date',
                sortable: true,
                render: (value) => {
                  if (!value) return '-';
                  try {
                    return format(new Date(value), 'MMM dd, yyyy HH:mm');
                  } catch {
                    return value;
                  }
                },
              },
              {
                key: 'CONTENT',
                label: 'Content',
                render: (value, row) => {
                  const content = value?.trim() || '-';
                  const isTruncated = content.length > 50;
                  const displayText = isTruncated ? content.substring(0, 50) + '...' : content;
                  return (
                    <div
                      className={`max-w-md ${isTruncated ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline' : ''}`}
                      title={isTruncated ? 'Click to view full message' : content}
                      onClick={() => isTruncated && content !== '-' && setModalContent({
                        title: `Message from ${row.FROM} to ${row.TO}`,
                        content: content,
                      })}
                    >
                      {displayText}
                    </div>
                  );
                },
              },
              {
                key: 'FOLDER',
                label: 'Folder',
                render: (value) => (
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                    {value}
                  </span>
                ),
              },
            ]}
          />
        )}

        {activeTab === 'richMedia' && (
          <DataTable
            data={filteredRichMedia}
            title="Posts Uploaded"
            columns={[
              {
                key: 'Date/Time',
                label: 'Date/Time',
                sortable: true,
                render: (value) => {
                  if (!value) return '-';
                  try {
                    return format(new Date(value), 'MMM dd, yyyy');
                  } catch {
                    return value;
                  }
                },
              },
              {
                key: 'Media Description',
                label: 'Description',
                render: (value) => {
                  const description = value?.trim() || '-';
                  const isTruncated = description.length > 50;
                  const displayText = isTruncated ? description.substring(0, 50) + '...' : description;
                  return (
                    <div
                      className={`max-w-md ${isTruncated ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline' : ''}`}
                      title={isTruncated ? 'Click to view full description' : description}
                      onClick={() => isTruncated && description !== '-' && setModalContent({
                        title: 'Media Description',
                        content: description,
                      })}
                    >
                      {displayText}
                    </div>
                  );
                },
              },
              {
                key: 'Media Link',
                label: 'Link',
                render: (value) =>
                  value ? (
                    <a
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                      View
                    </a>
                  ) : (
                    '-'
                  ),
              },
            ]}
          />
        )}

        {activeTab === 'connections' && (
          <DataTable
            data={filteredConnections}
            title="Connections"
            columns={[
              {
                key: 'First Name',
                label: 'First Name',
                sortable: true,
                render: (value) => {
                  const firstName = value?.trim();
                  return (
                    <div className="font-medium text-gray-900 dark:text-white">
                      {firstName || '-'}
                    </div>
                  );
                },
              },
              {
                key: 'Last Name',
                label: 'Last Name',
                sortable: true,
                render: (value) => {
                  const lastName = value?.trim();
                  return (
                    <div className="font-medium text-gray-900 dark:text-white">
                      {lastName || '-'}
                    </div>
                  );
                },
              },
              {
                key: 'URL',
                label: 'URL',
                sortable: true,
                render: (value) => {
                  const url = value?.trim();
                  return url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 truncate max-w-xs block"
                      title={url}
                    >
                      {url.length > 50 ? url.substring(0, 50) + '...' : url}
                    </a>
                  ) : (
                    '-'
                  );
                },
              },
              {
                key: 'Email Address',
                label: 'Email Address',
                sortable: true,
                render: (value) => {
                  const email = value?.trim();
                  return email ? (
                    <div className="text-gray-900 dark:text-white">
                      {email}
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                  );
                },
              },
              {
                key: 'Company',
                label: 'Company',
                sortable: true,
                render: (value) => {
                  const company = value?.trim();
                  return (
                    <div className="max-w-xs truncate" title={company || ''}>
                      {company || '-'}
                    </div>
                  );
                },
              },
              {
                key: 'Position',
                label: 'Position',
                sortable: true,
                render: (value) => {
                  const position = value?.trim();
                  return (
                    <div className="max-w-xs truncate" title={position || ''}>
                      {position || '-'}
                    </div>
                  );
                },
              },
              {
                key: 'Connected On',
                label: 'Connected On',
                sortable: true,
                render: (value) => {
                  if (!value || !value.trim()) return '-';
                  try {
                    const dateStr = value.trim();
                    const parsedDate = parse(dateStr, 'dd MMM yyyy', new Date());
                    if (isNaN(parsedDate.getTime())) {
                      // Try alternative format
                      return format(new Date(dateStr), 'MMM dd, yyyy');
                    }
                    return format(parsedDate, 'MMM dd, yyyy');
                  } catch {
                    return value;
                  }
                },
              },
            ]}
          />
        )}

        <MessageModal
          isOpen={!!modalContent}
          onClose={() => setModalContent(null)}
          title={modalContent?.title || ''}
          content={modalContent?.content || ''}
        />
      </div>
    </div>
  );
}

