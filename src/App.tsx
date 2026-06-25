import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AppShell } from './layouts/AppShell';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { VenueConfig } from './pages/VenueConfig/VenueConfig';
import { Availability } from './pages/Availability/Availability';
import { BEOGenerator } from './pages/BEOGenerator/BEOGenerator';
import { LayoutConfigurator } from './pages/LayoutConfigurator/LayoutConfigurator';
import { Coordination } from './pages/Coordination/Coordination';
import { FBPackages } from './pages/FBPackages/FBPackages';
import { AuditLogViewer } from './pages/AuditLog/AuditLog';
import { NotificationCenter } from './pages/NotificationCenter/NotificationCenter';
import { BIAnalytics } from './pages/Analytics/Analytics';
import { GuestManagement } from './pages/GuestManagement/GuestManagement';
import { ApprovalWorkflow } from './pages/ApprovalWorkflow/ApprovalWorkflow';
import { DocumentCenter } from './pages/DocumentCenter/DocumentCenter';

// New SaaS operation pages
import { OperationsControlTower } from './pages/OperationsControlTower/OperationsControlTower';
import { FinanceDashboard } from './pages/FinanceDashboard/FinanceDashboard';
import { ClientPortal } from './pages/ClientPortal/ClientPortal';
import { AIAssistant } from './components/AIAssistant/AIAssistant';

import { bookingService } from './services/api';
import { showToast } from './components/Feedback/ToastAlerts';

import { Modal, Input, Select, DatePicker, Row, Col, Button, List, Divider, Tag } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import dayjs from 'dayjs';
import { Search, Sparkles } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const bookingSchema = zod.object({
  clientName: zod.string().min(3, 'Client name must be at least 3 characters'),
  eventType: zod.string().min(1, 'Select an event type'),
  guestCount: zod.number().min(1, 'Guests must be greater than 0'),
  venueId: zod.string().min(1, 'Select a venue'),
  date: zod.any().refine(val => !!val, 'Select a date'),
  startTime: zod.string().min(1, 'Select a start time'),
  endTime: zod.string().min(1, 'Select an end time'),
  billingAmount: zod.number().min(100, 'Minimum charge is $100')
});

type BookingFormValues = zod.infer<typeof bookingSchema>;

