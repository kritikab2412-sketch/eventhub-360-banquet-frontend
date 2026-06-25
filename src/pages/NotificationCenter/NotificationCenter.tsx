import React, { useState } from 'react';
import { Card, List, Button, Tag, Input, Row, Col, Badge } from 'antd';
import { Bell, Search, Eye, CheckCheck, Trash2, AlertTriangle, Info, Calendar, Clock } from 'lucide-react';
import { showToast } from '../../components/Feedback/ToastAlerts';

interface NotificationItem {
  id: number;
  type: 'conflict' | 'reminder' | 'approved' | 'system';
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

export const NotificationCenter: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 1, type: 'conflict', title: 'Double Booking Warning', desc: 'Imperial Grand Ballroom overlapping with Kitchen Maintenance block on Sept 5.', time: '2 mins ago', unread: true },
    { id: 2, type: 'reminder', title: 'Deposit Overdue Alert', desc: 'Realty Mixer tentative hold is scheduled to release automatically in 24h.', time: '1 hour ago', unread: true },
    { id: 3, type: 'approved', title: 'BEO #8842-A Approved', desc: 'Global Tech Solutions Corporate Gala BEO signed off by client.', time: '3 hours ago', unread: false },
    { id: 4, type: 'system', title: 'Egress Buffer Exception', desc: 'Seating Layout seating buffer checks passed for Imperial Ballroom setup.', time: '1 day ago', unread: false },
    { id: 5, type: 'reminder', title: 'Signatures Pending', desc: 'Catering Contract for TechConf awaits e-signatures from Sales Mgr.', time: '2 days ago', unread: true }
  ]);

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    showToast.success('Notification marked as read.');
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    showToast.success('All notifications marked as read.');
  };

  const handleDelete = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    showToast.info('Notification cleared.');
  };

  const filtered = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.desc.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || n.unread;
    return matchesSearch && matchesFilter;
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'conflict': return <AlertTriangle size={20} color="#ef4444" />;
      case 'reminder': return <Clock size={20} color="#8b5cf6" />;
      case 'approved': return <CheckCheck size={20} color="#22c55e" />;
      default: return <Info size={20} color="#3b82f6" />;
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Alert Hub
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: '4px 0 0 0' }}>
            Notification Center
          </h1>
        </div>

        <Button 
          type="primary" 
          icon={<CheckCheck size={16} />} 
          onClick={handleMarkAllRead}
          style={{ backgroundColor: '#9e2a2b', borderColor: '#9e2a2b', borderRadius: '8px' }}
        >
          Mark All as Read
        </Button>
      </div>

      <Card style={{ borderRadius: '16px', border: '1px solid #eef0f2' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: '20px' }} align="middle">
          <Col xs={24} md={12}>
            <div style={{ display: 'flex', padding: '4px', background: '#f1f5f9', borderRadius: '24px', width: 'fit-content' }}>
              <Button 
                type={filter === 'all' ? 'primary' : 'text'} 
                onClick={() => setFilter('all')}
                style={{ borderRadius: '20px', fontSize: '13px', backgroundColor: filter === 'all' ? '#fff' : 'transparent', color: '#1e293b', border: 0 }}
              >
                All Alerts
              </Button>
              <Button 
                type={filter === 'unread' ? 'primary' : 'text'} 
                onClick={() => setFilter('unread')}
                style={{ borderRadius: '20px', fontSize: '13px', backgroundColor: filter === 'unread' ? '#fff' : 'transparent', color: '#1e293b', border: 0 }}
              >
                Unread <Badge count={notifications.filter(n => n.unread).length} size="small" style={{ backgroundColor: '#a8201a', marginLeft: '6px' }} />
              </Button>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <Input
              placeholder="Search notifications..."
              prefix={<Search size={16} color="#64748b" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ borderRadius: '8px' }}
            />
          </Col>
        </Row>

        <List
          itemLayout="horizontal"
          dataSource={filtered}
          renderItem={item => (
            <List.Item
              style={{
                background: item.unread ? '#fff5f5' : 'transparent',
                padding: '16px 20px',
                borderRadius: '12px',
                marginBottom: '12px',
                border: '1px solid #f1f5f9',
                borderLeft: item.unread ? '4px solid #a8201a' : '4px solid #cbd5e1'
              }}
              actions={[
                item.unread && (
                  <Button 
                    key="read" 
                    type="text" 
                    icon={<Eye size={16} />} 
                    onClick={() => handleMarkAsRead(item.id)}
                    style={{ color: '#64748b' }}
                  >
                    Mark read
                  </Button>
                ),
                <Button 
                  key="delete" 
                  type="text" 
                  danger 
                  icon={<Trash2 size={16} />} 
                  onClick={() => handleDelete(item.id)}
                />
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={
                  <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getIcon(item.type)}
                  </div>
                }
                title={
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>{item.title}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{item.time}</span>
                  </div>
                }
                description={
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    {item.desc}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};
