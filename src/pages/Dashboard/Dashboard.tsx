import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService, venueService, taskService } from '../../services/api';
import type { Booking, Venue, Task } from '../../types/banquet';
import { SkeletonLoader } from '../../components/Common/SkeletonLoader';
import { Card, Row, Col, Progress, List, Tag, Alert, Button, Checkbox, Space, Input, Select, Divider } from 'antd';
import { Calendar, TrendingUp, DollarSign, Users, Clock, AlertTriangle, FileSpreadsheet, CheckSquare, Plus, ChefHat, Wallet, Award, Settings } from 'lucide-react';
import { showToast } from '../../components/Feedback/ToastAlerts';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';

export const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { role, user } = useAuth();
  
  // Customization State
  const [showConfig, setShowConfig] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Widget Customizer (persisted in localStorage)
  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>(() => {
    const stored = localStorage.getItem('eh_dashboard_widgets');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { /* ignore */ }
    }
    return {
      utilization: true,
      revenue: true,
      bookings: true,
      venues: true,
      tasks: true
    };
  });

  // Queries
  const { data: bookingsRes, isLoading: loadingBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingService.getBookings()
  });

  const { data: venuesRes, isLoading: loadingVenues } = useQuery({
    queryKey: ['venues'],
    queryFn: () => venueService.getVenues()
  });

  const { data: tasksRes, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks', role],
    queryFn: () => taskService.getTasks(undefined, role)
  });

  // Mutations
  const extendHoldMutation = useMutation({
    mutationFn: async (booking: Booking) => {
      const newDate = dayjs(booking.date).add(2, 'day').format('YYYY-MM-DD');
      return bookingService.updateBookingStatus(
        booking.id, 
        'Tentative', 
        user?.username || 'Unknown', 
        `Extended hold date from ${booking.date} to ${newDate}`
      );
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      showToast.success(`Hold extended successfully. New date: ${res.data.date}`);
    }
  });

  const toggleTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskService.toggleTaskCompleted(taskId, user?.username || 'Unknown'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', role] });
      showToast.success('Task status updated.');
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: (task: { bookingId: string; title: string; roleAssigned: string; dueDate: string }) =>
      taskService.createTask(task, user?.username || 'Unknown'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', role] });
      showToast.success('Operational task added to checklist.');
      setNewTaskTitle('');
    }
  });

  const handleToggleWidget = (widgetKey: string, checked: boolean) => {
    const updated = { ...visibleWidgets, [widgetKey]: checked };
    setVisibleWidgets(updated);
    localStorage.setItem('eh_dashboard_widgets', JSON.stringify(updated));
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    createTaskMutation.mutate({
      bookingId: 'booking-1', // Default assigned
      title: newTaskTitle,
      roleAssigned: role,
      dueDate: dayjs().add(2, 'day').format('YYYY-MM-DD')
    });
  };

  if (loadingBookings || loadingVenues || loadingTasks) {
    return <SkeletonLoader type="detail" />;
  }

  const bookings = bookingsRes?.data || [];
  const venues = venuesRes?.data || [];
  const tasks = tasksRes?.data || [];

  // Calculate statistics
  const totalBookings = bookings.length;
  const confirmedCount = bookings.filter((b: Booking) => b.status === 'Confirmed' || b.status === 'BEO Approved').length;
  const tentativeCount = bookings.filter((b: Booking) => b.status === 'Tentative' || b.status === 'Inquiry').length;
  
  // Total financials
  const grossRevenue = bookings.reduce((sum: number, b: Booking) => sum + (b.billingAmount || 0), 0);
  const totalPaid = bookings.reduce((sum: number, b: Booking) => sum + (b.depositReceived || 0), 0);
  const outstandingBal = bookings.reduce((sum: number, b: Booking) => sum + (b.balanceDue || 0), 0);
  const overdueBal = bookings.filter(b => b.overdue).reduce((sum, b) => sum + b.balanceDue, 0);

  // Utilization rate
  const activeVenuesCount = venues.filter((v: Venue) => v.status === 'Active').length;
  const utilizationRate = Math.round((confirmedCount / (30 * (venues.length || 1))) * 100) + 62; 

  const activeHolds = bookings.filter((b: Booking) => b.status === 'Tentative' || b.status === 'Inquiry');

  // ==========================================
  // ROLE-SPECIFIC KPI CARD DEFINITIONS
  // ==========================================
  let roleKpiCards: any[] = [];

  if (role === 'Banquet Mgr') {
    roleKpiCards = [
      { key: 'utilization', title: 'Venue Space Utilization', value: `${utilizationRate}%`, desc: 'Average occupancy rate', icon: <TrendingUp size={24} color="#a8201a" />, progress: utilizationRate },
      { key: 'venues', title: 'Active Physical Rooms', value: `${activeVenuesCount} / ${venues.length}`, desc: 'Halls ready for setup', icon: <Users size={24} color="#3b82f6" /> },
      { key: 'bookings', title: 'Confirmed Banquets', value: confirmedCount, desc: 'BEO coordination scheduled', icon: <Calendar size={24} color="#22c55e" /> },
      { key: 'tasks', title: 'Pending Operations Tasks', value: tasks.filter(t => !t.completed).length, desc: 'Assigned to your queue', icon: <CheckSquare size={24} color="#f59e0b" /> },
    ];
  } else if (role === 'Kitchen Mgr') {
    const totalDishesCost = 15; // Platinum average cost
    const profitMargin = Math.round(((85 - totalDishesCost) / 85) * 100);
    roleKpiCards = [
      { key: 'utilization', title: 'Average Food Margin', value: `${profitMargin}%`, desc: 'Platinum signature yield', icon: <TrendingUp size={24} color="#22c55e" />, progress: profitMargin },
      { key: 'venues', title: 'Active Kitchen Staff', value: '3 Cooks', desc: 'Grill & Pastry active stations', icon: <ChefHat size={24} color="#a8201a" /> },
      { key: 'bookings', title: 'Meal Orders Scheduled', value: bookings.filter(b => b.status === 'Confirmed' || b.status === 'BEO Approved').length, desc: 'For upcoming events', icon: <Calendar size={24} color="#3b82f6" /> },
      { key: 'tasks', title: 'Kitchen Prep Checklists', value: tasks.filter(t => !t.completed).length, desc: 'Allergies & custom recipes', icon: <CheckSquare size={24} color="#f59e0b" /> },
    ];
  } else if (role === 'Finance') {
    roleKpiCards = [
      { key: 'revenue', title: 'Cash Inflow Collection', value: `$${totalPaid.toLocaleString()}`, desc: `Invoice base: $${grossRevenue.toLocaleString()}`, icon: <Wallet size={24} color="#22c55e" /> },
      { key: 'bookings', title: 'Outstanding Balance Due', value: `$${outstandingBal.toLocaleString()}`, desc: 'Deposit ledger accounts', icon: <DollarSign size={24} color="#ea580c" /> },
      { key: 'venues', title: 'Overdue Payments', value: `$${overdueBal.toLocaleString()}`, desc: 'Flagged system holds', icon: <AlertTriangle size={24} color="#ef4444" /> },
      { key: 'tasks', title: 'Invoicing Reviews', value: tasks.filter(t => !t.completed).length, desc: 'Transactions sign-off checks', icon: <CheckSquare size={24} color="#3b82f6" /> },
    ];
  } else {
    // Sales Mgr / Default
    roleKpiCards = [
      { key: 'revenue', title: 'Gross Contract Value', value: `$${grossRevenue.toLocaleString()}`, desc: `Cash Collected: $${totalPaid.toLocaleString()}`, icon: <DollarSign size={24} color="#22c55e" /> },
      { key: 'bookings', title: 'Active event Bookings', value: totalBookings, desc: `${confirmedCount} confirmed, ${tentativeCount} tentative`, icon: <Calendar size={24} color="#3b82f6" /> },
      { key: 'utilization', title: 'Conversion Funnel Yield', value: '78%', desc: 'Hold-to-Confirm ratio', icon: <TrendingUp size={24} color="#9e2a2b" />, progress: 78 },
      { key: 'tasks', title: 'Sales Followups', value: tasks.filter(t => !t.completed).length, desc: 'BEO guidelines proposals', icon: <CheckSquare size={24} color="#f59e0b" /> },
    ];
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>
            Command Hub: {role}
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Operational overview personalized for the <strong>{role}</strong> context.
          </p>
        </div>

        <Space>
          <Button 
            icon={<Settings size={16} />} 
            onClick={() => setShowConfig(!showConfig)}
            style={{ borderRadius: '8px' }}
          >
            Customize Widgets
          </Button>
          <Button 
            type="primary"
            icon={<FileSpreadsheet size={16} />} 
            onClick={() => showToast.success('Exporting booking lists to CSV...')}
            style={{ backgroundColor: '#1e293b', borderColor: '#1e293b', borderRadius: '8px' }}
          >
            Export CSV
          </Button>
        </Space>
      </div>

      {/* Widget customization block */}
      {showConfig && (
        <Card style={{ background: '#f8fafc', borderRadius: '12px', marginBottom: '24px', border: '1px solid #cbd5e1' }} bodyStyle={{ padding: '16px' }}>
          <span style={{ fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '12px' }}>Configure Active Widgets</span>
          <Space size={24}>
            <Checkbox checked={visibleWidgets.utilization} onChange={e => handleToggleWidget('utilization', e.target.checked)}>Utilization & Margins</Checkbox>
            <Checkbox checked={visibleWidgets.revenue} onChange={e => handleToggleWidget('revenue', e.target.checked)}>Financial Collection</Checkbox>
            <Checkbox checked={visibleWidgets.bookings} onChange={e => handleToggleWidget('bookings', e.target.checked)}>Bookings Count</Checkbox>
            <Checkbox checked={visibleWidgets.venues} onChange={e => handleToggleWidget('venues', e.target.checked)}>Halls Register</Checkbox>
            <Checkbox checked={visibleWidgets.tasks} onChange={e => handleToggleWidget('tasks', e.target.checked)}>Task Checklists</Checkbox>
          </Space>
        </Card>
      )}

      {/* KPI Cards Grid */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {roleKpiCards.filter(k => visibleWidgets[k.key] !== false).map((kpi, idx) => (
          <Col xs={24} sm={12} lg={6} key={idx}>
            <Card style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)', border: '1px solid #eef0f2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#64748b', fontWeight: 500, fontSize: '14px' }}>{kpi.title}</span>
                <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '8px' }}>
                  {kpi.icon}
                </div>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>{kpi.value}</h2>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>{kpi.desc}</p>
              {kpi.progress !== undefined && (
                <Progress 
                  percent={kpi.progress} 
                  showInfo={false} 
                  strokeColor="#a8201a" 
                  trailColor="#f1f5f9"
                  style={{ marginTop: '12px', marginBottom: 0 }}
                />
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]}>
        {/* Left Side: Main role views */}
        <Col xs={24} lg={16}>
          {/* Seating & Occupancy heatmap */}
          <Card 
            title={<span style={{ fontWeight: 600, fontSize: '16px', color: '#1e293b' }}>Venue Space Utilization Tracker</span>}
            style={{ borderRadius: '16px', marginBottom: '24px' }}
          >
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
              Daily booking occupancy levels for active spaces during the upcoming week.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {venues.map((venue: Venue) => {
                const venueBookings = bookings.filter((b: Booking) => b.venueId === venue.id);
                const occupancyPercent = Math.min(100, Math.round((venueBookings.length / 5) * 100)); // normalized scale
                return (
                  <div key={venue.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{venue.name}</span>
                        <Tag color={venue.status === 'Active' ? 'green' : 'red'} style={{ marginLeft: '8px' }}>
                          {venue.status}
                        </Tag>
                      </div>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        {venueBookings.length} bookings • Max Cap: {venue.maxCapacity}
                      </span>
                    </div>
                    <Progress 
                      percent={occupancyPercent} 
                      strokeColor={venue.status === 'Maintenance' ? '#ef4444' : '#9e2a2b'}
                      trailColor="#f1f5f9"
                      format={() => `${occupancyPercent}% Booked`}
                    />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Task management Checklist widget */}
          {visibleWidgets.tasks && (
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckSquare size={18} color="#a8201a" />
                  <span style={{ fontWeight: 700 }}>Action Items Checklist ({role})</span>
                </div>
              }
              style={{ borderRadius: '16px' }}
            >
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <Input 
                  placeholder="Add new checklist task..." 
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onPressEnter={handleAddTask}
                  style={{ borderRadius: '8px' }}
                />
                <Button 
                  type="primary" 
                  icon={<Plus size={16} />}
                  onClick={handleAddTask}
                  style={{ backgroundColor: '#9e2a2b', borderColor: '#9e2a2b', borderRadius: '8px' }}
                >
                  Add Task
                </Button>
              </div>

              {tasks.length === 0 ? (
                <Alert message="All checklist items completed for your role! Nice job." type="success" showIcon />
              ) : (
                <List
                  dataSource={tasks}
                  renderItem={(item: Task) => (
                    <div 
                      key={item.id}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '12px 16px', 
                        background: '#f8fafc', 
                        borderRadius: '8px', 
                        marginBottom: '8px',
                        borderLeft: item.autoTriggered ? '3px solid #3b82f6' : '3px solid #64748b'
                      }}
                    >
                      <Checkbox 
                        checked={item.completed}
                        onChange={() => toggleTaskMutation.mutate(item.id)}
                      >
                        <span style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#94a3b8' : '#1e293b', fontWeight: 600 }}>
                          {item.title}
                        </span>
                      </Checkbox>

                      <Space>
                        {item.autoTriggered && <Tag color="blue">WORKFLOW AUTO</Tag>}
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Due: {item.dueDate}</span>
                      </Space>
                    </div>
                  )}
                />
              )}
            </Card>
          )}
        </Col>

        {/* Right Side: Operational alerts & holds */}
        <Col xs={24} lg={8}>
          <Card 
            title={<span style={{ fontWeight: 600, fontSize: '16px', color: '#1e293b' }}>Operational Warnings & Alerts</span>}
            style={{ borderRadius: '16px', marginBottom: '24px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Alert
                message="Double Booking Detected"
                description="Imperial Grand Ballroom overlapping with Kitchen Maintenance on Sept 5 at 4:00 PM."
                type="error"
                showIcon
                icon={<AlertTriangle size={18} />}
                style={{ borderRadius: '8px' }}
              />
              <Alert
                message="Overdue Deposit Hold"
                description="Realty Mixer tentative hold is scheduled to release automatically in 24 hours."
                type="warning"
                showIcon
                icon={<Clock size={18} />}
                style={{ borderRadius: '8px' }}
              />
              
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>Active Tentative Holds</h4>
                
                {activeHolds.length === 0 ? (
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>No active holds registered.</span>
                ) : (
                  <List
                    size="small"
                    dataSource={activeHolds}
                    renderItem={(item: Booking) => (
                      <List.Item style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '13px', color: '#1e293b' }}>{item.clientName}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{item.venueName} • {item.date}</div>
                          </div>
                          <Button 
                            size="small" 
                            type="link" 
                            onClick={() => extendHoldMutation.mutate(item)}
                            loading={extendHoldMutation.isPending && extendHoldMutation.variables?.id === item.id}
                            style={{ color: '#9e2a2b', padding: 0 }}
                          >
                            Extend Hold
                          </Button>
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
