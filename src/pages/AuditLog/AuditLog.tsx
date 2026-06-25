import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditService } from '../../services/api';
import { AuditLog } from '../../types/banquet';
import { SkeletonLoader } from '../../components/Common/SkeletonLoader';
import { Card, Table, Tag, Input, Row, Col, Modal, Button, Space } from 'antd';
import { Scroll, Search, Eye, ArrowRight } from 'lucide-react';
import dayjs from 'dayjs';

export const AuditLogViewer: React.FC = () => {
  const [search, setSearch] = useState('');
  const [localLogs, setLocalLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDiffOpen, setIsDiffOpen] = useState(false);

  const { data: logsRes, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditService.getLogs(),
    refetchInterval: 5000 // Poll every 5 seconds for new audit actions
  });

  useEffect(() => {
    if (logsRes?.data) {
      setLocalLogs(logsRes.data);
    }
  }, [logsRes]);

  // Listen to sessionStorage updates (e.g. role switches)
  useEffect(() => {
    const handleStorageChange = () => {
      refetch();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refetch]);

  const handleOpenDiff = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDiffOpen(true);
  };

  const filteredLogs = localLogs.filter(log => 
    log.actor.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.details.toLowerCase().includes(search.toLowerCase()) ||
    log.resourceType.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (time: string) => <span>{dayjs(time).format('YYYY-MM-DD HH:mm:ss')}</span>,
      sorter: (a: AuditLog, b: AuditLog) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      defaultSortOrder: 'descend' as const,
      width: '180px'
    },
    {
      title: 'Actor',
      dataIndex: 'actor',
      key: 'actor',
      render: (actor: string, record: AuditLog) => (
        <div>
          <strong style={{ color: '#1e293b' }}>{actor}</strong>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Role: {record.role}</div>
        </div>
      ),
      width: '150px'
    },
    {
      title: 'Action Triggered',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        let color = 'default';
        if (action.includes('Created')) color = 'green';
        if (action.includes('Modified') || action.includes('Extend')) color = 'orange';
        if (action.includes('Approved') || action.includes('Sign')) color = 'purple';
        if (action.includes('Switch')) color = 'blue';
        return <Tag color={color}>{action}</Tag>;
      },
      width: '160px'
    },
    {
      title: 'Resource Type',
      dataIndex: 'resourceType',
      key: 'resourceType',
      render: (type: string) => <Tag color="geekblue">{type}</Tag>,
      width: '130px'
    },
    {
      title: 'Description Details',
      dataIndex: 'details',
      key: 'details',
      render: (text: string) => <span style={{ color: '#64748b' }}>{text}</span>,
    },
    {
      title: 'Diff Analysis',
      key: 'diff',
      render: (_: any, record: AuditLog) => {
        const hasDiff = record.oldValue || record.newValue;
        if (!hasDiff) return <span style={{ color: '#cbd5e1', fontSize: '11px' }}>No diff ledger</span>;
        
        return (
          <Button 
            size="small" 
            type="link" 
            icon={<Eye size={12} />}
            onClick={() => handleOpenDiff(record)}
            style={{ color: '#9e2a2b', padding: 0, fontSize: '12px', fontWeight: 600 }}
          >
            Compare Changes
          </Button>
        );
      },
      width: '150px'
    }
  ];

  if (isLoading) {
    return <SkeletonLoader type="table" />;
  }

  // Helper to format values for display in diff
  const formatDiffValue = (val: string | undefined) => {
    if (!val) return 'Empty / Null';
    try {
      // Check if JSON
      const parsed = JSON.parse(val);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return val;
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            System Audit Trail
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: '4px 0 0 0' }}>
            Audit Logs
          </h1>
        </div>
      </div>

      <Card style={{ borderRadius: '16px', border: '1px solid #eef0f2' }}>
        {/* Search */}
        <Row style={{ marginBottom: '16px' }}>
          <Col xs={24} md={8}>
            <Input
              placeholder="Search logs by actor, action or resource..."
              prefix={<Search size={16} color="#64748b" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ borderRadius: '8px' }}
            />
          </Col>
        </Row>

        <Table
          dataSource={filteredLogs}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          style={{ borderRadius: '8px', overflow: 'hidden' }}
        />
      </Card>

      {/* Side-by-Side Diff Comparison Modal */}
      {selectedLog && (
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scroll size={20} color="#a8201a" />
              <span>Audit Diff Comparison: {selectedLog.action}</span>
            </div>
          }
          open={isDiffOpen}
          onCancel={() => setIsDiffOpen(false)}
          footer={null}
          width={680}
        >
          <div style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Comparing database fields on <strong>{selectedLog.resourceType}</strong> (ID: {selectedLog.resourceId}) modified by <strong>{selectedLog.actor}</strong>.
            </p>

            <Row gutter={16}>
              <Col span={11}>
                <div style={{ padding: '8px 12px', background: '#ffeef0', borderRadius: '4px', marginBottom: '8px', fontWeight: 700, color: '#b91c1c' }}>
                  OLD VALUE
                </div>
                <pre style={{ 
                  background: '#f8fafc', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0', 
                  maxHeight: '260px', 
                  overflowY: 'auto',
                  fontSize: '11px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {formatDiffValue(selectedLog.oldValue)}
                </pre>
              </Col>
              
              <Col span={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowRight size={20} color="#94a3b8" />
              </Col>
              
              <Col span={11}>
                <div style={{ padding: '8px 12px', background: '#e6f4ea', borderRadius: '4px', marginBottom: '8px', fontWeight: 700, color: '#137333' }}>
                  NEW VALUE
                </div>
                <pre style={{ 
                  background: '#f8fafc', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0', 
                  maxHeight: '260px', 
                  overflowY: 'auto',
                  fontSize: '11px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {formatDiffValue(selectedLog.newValue)}
                </pre>
              </Col>
            </Row>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <Button onClick={() => setIsDiffOpen(false)}>Close Diff</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
