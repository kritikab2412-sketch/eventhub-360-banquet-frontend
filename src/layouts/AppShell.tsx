import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { showToast } from '../components/Feedback/ToastAlerts';
import { 
  LayoutDashboard, 
  Building2, 
  Calendar, 
  FileText, 
  Layers, 
  ChefHat, 
  Utensils, 
  Scroll, 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  ChevronDown, 
  HelpCircle, 
  Archive,
  BarChart3,
  Users,
  FolderOpen,
  FileCheck,
  TrendingUp,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { Dropdown, Badge, Drawer, Avatar, List, Tag, Select, Button } from 'antd';

interface AppShellProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenNewBookingModal: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({ 
  children, 
  activeView, 
  setActiveView, 
  onOpenNewBookingModal 
}) => {
  const { user, role, switchRole, logout } = useAuth();
  const { isConnected, socket } = useSocket();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Real-time categorized alerts with priority weights
  const [notifications, setNotifications] = useState<any[]>([
    { id: 1, type: 'conflict', category: 'Operations', priority: 'High', title: 'Double Booking Warning', desc: 'Main Ballroom overlapping with Kitchen Maintenance on Sept 5.', time: '2 mins ago', unread: true },
    { id: 2, type: 'reminder', category: 'Finance', priority: 'Medium', title: 'Deposit Overdue Alert', desc: 'Realty Mixer tentative hold expires in 24 hours.', time: '1 hour ago', unread: true },
    { id: 3, type: 'approved', category: 'Documents', priority: 'Low', title: 'BEO #8842-A Signed Off', desc: 'Annual Corporate Gala BEO signed off by client.', time: '3 hours ago', unread: false }
  ]);

  // Listen for real-time notifications via simulated socket
  useEffect(() => {
    if (!socket) return;
    
    const handleAlert = (alert: any) => {
      const newNotif = {
        id: Date.now(),
        type: alert.type || 'warning',
        category: alert.title.includes('Kitchen') ? 'Kitchen' : 'System',
        priority: 'High',
        title: alert.title,
        desc: alert.desc,
        time: 'Just now',
        unread: true
      };
      setNotifications(prev => [newNotif, ...prev]);
      showToast.pushAlert(alert.title, alert.desc, alert.type === 'error' ? 'error' : 'warning');
    };

    socket.on('operation_alert', handleAlert);

    return () => {
      socket.off('operation_alert', handleAlert);
    };
  }, [socket]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    showToast.success('All notifications marked as read.');
  };

  const handleRoleChange = (value: string) => {
    switchRole(value);
  };

  const handleNotifClick = (notif: any) => {
    setIsNotifOpen(false);
    
    // Deep-linking: clicking the notification closes drawer and routes to corresponding views
    if (notif.category === 'Operations' || notif.type === 'conflict') {
      setActiveView('availability');
    } else if (notif.category === 'Finance' || notif.type === 'reminder') {
      setActiveView('finance-dashboard');
    } else if (notif.category === 'Documents' || notif.type === 'approved') {
      setActiveView('beo-approvals');
    } else {
      setActiveView('notifications');
    }
  };

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { key: 'operations-tower', label: 'Operations Tower', icon: <TrendingUp size={18} /> },
    { key: 'finance-dashboard', label: 'Finance Dashboard', icon: <DollarSign size={18} /> },
    { key: 'client-portal', label: 'Client Portal link', icon: <Briefcase size={18} /> },
    { key: 'venue-config', label: 'Venue Config', icon: <Building2 size={18} /> },
    { key: 'availability', label: 'Availability', icon: <Calendar size={18} /> },
    { key: 'beo-generator', label: 'BEO Generator', icon: <FileText size={18} /> },
    { key: 'layout-configurator', label: 'Layout Configurator', icon: <Layers size={18} /> },
    { key: 'coordination', label: 'Coordination', icon: <ChefHat size={18} /> },
    { key: 'fb-packages', label: 'F&B Packages', icon: <Utensils size={18} /> },
    { key: 'audit-log', label: 'Audit Log', icon: <Scroll size={18} /> },
    { key: 'notifications', label: 'Notification Center', icon: <Bell size={18} /> },
    { key: 'analytics', label: 'BI Analytics', icon: <BarChart3 size={18} /> },
    { key: 'guests', label: 'Guest Directory', icon: <Users size={18} /> },
    { key: 'beo-approvals', label: 'BEO Approvals', icon: <FileCheck size={18} /> },
    { key: 'documents', label: 'Document Vault', icon: <FolderOpen size={18} /> },
  ];

  const profileMenu = {
    items: [
      {
        key: 'profile',
        label: 'My Profile',
        icon: <User size={14} />,
      },
      {
        key: 'logout',
        label: 'Logout',
        icon: <LogOut size={14} />,
        danger: true,
        onClick: logout,
      },
    ],
  };

  const activeUnreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="app-sidebar">
        <div className="sidebar-brand-wrapper">
          <div className="sidebar-brand-logo">
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#a8201a' }}>EventHub</span>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Banquet Management
            </span>
          </div>
        </div>

        <div style={{ padding: '0 16px 16px 16px' }}>
          <button 
            className="btn-new-booking" 
            onClick={onOpenNewBookingModal}
          >
            + New Booking
          </button>
        </div>

        <nav className="sidebar-nav-menu" style={{ overflowY: 'auto', flex: 1 }}>
          {menuItems.map(item => {
            const isActive = activeView === item.key;
            return (
              <a
                key={item.key}
                href={`#${item.key}`}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveView(item.key);
                }}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span className="nav-item-label">{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="sidebar-nav-footer">
          <a href="#support" className="sidebar-nav-item secondary" onClick={(e) => { e.preventDefault(); showToast.info('Support ticketing system loading...'); }}>
            <HelpCircle size={18} />
            <span>Support</span>
          </a>
          <a href="#archive" className="sidebar-nav-item secondary" onClick={(e) => { e.preventDefault(); showToast.info('Loading archived banquets...'); }}>
            <Archive size={18} />
            <span>Archive</span>
          </a>
          
          <div className="sidebar-connection-status">
            <span className={`status-dot ${isConnected ? 'online' : 'offline'}`}></span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {isConnected ? 'Real-Time Sync Online' : 'Sync Offline'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="app-workspace">
        {/* Top Header */}
        <header className="app-header">
          {/* Left: EventHub 360 Tabbar Links */}
          <div className="header-navigation-tabs">
            <span className="header-brand-title">EventHub360</span>
            <div className="header-tab-links">
              <a 
                href="#operations" 
                className={`header-tab-link ${['operations-tower', 'coordination', 'notifications'].includes(activeView) ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveView('operations-tower'); }}
              >
                Operations
              </a>
              <a 
                href="#venues" 
                className={`header-tab-link ${['venue-config', 'layout-configurator'].includes(activeView) ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveView('venue-config'); }}
              >
                Venues
              </a>
              <a 
                href="#calendars" 
                className={`header-tab-link ${['availability', 'dashboard', 'finance-dashboard', 'analytics', 'guests'].includes(activeView) ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveView('availability'); }}
              >
                Calendars
              </a>
              <a 
                href="#beos" 
                className={`header-tab-link ${['beo-generator', 'beo-approvals', 'documents', 'client-portal'].includes(activeView) ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveView('beo-generator'); }}
              >
                BEOs
              </a>
            </div>
          </div>

          {/* Right: Quick actions, Role Switcher, Profile */}
          <div className="header-actions">
            {/* RBAC Role Switcher */}
            <div className="header-role-switcher">
              <span className="role-switcher-label">Preview Role:</span>
              <Select
                value={role}
                onChange={handleRoleChange}
                style={{ width: 140 }}
                options={[
                  { value: 'Banquet Mgr', label: 'Banquet Mgr' },
                  { value: 'Sales Mgr', label: 'Sales Mgr' },
                  { value: 'Kitchen Mgr', label: 'Kitchen Mgr' },
                  { value: 'Finance', label: 'Finance' },
                ]}
                popupClassName="role-select-popup"
              />
            </div>

            {/* Notification Bell */}
            <button className="header-icon-btn" onClick={() => setIsNotifOpen(true)}>
              <Badge count={activeUnreadCount} size="small" color="#a8201a">
                <Bell size={20} color="#1e293b" />
              </Badge>
            </button>

            {/* Settings */}
            <button className="header-icon-btn" onClick={() => showToast.info('Settings panel loading...')}>
              <Settings size={20} color="#1e293b" />
            </button>

            <span className="header-divider"></span>

            {/* User Profile Dropdown */}
            <Dropdown menu={profileMenu} trigger={['click']}>
              <div className="header-user-profile">
                <Avatar 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" 
                  alt="Avatar"
                  style={{ border: '2px solid #e2e8f0' }}
                />
                <div className="user-details-text">
                  <span className="user-name">{user?.username}</span>
                  <span className="user-role-tag">{role}</span>
                </div>
                <ChevronDown size={14} color="#64748b" />
              </div>
            </Dropdown>
          </div>
        </header>

        {/* Dynamic Viewport */}
        <main className="app-viewport-content">
          {children}
        </main>
      </div>

      {/* Notifications Drawer */}
      <Drawer
        title="Live Operations Alert Hub"
        placement="right"
        onClose={() => setIsNotifOpen(false)}
        open={isNotifOpen}
        width={380}
        extra={
          <Button type="text" onClick={markAllAsRead} style={{ color: '#a8201a', fontWeight: 600 }}>
            Mark all read
          </Button>
        }
      >
        <List
          itemLayout="horizontal"
          dataSource={notifications}
          renderItem={(notif) => (
            <List.Item
              onClick={() => handleNotifClick(notif)}
              style={{
                background: notif.unread ? '#fff5f5' : 'transparent',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '8px',
                borderLeft: notif.unread ? '4px solid #a8201a' : '4px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{notif.title}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{notif.time}</span>
                  </div>
                }
                description={
                  <div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>{notif.desc}</p>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                      <Tag color={notif.type === 'conflict' ? 'red' : notif.type === 'reminder' ? 'purple' : 'green'}>
                        {notif.type.toUpperCase()}
                      </Tag>
                      <Tag color={notif.priority === 'High' ? 'red' : notif.priority === 'Medium' ? 'orange' : 'blue'}>
                        {notif.priority.toUpperCase()}
                      </Tag>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  );
};
export default AppShell;
