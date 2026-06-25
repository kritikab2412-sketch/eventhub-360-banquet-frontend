import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService, venueService, guestService, kitchenService, approvalService } from '../../services/api';
import { SkeletonLoader } from '../../components/Common/SkeletonLoader';
import { showToast } from '../../components/Feedback/ToastAlerts';
import { useAuth } from '../../context/AuthContext';
import { Card, Row, Col, Progress, List, Tag, Button, Statistic, Tooltip, Alert, Divider, Badge } from 'antd';
import { 
  Activity, 
  RefreshCw, 
  Building, 
  FileCheck, 
  Users, 
  ChefHat, 
  DollarSign, 
  Bell, 
  ChevronRight, 
  AlertTriangle,
  Clock,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import dayjs from 'dayjs';

export const OperationsControlTower: React.FC = () => {
  const queryClient = useQueryClient();
  const { role, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Queries
  const { data: bookingsRes, isLoading: loadingBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingService.getBookings()
  });

  const { data: venuesRes, isLoading: loadingVenues } = useQuery({
    queryKey: ['venues'],
    queryFn: () => venueService.getVenues()
  });

  const { data: guestsRes, isLoading: loadingGuests } = useQuery({
    queryKey: ['guests'],
    queryFn: () => guestService.getGuests()
  });

  const { data: kotsRes, isLoading: loadingKots } = useQuery({
    queryKey: ['kots'],
    queryFn: () => kitchenService.getKOTs()
  });

  const { data: stepsRes, isLoading: loadingSteps } = useQuery({
    queryKey: ['approval-steps'],
    queryFn: () => approvalService.getApprovalSteps()
  });

  const handleRefreshAll = () => {
    setRefreshing(true);
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['kots'] });
      queryClient.invalidateQueries({ queryKey: ['approval-steps'] });
      setRefreshing(false);
      showToast.success('Operational widgets refreshed.');
    }, 800);
  };

  if (loadingBookings || loadingVenues || loadingGuests || loadingKots || loadingSteps) {
    return <SkeletonLoader type="table" />;
  }

  const bookings = bookingsRes?.data || [];
  const venues = venuesRes?.data || [];
  const guests = guestsRes?.data || [];
  const kots = kotsRes?.data || [];
  const steps = stepsRes?.data || [];

  // 1. Active Events Today (Simulated matches for September 2024 dates or current date)
  // Let's filter confirmed bookings for the target period
  const activeEvents = bookings.filter(b => b.status === 'Confirmed' || b.status === 'BEO Approved' || b.status === 'In Progress');

  // 2. Occupancy Metrics
  const activeVenues = venues.filter(v => v.status === 'Active');
  const occupancyRate = activeVenues.length > 0 
    ? Math.round((activeEvents.length / activeVenues.length) * 100) 
    : 0;

  // 3. Pending Approvals
  const pendingApprovals = steps.filter(s => s.status === 'Pending');

  // 4. VIP Guest Arrivals
  const vipArrivals = guests.filter(g => g.isVIP && g.rsvp === 'Confirmed');

  // 5. Kitchen Delays
  const kitchenDelays = kots.filter(k => k.status === 'DELAYED');

  // 6. Overdue Payments
  const overdueBookings = bookings.filter(b => b.paymentStatus === 'Overdue');

  // 7. Revenue metrics
  const totalRevenue = bookings.reduce((sum, b) => sum + b.billingAmount, 0);
  const totalPaid = bookings.reduce((sum, b) => sum + b.paidAmount, 0);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Live Center
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: '4px 0 0 0' }}>
            Operations Control Tower
          </h1>
        </div>
        <Button 
          icon={<RefreshCw size={16} className={refreshing ? 'spin-animation' : ''} />} 
          onClick={handleRefreshAll}
          style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          Force Sync
        </Button>
      </div>

      {/* Warning Banners */}
      {kitchenDelays.length > 0 && (
        <Alert
          message="Operations Warning: Kitchen Bottleneck Triggered"
          description={`KOT ticket ${kitchenDelays[0].kotNumber} is delayed at the Grill Station. Chef attention required.`}
          type="error"
          showIcon
          icon={<AlertTriangle size={18} />}
          style={{ marginBottom: '20px', borderRadius: '12px' }}
        />
      )}

      {/* Grid of Widgets */}
      <Row gutter={[24, 24]}>
        
        {/* KPI: Active Events Today */}
        <Col xs={24} md={12} lg={6}>
          <Card style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span style={{ color: '#64748b', fontWeight: 600 }}>Events Scheduled</span>}
              value={activeEvents.length}
              prefix={<Activity size={18} color="#9e2a2b" style={{ marginRight: '8px' }} />}
              valueStyle={{ color: '#1e293b', fontWeight: 800 }}
            />
            <div style={{ marginTop: '12px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Confirmed & BEO Authorized</span>
            </div>
          </Card>
        </Col>

        {/* KPI: Venue Occupancy */}
        <Col xs={24} md={12} lg={6}>
          <Card style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ color: '#64748b', fontWeight: 600, fontSize: '14px' }}>Space Occupancy</span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', margin: '4px 0 0 0' }}>{occupancyRate}%</h2>
              </div>
              <Building size={20} color="#3b82f6" />
            </div>
            <Progress percent={occupancyRate} showInfo={false} strokeColor="#3b82f6" style={{ marginTop: '16px' }} />
          </Card>
        </Col>

        {/* KPI: VIP Guests Arrivals */}
        <Col xs={24} md={12} lg={6}>
          <Card style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span style={{ color: '#64748b', fontWeight: 600 }}>VIP Arrivals Today</span>}
              value={vipArrivals.length}
              prefix={<Users size={18} color="#15803d" style={{ marginRight: '8px' }} />}
              valueStyle={{ color: '#1e293b', fontWeight: 800 }}
            />
            <div style={{ marginTop: '12px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>RSVP Confirmed VIP list</span>
            </div>
          </Card>
        </Col>

        {/* KPI: Revenue Snapshot */}
        <Col xs={24} md={12} lg={6}>
          <Card style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span style={{ color: '#64748b', fontWeight: 600 }}>Cash Inflow Ratio</span>}
              value={totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0}
              suffix="%"
              prefix={<DollarSign size={18} color="#d97706" style={{ marginRight: '4px' }} />}
              valueStyle={{ color: '#1e293b', fontWeight: 800 }}
            />
            <div style={{ marginTop: '12px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Paid: ${totalPaid.toLocaleString()} / ${totalRevenue.toLocaleString()}</span>
            </div>
          </Card>
        </Col>

      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        
        {/* Active Events Tracker */}
        <Col xs={24} lg={16}>
          <Card 
            title={<span style={{ fontWeight: 700 }}>Live Operations Schedule Flow</span>}
            style={{ borderRadius: '16px' }}
          >
            <List
              dataSource={activeEvents}
              renderItem={(event) => (
                <div 
                  key={event.id}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '16px', 
                    background: '#f8fafc', 
                    borderRadius: '12px', 
                    marginBottom: '12px',
                    borderLeft: '4px solid #9e2a2b'
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontWeight: 700, color: '#1e293b' }}>{event.clientName} ({event.eventType})</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Room: <strong>{event.venueName}</strong> • Date: <strong>{event.date}</strong> • Schedule: <strong>{event.startTime} - {event.endTime}</strong>
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Tag color="cyan">{event.status.toUpperCase()}</Tag>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#9e2a2b' }}>₹{event.billingAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            />
          </Card>

          {/* Kitchen Bottlenecks & Delays */}
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChefHat size={18} color="#a8201a" />
                <span style={{ fontWeight: 700 }}>Kitchen Prep Delays</span>
              </div>
            }
            style={{ borderRadius: '16px', marginTop: '24px' }}
          >
            {kots.filter(k => k.status === 'DELAYED').length === 0 ? (
              <Alert message="No active kitchen delays. Prep lines running efficiently." type="success" showIcon />
            ) : (
              <List
                dataSource={kots.filter(k => k.status === 'DELAYED')}
                renderItem={(kot) => (
                  <div key={kot.id} style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #fee2e2', background: '#fff5f5', borderRadius: '8px', marginBottom: '8px' }}>
                    <div>
                      <strong style={{ color: '#ef4444' }}>{kot.kotNumber}</strong> • {kot.itemName}
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Assigned Chef: {kot.chefAssigned} • Range: {kot.tableRange}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Tag color="error">{kot.bottleneck}</Tag>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>
                        Elapsed: {Math.floor(kot.durationSeconds / 60)} mins
                      </div>
                    </div>
                  </div>
                )}
              />
            )}
          </Card>
        </Col>

        {/* Right Panel: Pending Actions & Audits */}
        <Col xs={24} lg={8}>
          
          {/* Stakeholder Pending approvals */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={18} color="#d97706" />
                <span style={{ fontWeight: 700 }}>Awaiting Approvals</span>
              </div>
            }
            style={{ borderRadius: '16px', marginBottom: '24px' }}
          >
            {pendingApprovals.length === 0 ? (
              <Alert message="BEO Sign-Off steps cleared!" type="success" showIcon />
            ) : (
              <List
                dataSource={pendingApprovals}
                renderItem={item => (
                  <List.Item style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <List.Item.Meta
                      title={<span style={{ fontWeight: 600 }}>{item.role} Gateway</span>}
                      description={`Awaiting sign-off reviewer for BEO approval`}
                    />
                    <Tag color="orange">PENDING</Tag>
                  </List.Item>
                )}
              />
            )}
          </Card>

          {/* Overdue Payment holds */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#ef4444" />
                <span style={{ fontWeight: 700 }}>Overdue Payments holds</span>
              </div>
            }
            style={{ borderRadius: '16px' }}
          >
            {overdueBookings.length === 0 ? (
              <Alert message="No overdue payments flagged." type="success" showIcon />
            ) : (
              <List
                dataSource={overdueBookings}
                renderItem={item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#1e293b' }}>{item.clientName}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Balance: ${item.balanceDue.toLocaleString()}</div>
                    </div>
                    <Tag color="red">OVERDUE</Tag>
                  </div>
                )}
              />
            )}
          </Card>

        </Col>

      </Row>
    </div>
  );
};