const MainAppContent: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const { user, role } = useAuth();

  const { control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      clientName: '',
      eventType: 'Wedding',
      guestCount: 150,
      venueId: 'venue-1',
      date: null,
      startTime: '18:00',
      endTime: '22:00',
      billingAmount: 12750
    }
  });

  const guestCountWatch = watch('guestCount');

  // React to guest counts to estimate billing ($85 per guest default)
  React.useEffect(() => {
    setValue('billingAmount', (guestCountWatch || 0) * 85);
  }, [guestCountWatch, setValue]);

  // Global Ctrl + K search command center shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search filter query logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: any[] = [];

    // 1. Search views/menus
    const views = [
      { name: 'Dashboard Command Center', viewKey: 'dashboard', category: 'Pages' },
      { name: 'Operations Tower Overview', viewKey: 'operations-tower', category: 'Pages' },
      { name: 'Finance Invoices & Inflow', viewKey: 'finance-dashboard', category: 'Pages' },
      { name: 'Client Event Status Portal', viewKey: 'client-portal', category: 'Pages' },
      { name: 'Availability Calendar schedule', viewKey: 'availability', category: 'Pages' },
      { name: 'BEO Draft Generator sheets', viewKey: 'beo-generator', category: 'Pages' },
      { name: 'Layout 2D designer config', viewKey: 'layout-configurator', category: 'Pages' },
      { name: 'KOT Kitchen coordination tracker', viewKey: 'coordination', category: 'Pages' },
      { name: 'F&B Packages catalogue', viewKey: 'fb-packages', category: 'Pages' },
      { name: 'Audits trail history logs', viewKey: 'audit-log', category: 'Pages' },
      { name: 'Guest allocations register', viewKey: 'guests', category: 'Pages' },
      { name: 'Documents vault contracts', viewKey: 'documents', category: 'Pages' }
    ];

    views.forEach(v => {
      if (v.name.toLowerCase().includes(query)) {
        results.push(v);
      }
    });

    setSearchResults(results);
  }, [searchQuery]);

  const createBookingMutation = useMutation({
    mutationFn: (newBooking: any) => bookingService.createBooking(newBooking, user?.username || 'Unknown'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      showToast.success('Booking successfully placed on calendar.');
      setIsBookingModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      showToast.error(err.message || 'Failed to place booking');
    }
  });

  const handleCreateBooking = (data: BookingFormValues) => {
    const formattedDate = dayjs(data.date).format('YYYY-MM-DD');
    const venueNameMap: Record<string, string> = {
      'venue-1': 'Imperial Grand Ballroom',
      'venue-2': 'Zenith Sky Terrace',
      'venue-3': 'Royal Dining Wing',
      'venue-4': 'Emerald Pavilion'
    };

    const payload = {
      clientName: data.clientName,
      eventType: data.eventType,
      guestCount: data.guestCount,
      venueId: data.venueId,
      venueName: venueNameMap[data.venueId] || 'Imperial Grand Ballroom',
      date: formattedDate,
      startTime: data.startTime,
      endTime: data.endTime,
      status: 'Confirmed' as const,
      billingAmount: data.billingAmount,
      paidAmount: 0 // Unpaid initial state
    };

    createBookingMutation.mutate(payload);
  };

  const handleSearchResultClick = (item: any) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setActiveView(item.viewKey);
    showToast.info(`Navigating to: ${item.name}`);
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <ProtectedRoute><Dashboard /></ProtectedRoute>;
      case 'operations-tower':
        return <ProtectedRoute><OperationsControlTower /></ProtectedRoute>;
      case 'finance-dashboard':
        return <ProtectedRoute><FinanceDashboard /></ProtectedRoute>;
      case 'client-portal':
        return <ProtectedRoute><ClientPortal /></ProtectedRoute>;
      case 'venue-config':
        return <ProtectedRoute><VenueConfig /></ProtectedRoute>;
      case 'availability':
        return <ProtectedRoute><Availability /></ProtectedRoute>;
      case 'beo-generator':
        return <ProtectedRoute><BEOGenerator /></ProtectedRoute>;
      case 'layout-configurator':
        return <ProtectedRoute><LayoutConfigurator /></ProtectedRoute>;
      case 'coordination':
        return <ProtectedRoute><Coordination /></ProtectedRoute>;
      case 'fb-packages':
        return <ProtectedRoute><FBPackages /></ProtectedRoute>;
      case 'audit-log':
        return <ProtectedRoute><AuditLogViewer /></ProtectedRoute>;
      case 'notifications':
        return <ProtectedRoute><NotificationCenter /></ProtectedRoute>;
      case 'analytics':
        return <ProtectedRoute><BIAnalytics /></ProtectedRoute>;
      case 'guests':
        return <ProtectedRoute><GuestManagement /></ProtectedRoute>;
      case 'beo-approvals':
        return <ProtectedRoute><ApprovalWorkflow /></ProtectedRoute>;
      case 'documents':
        return <ProtectedRoute><DocumentCenter /></ProtectedRoute>;
      default:
        return <ProtectedRoute><Dashboard /></ProtectedRoute>;
    }
  };

  return (
    <>
      <AppShell 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onOpenNewBookingModal={() => setIsBookingModalOpen(true)}
      >
        {renderView()}
      </AppShell>

      {/* Floating AI assistant copilot */}
      <AIAssistant />

      {/* Ctrl + K Universal Command Center Search Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
            <Search size={18} color="#64748b" />
            <strong style={{ fontSize: '15px' }}>Global Search & Command Center</strong>
          </div>
        }
        open={isSearchOpen}
        onCancel={() => { setIsSearchOpen(false); setSearchQuery(''); }}
        footer={null}
        width={500}
        bodyStyle={{ padding: '8px 0 0 0' }}
      >
        <Input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search views, bookings or clients... (e.g. Finance, BEO)"
          style={{ width: '100%', height: '40px', borderRadius: '8px', marginBottom: '16px' }}
          autoFocus
        />

        {searchResults.length > 0 ? (
          <List
            dataSource={searchResults}
            renderItem={item => (
              <List.Item 
                onClick={() => handleSearchResultClick(item)}
                style={{ 
                  padding: '12px 16px', 
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f5f9'
                }}
                className="search-item-hover"
              >
                <div>
                  <strong>{item.name}</strong>
                  <br />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Category: {item.category}</span>
                </div>
                <Tag color="blue">GO TO VIEW</Tag>
              </List.Item>
            )}
          />
        ) : (
          searchQuery.trim() && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
              No matches found for "{searchQuery}"
            </div>
          )
        )}

        {!searchQuery.trim() && (
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Recent Workspace Views</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <Button size="small" onClick={() => { setIsSearchOpen(false); setActiveView('operations-tower'); }}>Operations Tower</Button>
              <Button size="small" onClick={() => { setIsSearchOpen(false); setActiveView('finance-dashboard'); }}>Finance Dashboard</Button>
              <Button size="small" onClick={() => { setIsSearchOpen(false); setActiveView('beo-generator'); }}>BEO Generator</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Global New Booking Modal */}
      <Modal
        title="Place New Banquet Booking"
        open={isBookingModalOpen}
        onCancel={() => setIsBookingModalOpen(false)}
        footer={null}
        width={560}
      >
        <form onSubmit={handleSubmit(handleCreateBooking)} style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Client / Couple Name</label>
            <Controller
              name="clientName"
              control={control}
              render={({ field }) => <Input {...field} placeholder="e.g. Miller Wedding reception" />}
            />
            {errors.clientName && <span className="form-error">{errors.clientName.message}</span>}
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Event Category</label>
                <Controller
                  name="eventType"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} style={{ width: '100%' }}>
                      <Select.Option value="Wedding">Wedding Banquet</Select.Option>
                      <Select.Option value="Gala">Gala Ceremony</Select.Option>
                      <Select.Option value="Brunch">Brunch / Luncheon</Select.Option>
                      <Select.Option value="Cocktail">Cocktail Mixer</Select.Option>
                      <Select.Option value="Dinner">Corporate Dinner</Select.Option>
                      <Select.Option value="Conference">Seminar/Conf</Select.Option>
                    </Select>
                  )}
                />
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Expected Guest Count</label>
                <Controller
                  name="guestCount"
                  control={control}
                  render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />}
                />
                {errors.guestCount && <span className="form-error">{errors.guestCount.message}</span>}
              </div>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Select Room / Venue</label>
                <Controller
                  name="venueId"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} style={{ width: '100%' }}>
                      <Select.Option value="venue-1">Imperial Grand Ballroom</Select.Option>
                      <Select.Option value="venue-2">Zenith Sky Terrace</Select.Option>
                      <Select.Option value="venue-3">Royal Dining Wing</Select.Option>
                      <Select.Option value="venue-4">Emerald Pavilion</Select.Option>
                    </Select>
                  )}
                />
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Booking Date</label>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => <DatePicker {...field} style={{ width: '100%' }} />}
                />
                {errors.date && <span className="form-error">{(errors.date as any).message}</span>}
              </div>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Start Time</label>
                <Controller
                  name="startTime"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} style={{ width: '100%' }}>
                      <Select.Option value="08:00">08:00 AM</Select.Option>
                      <Select.Option value="10:00">10:00 AM</Select.Option>
                      <Select.Option value="12:00">12:00 PM</Select.Option>
                      <Select.Option value="14:00">02:00 PM</Select.Option>
                      <Select.Option value="17:00">05:00 PM</Select.Option>
                      <Select.Option value="18:00">06:00 PM</Select.Option>
                      <Select.Option value="19:00">07:00 PM</Select.Option>
                    </Select>
                  )}
                />
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">End Time</label>
                <Controller
                  name="endTime"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} style={{ width: '100%' }}>
                      <Select.Option value="15:00">03:00 PM</Select.Option>
                      <Select.Option value="17:00">05:00 PM</Select.Option>
                      <Select.Option value="21:00">09:00 PM</Select.Option>
                      <Select.Option value="22:00">10:00 PM</Select.Option>
                      <Select.Option value="23:00">11:00 PM</Select.Option>
                      <Select.Option value="00:00">12:00 AM</Select.Option>
                    </Select>
                  )}
                />
              </div>
            </Col>
          </Row>

          <div style={{ marginBottom: '24px' }}>
            <label className="form-label">Estimated Bill ($)</label>
            <Controller
              name="billingAmount"
              control={control}
              render={({ field }) => <Input {...field} disabled style={{ background: '#f8fafc', color: '#a8201a', fontWeight: 700 }} />}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button onClick={() => setIsBookingModalOpen(false)}>Cancel</Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={createBookingMutation.isPending}
              style={{ backgroundColor: '#9e2a2b', borderColor: '#9e2a2b' }}
            >
              Confirm Booking
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <MainAppContent />
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
