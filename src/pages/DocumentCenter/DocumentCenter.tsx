import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../../services/api';
import { VaultDocument } from '../../types/banquet';
import { SkeletonLoader } from '../../components/Common/SkeletonLoader';
import { showToast } from '../../components/Feedback/ToastAlerts';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Tag, Button, Input, Modal, Select, Row, Col, Space, Divider, Steps } from 'antd';
import { FolderOpen, FileText, Search, Download, Signature, ShieldAlert, Clock, ArrowRight, Eye, Mail, CheckCircle2 } from 'lucide-react';
import dayjs from 'dayjs';

export const DocumentCenter: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, role } = useAuth();
  
  // Search state
  const [search, setSearch] = useState('');
  const [docType, setDocType] = useState('All');

  // Preview Drawer Modal
  const [selectedDoc, setSelectedDoc] = useState<VaultDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: docsRes, isLoading } = useQuery({
    queryKey: ['documents', search, docType],
    queryFn: () => documentService.getDocuments(search, docType)
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: VaultDocument['status'] }) => 
      documentService.updateDocumentStatus(id, status, user?.username || 'Unknown'),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      showToast.success('Contract lifecycle status updated.');
      if (res.data) {
        setSelectedDoc(res.data);
      }
    }
  });

  const signDocumentMutation = useMutation({
    mutationFn: (docId: string) => 
      documentService.requestESignature(docId, user?.username || 'Unknown'),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      showToast.success('e-Signature registered in secure blockchain ledger!');
      if (res.data) {
        setSelectedDoc(res.data);
      }
    }
  });

  const handleOpenPreview = (doc: VaultDocument) => {
    setSelectedDoc(doc);
    setIsPreviewOpen(true);
  };

  const handleSignDocument = (docId: string) => {
    signDocumentMutation.mutate(docId);
  };

  const handleUpdateStatus = (docId: string, status: VaultDocument['status']) => {
    updateStatusMutation.mutate({ id: docId, status });
  };

  const handleDownload = (docName: string) => {
    showToast.success(`Downloading file ${docName}...`);
  };

  const columns = [
    {
      title: 'Document Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: VaultDocument) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => handleOpenPreview(record)}>
          <FileText size={18} color="#a8201a" />
          <strong style={{ color: '#1e293b' }}>{text}</strong>
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="geekblue">{type}</Tag>
    },
    {
      title: 'Format',
      dataIndex: 'format',
      key: 'format',
      render: (fmt: string, record: VaultDocument) => <span>{fmt} ({record.size})</span>
    },
    {
      title: 'Ledger Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: VaultDocument['status']) => {
        let color = 'default';
        if (status === 'Signed' || status === 'Completed') color = 'green';
        if (status === 'Sent' || status === 'Viewed') color = 'blue';
        if (status === 'Pending e-Signature') color = 'orange';
        if (status === 'Archived') color = 'purple';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Expiry Tag',
      dataIndex: 'expiresInDays',
      key: 'expiresInDays',
      render: (days: number, record: VaultDocument) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: record.status === 'Signed' || record.status === 'Completed' ? '#64748b' : '#ef4444' }}>
          <Clock size={12} />
          <span>{record.status === 'Signed' || record.status === 'Completed' ? 'Archived' : `Expires in ${days} days`}</span>
        </div>
      )
    },
    {
      title: 'Audit Actions',
      key: 'actions',
      render: (_: any, record: VaultDocument) => (
        <Button 
          type="link" 
          size="small" 
          onClick={() => handleOpenPreview(record)}
          style={{ color: '#a8201a', fontWeight: 600, padding: 0 }}
        >
          Manage Contract →
        </Button>
      )
    }
  ];

  const documents = docsRes?.data || [];

  // Helper to determine active step in visual progress indicator
  const getStepIndex = (status: VaultDocument['status']) => {
    switch (status) {
      case 'Draft': return 0;
      case 'Sent': return 1;
      case 'Viewed': return 2;
      case 'Signed': return 3;
      case 'Completed': return 4;
      case 'Archived': return 5;
      default: return 0;
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Document Vault
        </span>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: '4px 0 0 0' }}>
          Document Center
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
          Manage event proposals, billing contracts, e-signatures ledger, and historical versions securely.
        </p>
      </div>

      {/* Filters */}
      <Card style={{ borderRadius: '12px', marginBottom: '24px', border: '1px solid #eef0f2' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input
              placeholder="Search documents..."
              prefix={<Search size={16} color="#64748b" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ borderRadius: '8px' }}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select 
              value={docType} 
              onChange={setDocType} 
              style={{ width: '100%' }}
              options={[
                { value: 'All', label: 'All Formats' },
                { value: 'Proposal', label: 'Proposals Only' },
                { value: 'Contract', label: 'Contracts Only' },
                { value: 'Quotation', label: 'Quotations Only' }
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* Grid */}
      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : (
        <Card style={{ borderRadius: '16px', border: '1px solid #eef0f2' }}>
          <Table 
            dataSource={documents} 
            columns={columns} 
            rowKey="id" 
            pagination={{ pageSize: 5 }}
            style={{ borderRadius: '8px', overflow: 'hidden' }}
          />
        </Card>
      )}

      {/* Preview Modal */}
      {selectedDoc && (
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderOpen size={20} color="#a8201a" />
              <span>Contract Lifecycle & e-Signature Workflows</span>
            </div>
          }
          open={isPreviewOpen}
          onCancel={() => setIsPreviewOpen(false)}
          footer={null}
          width={650}
        >
          <div style={{ marginTop: '20px' }}>
            
            {/* Visual Steps timeline */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
              <Steps 
                current={getStepIndex(selectedDoc.status)} 
                size="small"
                items={[
                  { title: 'Draft' },
                  { title: 'Sent' },
                  { title: 'Viewed' },
                  { title: 'Signed' },
                  { title: 'Executed' }
                ]}
              />
            </div>

            <div style={{ display: 'flex', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', background: '#ffe5e5', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                <FileText size={32} color="#a8201a" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{selectedDoc.name}</h4>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Size: {selectedDoc.size} • Format: {selectedDoc.format}</div>
                {selectedDoc.status !== 'Signed' && selectedDoc.status !== 'Completed' && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>
                    <ShieldAlert size={12} />
                    <span>Action Required: Signature Pending</span>
                  </div>
                )}
              </div>
            </div>

            {/* Version histories */}
            <div style={{ marginBottom: '24px' }}>
              <h5 style={{ fontWeight: 600, color: '#1e293b', margin: '0 0 12px 0' }}>Version History Ledger</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedDoc.versions.map((ver, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: ver.active ? '#f0fdf4' : '#fff', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <Tag color={ver.active ? 'green' : 'default'}>{ver.version}</Tag>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Created by {ver.author}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{ver.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* E-sign controls */}
            <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <div>
                <Button 
                  icon={<Download size={16} />} 
                  onClick={() => handleDownload(selectedDoc.name)}
                >
                  Download File
                </Button>
              </div>

              <Space>
                {selectedDoc.status === 'Draft' && (
                  <Button 
                    type="primary" 
                    icon={<Mail size={16} />}
                    onClick={() => handleUpdateStatus(selectedDoc.id, 'Sent')}
                    style={{ backgroundColor: '#1e293b', borderColor: '#1e293b' }}
                  >
                    Send to client
                  </Button>
                )}
                {selectedDoc.status === 'Sent' && (
                  <Button 
                    type="primary" 
                    icon={<Eye size={16} />}
                    onClick={() => handleUpdateStatus(selectedDoc.id, 'Viewed')}
                    style={{ backgroundColor: '#1e293b', borderColor: '#1e293b' }}
                  >
                    Mark as Viewed
                  </Button>
                )}
                {(selectedDoc.status === 'Viewed' || selectedDoc.status === 'Pending e-Signature') && (
                  <Button 
                    type="primary" 
                    icon={<Signature size={16} />}
                    onClick={() => handleSignDocument(selectedDoc.id)}
                    loading={signDocumentMutation.isPending}
                    style={{ backgroundColor: '#9e2a2b', borderColor: '#9e2a2b', fontWeight: 600 }}
                  >
                    Request e-Signature
                  </Button>
                )}
                {selectedDoc.status === 'Signed' && (
                  <Button 
                    type="primary" 
                    icon={<CheckCircle2 size={16} />}
                    onClick={() => handleUpdateStatus(selectedDoc.id, 'Completed')}
                    style={{ backgroundColor: '#15803d', borderColor: '#15803d', fontWeight: 600 }}
                  >
                    Execute Contract
                  </Button>
                )}
              </Space>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
