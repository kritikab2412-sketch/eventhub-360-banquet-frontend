import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../../services/api';
import { Booking } from '../../types/banquet';
import { SkeletonLoader } from '../../components/Common/SkeletonLoader';
import { showToast } from '../../components/Feedback/ToastAlerts';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Tag, Button, Input, Modal, Select, Row, Col, Space, Progress, Divider, Statistic } from 'antd';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Filter, 
  CreditCard, 
  Edit, 
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

export const FinanceDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { role, user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // Form input fields for financial edits
  const [depositReceivedInput, setDepositReceivedInput] = useState<number>(0);
  const [refundedAmountInput, setRefundedAmountInput] = useState<number>(0);
  const [billingAmountInput, setBillingAmountInput] = useState<number>(0);

  // Filters State
  const [search, setSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');

  const { data: bookingsRes, isLoading } = useQuery({
    queryKey: ['bookings', search],
    queryFn: () => bookingService.getBookings(search)
  });

  const updateFinancialsMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      bookingService.updateFinancials(id, updates, user?.username || 'Unknown', role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      showToast.success('Financial ledger updated and verified.');
      setIsEditModalOpen(false);
    },
    onError: (err: any) => {
      showToast.error(err.message || 'Access Denied: Only Finance can perform edits.');
    }
  });

  const handleOpenEdit = (booking: Booking) => {
    setSelectedBooking(booking);
    setDepositReceivedInput(booking.depositReceived);
    setRefundedAmountInput(booking.refundedAmount || 0);
    setBillingAmountInput(booking.billingAmount);
    setIsEditModalOpen(true);
  };

  const handleSaveFinancials = () => {
    if (!selectedBooking) return;
    updateFinancialsMutation.mutate({
      id: selectedBooking.id,
      updates: {
        depositReceived: depositReceivedInput,
        refundedAmount: refundedAmountInput,
        billingAmount: billingAmountInput
      }
    });
  };

  const simulateExport = (format: 'CSV' | 'Excel') => {
    showToast.success(`Compiling financial ledger reports...`);
    setTimeout(() => {
      showToast.success(`Successfully downloaded Banquet_Finance_Report.${format === 'CSV' ? 'csv' : 'xlsx'}`);
    }, 1000);
  };

  if (isLoading) {
    return <SkeletonLoader type="table" />;
  }

  const bookings = bookingsRes?.data || [];

  // Filter local copy
  const filteredBookings = bookings.filter(b => {
    if (paymentStatusFilter === 'All') return true;
    return b.paymentStatus === paymentStatusFilter;
  });

  // Calculate metrics
  const grossRevenue = bookings.reduce((sum, b) => sum + b.billingAmount, 0);
  const depositsReceived = bookings.reduce((sum, b) => sum + b.depositReceived, 0);
  const outstandingPayments = bookings.reduce((sum, b) => sum + b.balanceDue, 0);
  const overduePayments = bookings.filter(b => b.overdue).reduce((sum, b) => sum + b.balanceDue, 0);
  const totalRefunds = bookings.reduce((sum, b) => sum + (b.refundedAmount || 0), 0);
  
  // Profit Margin estimation (culinary/ops cost averages 42%)
  const profitMarginPercent = grossRevenue > 0 
    ? Math.round(((grossRevenue - (grossRevenue * 0.42)) / grossRevenue) * 100) 
    : 58;

  const isFinanceUser = role === 'Finance';

  const columns = [
    {
      title: 'Client Event',
      dataIndex: 'clientName',
      key: 'clientName',
      render: (text: string, record: Booking) => (
        <div>
          <strong style={{ color: '#1e293b' }}>{text}</strong>
          <div style={{ fontSize: '11px', color: '#64748b' }}>{record.eventType} • {record.venueName}</div>
        </div>
      )
    },
    {
      title: 'Total Bill (₹)',
      dataIndex: 'billingAmount',
      key: 'billingAmount',
      render: (val: number) => <span style={{ fontWeight: 600 }}>₹{val.toLocaleString()}</span>
    },
    {
      title: 'Deposit Received',
      dataIndex: 'depositReceived',
      key: 'depositReceived',
      render: (val: number) => <span style={{ color: '#16a34a', fontWeight: 600 }}>₹{val.toLocaleString()}</span>
    },
    {
      title: 'Balance Due',
      dataIndex: 'balanceDue',
      key: 'balanceDue',
      render: (val: number) => <span style={{ color: val > 0 ? '#ea580c' : '#64748b', fontWeight: 600 }}>₹{val.toLocaleString()}</span>
    },
    {
      title: 'Refunds Logged',
      dataIndex: 'refundedAmount',
      key: 'refundedAmount',
      render: (val: number) => <span>{val > 0 ? `₹${val.toLocaleString()}` : '-'}</span>
    },
    {
      title: 'Ledger Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: Booking['paymentStatus']) => (
        <Tag color={status === 'Fully Paid' ? 'green' : status === 'Deposit Paid' ? 'blue' : status === 'Overdue' ? 'red' : 'orange'}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Booking) => (
        <Button 
          type="link" 
          size="small" 
          icon={<Edit size={12} />}
          onClick={() => handleOpenEdit(record)}
          style={{ color: '#9e2a2b', fontWeight: 600, padding: 0 }}
        >
          {isFinanceUser ? 'Record Transaction' : 'View Ledger'}
        </Button>
      )
    }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Finance Gateways
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: '4px 0 0 0' }}>
            Financial Oversight Dashboard
          </h1>
        </div>

        <Space>
          <Button 
            icon={<Download size={16} />} 
            onClick={() => simulateExport('CSV')}
            style={{ borderRadius: '8px' }}
          >
            Export CSV
          </Button>
          <Button 
            type="primary"
            icon={<FileSpreadsheet size={16} />} 
            onClick={() => simulateExport('Excel')}
            style={{ backgroundColor: '#1e293b', borderColor: '#1e293b', borderRadius: '8px' }}
          >
            Export Excel
          </Button>
        </Space>
      </div>

      {/* Financial Overview Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Gross Revenue */}
        <Col xs={24} sm={12} lg={4}>
          <Card style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <Statistic 
              title={<span style={{ color: '#64748b', fontSize: '13px' }}>Gross Contracted</span>}
              value={grossRevenue}
              prefix="₹"
              valueStyle={{ fontWeight: 800, color: '#1e293b', fontSize: '20px' }}
            />
          </Card>
        </Col>

        {/* Deposits Received */}
        <Col xs={24} sm={12} lg={4}>
          <Card style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <Statistic 
              title={<span style={{ color: '#64748b', fontSize: '13px' }}>Total Cash In</span>}
              value={depositsReceived}
              prefix="₹"
              valueStyle={{ fontWeight: 800, color: '#16a34a', fontSize: '20px' }}
            />
          </Card>
        </Col>

        {/* Outstanding Payments */}
        <Col xs={24} sm={12} lg={4}>
          <Card style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <Statistic 
              title={<span style={{ color: '#64748b', fontSize: '13px' }}>Outstanding Balance</span>}
              value={outstandingPayments}
              prefix="₹"
              valueStyle={{ fontWeight: 800, color: '#ea580c', fontSize: '20px' }}
            />
          </Card>
        </Col>

        {/* Overdue Payments */}
        <Col xs={24} sm={12} lg={4}>
          <Card style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <Statistic 
              title={<span style={{ color: '#64748b', fontSize: '13px' }}>Overdue Deposits</span>}
              value={overduePayments}
              prefix="₹"
              valueStyle={{ fontWeight: 800, color: '#ef4444', fontSize: '20px' }}
            />
          </Card>
        </Col>

        {/* Refunds */}
        <Col xs={24} sm={12} lg={4}>
          <Card style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <Statistic 
              title={<span style={{ color: '#64748b', fontSize: '13px' }}>Refunded Assets</span>}
              value={totalRefunds}
              prefix="₹"
              valueStyle={{ fontWeight: 800, color: '#64748b', fontSize: '20px' }}
            />
          </Card>
        </Col>

        {/* Profit Margin */}
        <Col xs={24} sm={12} lg={4}>
          <Card style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Profit Margin</span>
              <Tag color="green">{profitMarginPercent}%</Tag>
            </div>
            <Progress percent={profitMarginPercent} size="small" showInfo={false} strokeColor="#22c55e" style={{ marginTop: '16px' }} />
          </Card>
        </Col>
      </Row>

      {/* Filters Card */}
      <Card style={{ borderRadius: '12px', marginBottom: '24px', border: '1px solid #eef0f2' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input.Search
              placeholder="Search by client or event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ borderRadius: '8px' }}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select 
              value={paymentStatusFilter} 
              onChange={setPaymentStatusFilter} 
              style={{ width: '100%' }}
              options={[
                { value: 'All', label: 'All Payment States' },
                { value: 'Fully Paid', label: 'Fully Paid Only' },
                { value: 'Deposit Paid', label: 'Deposit Paid Only' },
                { value: 'Overdue', label: 'Overdue Only' },
                { value: 'Unpaid', label: 'Unpaid Hold' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* Ledger Table */}
      <Card style={{ borderRadius: '16px', border: '1px solid #eef0f2' }}>
        <Table 
          dataSource={filteredBookings} 
          columns={columns} 
          rowKey="id" 
          pagination={{ pageSize: 8 }}
          style={{ borderRadius: '8px', overflow: 'hidden' }}
        />
      </Card>

      {/* Record Transaction Modal (RBAC Guarded in logic) */}
      {selectedBooking && (
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} color="#a8201a" />
              <span>{isFinanceUser ? 'Record Financial Transaction' : 'Banquet Billing Audit'}</span>
            </div>
          }
          open={isEditModalOpen}
          onCancel={() => setIsEditModalOpen(false)}
          footer={null}
          width={450}
        >
          <div style={{ marginTop: '20px' }}>
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <strong>Client:</strong> {selectedBooking.clientName}
              <br />
              <strong>Room Assign:</strong> {selectedBooking.venueName}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">Total Contract billing (₹)</label>
              <Input 
                type="number"
                value={billingAmountInput}
                onChange={(e) => setBillingAmountInput(parseInt(e.target.value) || 0)}
                disabled={!isFinanceUser}
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">Payments Received (₹)</label>
              <Input 
                type="number"
                value={depositReceivedInput}
                onChange={(e) => setDepositReceivedInput(parseInt(e.target.value) || 0)}
                disabled={!isFinanceUser}
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label className="form-label">Refunds Logged (₹)</label>
              <Input 
                type="number"
                value={refundedAmountInput}
                onChange={(e) => setRefundedAmountInput(parseInt(e.target.value) || 0)}
                disabled={!isFinanceUser}
                style={{ borderRadius: '8px' }}
              />
            </div>

            {!isFinanceUser && (
              <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#ffeef0', color: '#b45309', borderLeft: '4px solid #d97706', borderRadius: '4px', fontSize: '12px' }}>
                Access Denied: Only users switched to the <strong>Finance</strong> preview role can write entries to the financial ledger.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button onClick={() => setIsEditModalOpen(false)}>Close</Button>
              {isFinanceUser && (
                <Button 
                  type="primary"
                  onClick={handleSaveFinancials}
                  loading={updateFinancialsMutation.isPending}
                  style={{ backgroundColor: '#9e2a2b', borderColor: '#9e2a2b', fontWeight: 600 }}
                >
                  Verify Transaction
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
