import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { kitchenService } from '../../services/api';
import type { KOTItem } from '../../types/banquet';
import { SkeletonLoader } from '../../components/Common/SkeletonLoader';
import { showToast } from '../../components/Feedback/ToastAlerts';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Card, Row, Col, Progress, Button, Avatar, List, Tag, Alert } from 'antd';
import { AlertTriangle, ChefHat, UserCheck } from 'lucide-react';

export const Coordination: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const { emitEvent, socket } = useSocket();
  const [kotList, setKotList] = useState<KOTItem[]>([]);

  const { data: kotsRes, isLoading } = useQuery({
    queryKey: ['kots'],
    queryFn: () => kitchenService.getKOTs()
  });

  useEffect(() => {
    if (kotsRes?.data) {
      setKotList(kotsRes.data);
    }
  }, [kotsRes]);

  // Real-time local ticking for durations
  useEffect(() => {
    if (kotList.length === 0) return;

    const interval = setInterval(() => {
      setKotList(prev => 
        prev.map(kot => {
          if (kot.status === 'IN PREP' || kot.status === 'DELAYED') {
            return {
              ...kot,
              durationSeconds: kot.durationSeconds + 1
            };
          }
          return kot;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [kotList]);

  // Listen to simulated socket updates for KOT changes
  useEffect(() => {
    if (!socket) return;

    const handleKOTChange = (update: { id: string; status: any; bottleneck?: string }) => {
      setKotList(prev => 
        prev.map(kot => {
          if (kot.id === update.id) {
            return {
              ...kot,
              status: update.status,
              bottleneck: update.bottleneck || kot.bottleneck
            };
          }
          return kot;
        }).filter(kot => kot.status !== 'COMPLETED') // Remove if completed
      );
      queryClient.invalidateQueries({ queryKey: ['kots'] });
    };

    socket.on('kot_status_changed', handleKOTChange);

    return () => {
      socket.off('kot_status_changed', handleKOTChange);
    };
  }, [socket, queryClient]);

  const handleDispatch = (kot: KOTItem) => {
    if (!hasPermission('manage_ops')) {
      showToast.error('Your role is unauthorized to dispatch kitchen orders.');
      return;
    }
    
    emitEvent('dispatch_kot', { kotId: kot.id });
    
    // Optimistically update
    setKotList(prev => prev.filter(k => k.id !== kot.id));
  };

  const handleEscalate = (kot: KOTItem) => {
    if (!hasPermission('manage_ops')) {
      showToast.error('Your role is unauthorized to escalate kitchen orders.');
      return;
    }

    emitEvent('escalate_kot', { kotId: kot.id });
  };

  // Convert duration seconds to MM:SS format
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Static timeline stages
  const timelineStages = [
    { label: 'Welcome Drinks', time: '19:00', status: 'COMPLETED' },
    { label: 'Appetizers Served', time: '20:30', status: 'LIVE PROGRESS' },
    { label: 'Main Course', time: '21:15', status: 'READY TO FIRE' },
    { label: 'Dessert & Coffee', time: '22:30', status: 'PENDING' },
  ];

  if (isLoading) {
    return <SkeletonLoader type="table" />;
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Live KOT Tracking
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: '4px 0 0 0' }}>
            Operations Command Board
          </h1>
        </div>
        <Tag color="green" style={{ fontSize: '13px', padding: '4px 8px', fontWeight: 600 }}>On Schedule</Tag>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Side: Live KOT Cards & Service Timeline */}
        <Col xs={24} lg={16}>
          {/* Active Order Tickets */}
          <Card 
            title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px' }}><ChefHat size={18} color="#a8201a" /> Active Kitchen Order Tickets</div>}
            style={{ borderRadius: '16px', marginBottom: '24px' }}
          >
            {kotList.length === 0 ? (
              <Alert message="All tickets dispatched! Kitchen queue is clear." type="success" showIcon />
            ) : (
              <Row gutter={[16, 16]}>
                {kotList.map(kot => {
                  const isDelayed = kot.status === 'DELAYED';
                  const percent = Math.min(100, Math.round((kot.durationSeconds / 480) * 100)); // 8 min target
                  
                  return (
                    <Col xs={24} md={12} key={kot.id}>
                      <div 
                        style={{ 
                          border: isDelayed ? '2px solid #ef4444' : '2px solid #22c55e', 
                          borderRadius: '12px', 
                          background: isDelayed ? '#fff5f5' : '#fff',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>{kot.kotNumber}</span>
                            <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>{kot.tableRange}</span>
                          </div>
                          <span style={{ fontWeight: 800, fontSize: '14px', color: isDelayed ? '#ef4444' : '#1e293b' }}>
                            {formatDuration(kot.durationSeconds)}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                          {kot.itemName}
                        </h3>

                        <Progress 
                          percent={percent} 
                          strokeColor={isDelayed ? '#ef4444' : '#22c55e'} 
                          showInfo={false} 
                          style={{ margin: '4px 0' }}
                        />

                        {isDelayed && kot.bottleneck && (
                          <div style={{ fontSize: '11px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', background: '#ffe3e3', padding: '6px 8px', borderRadius: '4px' }}>
                            <AlertTriangle size={12} />
                            <span>{kot.bottleneck}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Assigned: {kot.chefAssigned}</span>
                          
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {!isDelayed && (
                              <Button 
                                size="small" 
                                type="text"
                                onClick={() => handleEscalate(kot)}
                                style={{ color: '#ef4444', fontWeight: 600 }}
                              >
                                Escalate
                              </Button>
                            )}
                            <Button
                              size="small"
                              type="primary"
                              onClick={() => handleDispatch(kot)}
                              style={{ 
                                backgroundColor: '#1e293b', 
                                borderColor: '#1e293b',
                                borderRadius: '4px',
                                fontWeight: 600,
                                fontSize: '12px'
                              }}
                            >
                              Dispatch
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Card>

          {/* Service Flow Timeline */}
          <Card 
            title={<span style={{ fontWeight: 600, fontSize: '15px' }}>Service Timeline Flow</span>}
            style={{ borderRadius: '16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', position: 'relative' }}>
              {/* Connector Line */}
              <div style={{ position: 'absolute', top: '36px', left: '40px', right: '40px', height: '4px', background: '#e2e8f0', zIndex: 1 }}></div>

              {timelineStages.map((stage, idx) => {
                const isCompleted = stage.status === 'COMPLETED';
                const isLive = stage.status === 'LIVE PROGRESS';
                
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, textAlign: 'center', width: '22%' }}>
                    <div 
                      style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        background: isCompleted ? '#22c55e' : isLive ? '#a8201a' : '#cbd5e1',
                        border: isLive ? '4px solid #ffe5e5' : '4px solid #fff',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        marginBottom: '12px',
                        animation: isLive ? 'pulse 2s infinite' : 'none'
                      }}
                    ></div>
                    
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block' }}>{stage.label}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{stage.time}</span>
                    
                    <div style={{ marginTop: '8px' }}>
                      <Tag color={isCompleted ? 'green' : isLive ? 'red' : 'default'} style={{ fontSize: '9px', fontWeight: 700, margin: 0 }}>
                        {stage.status}
                      </Tag>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* Right Side: Floor Staff & Operations Alerts */}
        <Col xs={24} lg={8}>
          {/* Active Kitchen Staff */}
          <Card 
            title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px' }}><UserCheck size={18} color="#a8201a" /> Floor & Kitchen Staff</div>}
            style={{ borderRadius: '16px', marginBottom: '24px' }}
          >
            <List
              itemLayout="horizontal"
              dataSource={[
                { name: 'Chef Marco', role: 'Exec Chef • Grill', status: 'active', avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=150' },
                { name: 'Sarah K.', role: 'Sous Chef • Pastry', status: 'active', avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=150' },
                { name: 'Thomas J.', role: 'Junior • Prep', status: 'busy', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150' }
              ]}
              renderItem={item => (
                <List.Item style={{ padding: '12px 0' }}>
                  <List.Item.Meta
                    avatar={<Avatar src={item.avatar} size="large" />}
                    title={<span style={{ fontWeight: 600, color: '#1e293b' }}>{item.name}</span>}
                    description={item.role}
                  />
                  <div>
                    <Tag color={item.status === 'active' ? 'green' : 'orange'}>
                      {item.status.toUpperCase()}
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>

          {/* Operations Alerts */}
          <Card 
            title={<span style={{ fontWeight: 600, fontSize: '15px', color: '#1e293b' }}>Active Service Warnings</span>}
            style={{ borderRadius: '16px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', padding: '12px', background: '#fff5f5', borderRadius: '12px', borderLeft: '4px solid #ef4444' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <AlertTriangle color="#ef4444" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>Table Service Stall</h4>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
                      Table 22 has been waiting for desserts for more than 12 minutes.
                    </p>
                    <Button 
                      type="link" 
                      onClick={() => showToast.info('Paging server assigned to Table 22...')}
                      style={{ padding: 0, color: '#a8201a', fontSize: '12px', fontWeight: 600 }}
                    >
                      Locate Server
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
