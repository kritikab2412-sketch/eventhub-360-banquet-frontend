import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService, venueService } from '../../services/api';
import { Booking, BookingStatus } from '../../types/banquet';
import { SkeletonLoader } from '../../components/Common/SkeletonLoader';
import { showToast } from '../../components/Feedback/ToastAlerts';
import { useAuth } from '../../context/AuthContext';
import { Card, Row, Col, DatePicker, Select, Button, Tag, Alert, Popover, Badge } from 'antd';
import { ChevronLeft, ChevronRight, Filter, AlertTriangle, Clock, CalendarDays } from 'lucide-react';
import dayjs from 'dayjs';

export const Availability: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Quick Booking State
  const [quickDate, setQuickDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [quickVenueId, setQuickVenueId] = useState('venue-1');
  const [quickVenueName, setQuickVenueName] = useState('Imperial Grand Ballroom');
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [checkResult, setCheckResult] = useState<'available' | 'conflict' | null>(null);

  // Dynamic Calendar month state (defaults to September 2024 to show mock data first)
  const [currentMonth, setCurrentMonth] = useState(dayjs('2024-09-01'));
  const todayStr = dayjs().format('YYYY-MM-DD');

  const { data: bookingsRes, isLoading: loadingBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingService.getBookings()
  });

  const { data: venuesRes, isLoading: loadingVenues } = useQuery({
    queryKey: ['venues'],
    queryFn: () => venueService.getVenues()
  });

  const bookings = bookingsRes?.data || [];
  const venues = venuesRes?.data || [];

  const handleCheckAvailability = () => {
    setCheckingAvailability(true);
    setCheckResult(null);

    setTimeout(() => {
      setCheckingAvailability(false);
      // Check if there is any overlapping booking for September 5th on Venue 1
      const isOverlapped = bookings.some(b => {
        const bStart = b.startDate || b.date;
        const bEnd = b.endDate || b.date;
        return (
          b.venueId === quickVenueId && 
          b.status !== 'Blocked' &&
          b.status !== 'Archived' &&
          quickDate <= bEnd && 
          quickDate >= bStart
        );
      });
      
      if (isOverlapped) {
        setCheckResult('conflict');
        showToast.error('Space is unavailable during this date/time window!');
      } else {
        setCheckResult('available');
        showToast.success('Space is available! Ready for booking.');
      }
    }, 800);
  };

  // Calendar Day Generator
  // Calculates the start day of the monthly calendar grid dynamically.
  const startOfMonth = currentMonth.startOf('month');
  const offset = startOfMonth.day() === 0 ? 6 : startOfMonth.day() - 1;
  const startDay = startOfMonth.subtract(offset, 'day');
  const daysGrid = Array.from({ length: 42 }).map((_, idx) => {
    const currentDay = startDay.add(idx, 'day');
    const dateStr = currentDay.format('YYYY-MM-DD');
    // Filter bookings that overlap this calendar day (supporting date ranges)
    const dayBookings = bookings.filter(b => {
      const bStart = b.startDate || b.date;
      const bEnd = b.endDate || b.date;
      return dateStr >= bStart && dateStr <= bEnd;
    });
    return {
      day: currentDay.date(),
      month: currentDay.month(),
      year: currentDay.year(),
      dateStr,
      isCurrentMonth: currentDay.month() === currentMonth.month(),
      bookings: dayBookings
    };
  });

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'Confirmed': return 'success';
      case 'Tentative': return 'warning';
      case 'Blocked': return 'error';
      default: return 'default';
    }
  };

  const getStatusDotColor = (status: BookingStatus) => {
    switch (status) {
      case 'Confirmed': return '#22c55e';
      case 'Tentative': return '#f59e0b';
      case 'Blocked': return '#ef4444';
      default: return '#cbd5e1';
    }
  };

  if (loadingBookings || loadingVenues) {
    return <SkeletonLoader type="table" />;
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Top Banner and Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Banquets / Calendar
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: '4px 0 0 0' }}>{currentMonth.format('MMMM YYYY')}</h1>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Day/Week/Month selector */}
          <div style={{ display: 'flex', padding: '4px', background: '#f1f5f9', borderRadius: '24px' }}>
            <Button type="text" style={{ borderRadius: '20px', fontSize: '13px' }}>Daily</Button>
            <Button type="text" style={{ borderRadius: '20px', fontSize: '13px' }}>Weekly</Button>
            <Button type="primary" style={{ borderRadius: '20px', fontSize: '13px', backgroundColor: '#fff', color: '#1e293b', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>Monthly</Button>
          </div>

          {/* Navigation Arrows */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '8px' }}>
            <Button type="text" icon={<ChevronLeft size={16} />} style={{ border: 0 }} onClick={() => setCurrentMonth(prev => prev.subtract(1, 'month'))} />
            <span style={{ fontSize: '13px', fontWeight: 600, padding: '0 8px', cursor: 'pointer' }} onClick={() => setCurrentMonth(dayjs())}>Today</span>
            <Button type="text" icon={<ChevronRight size={16} />} style={{ border: 0 }} onClick={() => setCurrentMonth(prev => prev.add(1, 'month'))} />
          </div>

          <Button icon={<Filter size={16} />}>Filter Venues</Button>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Side: Calendar Grid */}
        <Col xs={24} lg={17}>
          <Card style={{ borderRadius: '16px', padding: 0 }} bodyStyle={{ padding: 0 }}>
            {/* Calendar Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                <div key={day} style={{ textAlign: 'center', padding: '12px 0', fontSize: '12px', fontWeight: 700, color: day === 'SAT' || day === 'SUN' ? '#ef4444' : '#64748b' }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Body */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '100px' }}>
              {daysGrid.map((dayItem, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    borderRight: '1px solid #f1f5f9', 
                    borderBottom: '1px solid #f1f5f9', 
                    padding: '8px', 
                    background: dayItem.isCurrentMonth ? '#fff' : '#f8fafc',
                    opacity: dayItem.isCurrentMonth ? 1 : 0.5,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    color: dayItem.dateStr === todayStr ? '#a8201a' : '#1e293b',
                    display: 'inline-flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: dayItem.dateStr === todayStr ? '#ffe5e5' : 'transparent'
                  }}>
                    {dayItem.day}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
                    {dayItem.bookings.map(b => (
                      <Popover 
                        key={b.id} 
                        title={<strong style={{ color: '#a8201a' }}>{b.clientName} ({b.eventType})</strong>}
                        content={
                          <div style={{ fontSize: '12px' }}>
                            <p><strong>Venue:</strong> {b.venueName}</p>
                            <p><strong>Schedule:</strong> {b.startTime} - {b.endTime}</p>
                            <p><strong>Billing:</strong>₹{b.billingAmount.toLocaleString()}</p>
                            <p><strong>Status:</strong> <Tag color={getStatusColor(b.status)}>{b.status}</Tag></p>
                          </div>
                        }
                      >
                        <div 
                          style={{ 
                            fontSize: '10px', 
                            padding: '2px 4px', 
                            borderRadius: '4px', 
                            background: b.status === 'Confirmed' ? '#e2fbe8' : b.status === 'Tentative' ? '#fef3c7' : '#fee2e2',
                            color: b.status === 'Confirmed' ? '#15803d' : b.status === 'Tentative' ? '#b45309' : '#b91c1c',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            borderLeft: `3px solid ${getStatusDotColor(b.status)}`
                          }}
                        >
                          {b.status === 'Blocked' ? 'BLOCKED' : b.clientName}
                        </div>
                      </Popover>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Right Side: Quick Booking & Alerts Panel */}
        <Col xs={24} lg={7}>
          {/* Quick Booking */}
          <Card 
            title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px' }}><CalendarDays size={18} color="#a8201a" /> Quick Booking</div>}
            style={{ borderRadius: '16px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Date</label>
                <DatePicker 
                  defaultValue={dayjs()}
                  onChange={(date) => date && setQuickDate(date.format('YYYY-MM-DD'))}
                  style={{ width: '100%', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label className="form-label">Venue Room</label>
                <Select
                  value={quickVenueId}
                  onChange={(val, option: any) => {
                    setQuickVenueId(val);
                    setQuickVenueName(option.label);
                  }}
                  style={{ width: '100%' }}
                  options={venues.map(v => ({ value: v.id, label: v.name }))}
                />
              </div>

              <Button
                type="primary"
                loading={checkingAvailability}
                onClick={handleCheckAvailability}
                style={{ 
                  backgroundColor: '#ffe5e5', 
                  color: '#a8201a', 
                  borderColor: 'transparent',
                  fontWeight: 600,
                  height: '42px',
                  borderRadius: '8px',
                  marginTop: '8px'
                }}
              >
                Check Availability
              </Button>

              {checkResult === 'available' && (
                <Alert
                  message="Space Available"
                  description="No overlapping slots. Double booking checks passed."
                  type="success"
                  showIcon
                  style={{ borderRadius: '8px' }}
                />
              )}

              {checkResult === 'conflict' && (
                <Alert
                  message="Overlapping Slot Detected"
                  description="A booking conflict was flagged. Action required."
                  type="error"
                  showIcon
                  style={{ borderRadius: '8px' }}
                />
              )}
            </div>
          </Card>

          {/* Alerts Panel */}
          <Card 
            title={<span style={{ fontWeight: 600, fontSize: '15px', color: '#1e293b' }}>Active Calendar Alerts</span>}
            style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Conflict Alert */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: '12px', background: '#fff5f5', borderRadius: '12px', borderLeft: '4px solid #ef4444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Tag color="red" style={{ margin: 0, fontWeight: 700, fontSize: '10px' }}>CONFLICT</Tag>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Sept 5</span>
                </div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>Double Booking Detected</h4>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  Main Ballroom overlapping with Kitchen Maintenance block at 4:00 PM.
                </p>
              </div>

              {/* Deposit Overdue */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: '12px', background: '#f5f3ff', borderRadius: '12px', borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Tag color="purple" style={{ margin: 0, fontWeight: 700, fontSize: '10px' }}>REMINDER</Tag>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Sept 10</span>
                </div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>Deposit Overdue</h4>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  Realty Mixer tentative hold expires in 24 hours.
                </p>
              </div>

              {/* Legends */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                  Confirmed ({bookings.filter(b => b.status === 'Confirmed').length})
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
                  Tentative ({bookings.filter(b => b.status === 'Tentative').length})
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                  Blocked ({bookings.filter(b => b.status === 'Blocked').length})
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
