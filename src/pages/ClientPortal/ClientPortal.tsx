import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService, beoService, documentService } from '../../services/api';
import { Booking, BEO, VaultDocument } from '../../types/banquet';
import { SkeletonLoader } from '../../components/Common/SkeletonLoader';
import { showToast } from '../../components/Feedback/ToastAlerts';
import { useAuth } from '../../context/AuthContext';
import { Card, Row, Col, Progress, List, Tag, Button, Input, Upload, Divider, Space, Checkbox, Select } from 'antd';
import { 
  FileText, 
  Signature, 
  UploadCloud, 
  Download, 
  CheckCircle, 
  CreditCard, 
  Eye,
  Info,
  Calendar,
  Layers
} from 'lucide-react';
import dayjs from 'dayjs';

export const ClientPortal: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Select active client booking to view
  const [selectedBookingId, setSelectedBookingId] = useState<string>('booking-1');
  const [beoApprovalComments, setBeoApprovalComments] = useState('');
  
  // Queries
  const { data: bookingsRes, isLoading: loadingBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingService.getBookings()
  });

  const { data: docsRes, isLoading: loadingDocs } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentService.getDocuments()
  });

  const bookings = bookingsRes?.data || [];
  const documents = docsRes?.data || [];
  
  // Filter only valid client events
  const clientBookings = bookings.filter(b => b.status !== 'Blocked');
  const activeBooking = clientBookings.find(b => b.id === selectedBookingId) || clientBookings[0];

  const { data: beoRes, isLoading: loadingBEO } = useQuery({
    queryKey: ['beo', activeBooking?.id],
    queryFn: () => beoService.getBEOByBookingId(activeBooking?.id),
    enabled: !!activeBooking?.id
  });

  const clientBEO = beoRes?.data;

  // Mutations
  const approveBEOMutation = useMutation({
    mutationFn: (beoId: string) => beoService.updateBEOStatus(beoId, 'Approved', 'Client Portal'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beo', activeBooking?.id] });
      // Also update booking status to BEO Approved
      bookingService.updateBookingStatus(activeBooking.id, 'BEO Approved', 'Client Portal', 'Client signed BEO approvals: ' + beoApprovalComments);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      showToast.success('You have approved the Banquet Event Order guidelines.');
      setBeoApprovalComments('');
    }
  });

  const uploadDocMutation = useMutation({
    mutationFn: (newDoc: any) => documentService.getDocuments(), // mock action
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      showToast.success('File uploaded and queued for staff verification.');
    }
  });

  const handleClientApproveBEO = () => {
    if (!clientBEO) return;
    approveBEOMutation.mutate(clientBEO.id);
  };

  const handleMockUpload = (fileName: string) => {
    showToast.success(`Uploading ${fileName}...`);
    setTimeout(() => {
      uploadDocMutation.mutate({});
    }, 1000);
  };

  if (loadingBookings || loadingDocs || loadingBEO) {
    return <SkeletonLoader type="detail" />;
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            External Hub
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: '4px 0 0 0' }}>
            Client Portal Sandbox
          </h1>
        </div>

        <div>
          <span style={{ fontSize: '13px', color: '#64748b', marginRight: '10px' }}>Viewing Event:</span>
          <Select 
            value={selectedBookingId}
            onChange={setSelectedBookingId}
            style={{ width: 220 }}
            options={clientBookings.map(b => ({ value: b.id, label: `${b.clientName} (${b.eventType})` }))}
          />
        </div>
      </div>

      <div style={{ padding: '12px', background: '#ffe5e5', borderRadius: '8px', borderLeft: '4px solid #a8201a', color: '#9e2a2b', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
        <Info size={16} />
        <span>This client view renders what couples or corporate organizers see in their portal link.</span>
      </div>

      {activeBooking && (
        <Row gutter={[24, 24]}>
          
          {/* Left Side: Event Details, Financial State, uploaders */}
          <Col xs={24} lg={15}>
            
            {/* Event Timeline Lifecycle */}
            <Card title={<span style={{ fontWeight: 700 }}>Your Event Lifecycle progress</span>} style={{ borderRadius: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', padding: '10px 0' }}>
                <div style={{ position: 'absolute', top: '24px', left: '20px', right: '20px', height: '4px', background: '#e2e8f0', zIndex: 1 }}></div>
                
                {['Inquiry', 'Tentative', 'Confirmed', 'BEO Approved', 'Archived'].map((step, idx) => {
                  const currentIdx = ['Inquiry', 'Tentative', 'Confirmed', 'BEO Approved', 'Archived'].indexOf(
                    activeBooking.status === 'BEO Draft' ? 'Confirmed' : activeBooking.status
                  );
                  const isCompleted = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, width: '18%' }}>
                      <div 
                        style={{ 
                          width: '18px', 
                          height: '18px', 
                          borderRadius: '50%', 
                          background: isCompleted ? '#22c55e' : '#cbd5e1',
                          border: isCurrent ? '4px solid #ffe5e5' : '3px solid #fff',
                          marginBottom: '8px'
                        }}
                      ></div>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: isCompleted ? '#1e293b' : '#64748b' }}>{step}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* BEO Review Form & approval action */}
            {clientBEO ? (
              <Card 
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontWeight: 700 }}>BEO Guideline Specification</span>
                    <Tag color={clientBEO.status === 'Approved' ? 'green' : 'orange'}>
                      {clientBEO.status.toUpperCase()}
                    </Tag>
                  </div>
                } 
                style={{ borderRadius: '16px', marginBottom: '24px' }}
              >
                <div style={{ maxHeight: '250px', overflowY: 'auto', background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px' }}>
                  <h4 style={{ color: '#a8201a', margin: '0 0 10px 0' }}> Platinum Menu & Catering Setup</h4>
                  <ul>
                    {clientBEO.foodAndBeverage.horsDoeuvres.map((f, i) => <li key={i}>{f}</li>)}
                    {clientBEO.foodAndBeverage.mainEntrees.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                  
                  <Divider style={{ margin: '12px 0' }} />
                  <h4 style={{ color: '#a8201a', margin: '0 0 10px 0' }}> AV & Table styling</h4>
                  <p><strong>Gold Chiavari Chairs:</strong> {clientBEO.decorAndSetup.chairUnits} units</p>
                  <p><strong>Table Runners:</strong> {clientBEO.decorAndSetup.tableRunners}</p>
                  <p><strong>AV Laser Projector:</strong> {clientBEO.avRequirements.projector ? 'Yes (4K)' : 'No'}</p>
                </div>

                {clientBEO.status !== 'Approved' ? (
                  <div>
                    <h5 style={{ fontWeight: 600, marginBottom: '8px' }}>Approve Layout and F&B specifications</h5>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Input 
                        placeholder="Add review feedback notes (e.g. Looks great, send invoice!)" 
                        value={beoApprovalComments}
                        onChange={e => setBeoApprovalComments(e.target.value)}
                        style={{ borderRadius: '8px' }}
                      />
                      <Button 
                        type="primary" 
                        icon={<Signature size={16} />}
                        onClick={handleClientApproveBEO}
                        loading={approveBEOMutation.isPending}
                        style={{ backgroundColor: '#9e2a2b', borderColor: '#9e2a2b', borderRadius: '8px' }}
                      >
                        Approve & Sign BEO
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', color: '#16a34a', fontWeight: 600, alignItems: 'center' }}>
                    <CheckCircle size={16} />
                    <span>You signed and authorized this BEO plan on {dayjs(clientBEO.updatedAt).format('MMM DD, YYYY')}.</span>
                  </div>
                )}
              </Card>
            ) : (
              <Card style={{ borderRadius: '16px', marginBottom: '24px' }}>
                <span style={{ color: '#64748b' }}>No BEO setup configured for this event yet.</span>
              </Card>
            )}

            {/* Document center files and uploader */}
            <Card title={<span style={{ fontWeight: 700 }}>Event Proposals & Contract Vault</span>} style={{ borderRadius: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {documents.map((doc) => (
                  <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={16} color="#9e2a2b" />
                      <div>
                        <strong style={{ fontSize: '13px' }}>{doc.name}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Format: {doc.format} • Status: {doc.status}</div>
                      </div>
                    </div>
                    <Button 
                      type="text" 
                      icon={<Download size={14} />} 
                      onClick={() => showToast.success(`Downloading ${doc.name}...`)}
                      style={{ color: '#9e2a2b' }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ border: '2px dashed #cbd5e1', padding: '24px', borderRadius: '12px', textAlign: 'center', background: '#f8fafc' }}>
                <UploadCloud size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ margin: '0 0 4px 0', fontWeight: 600 }}>Need to submit event documents?</h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>Upload guest meal allergy charts or special insurance policies</p>
                
                <input 
                  type="file" 
                  id="client-file-upload" 
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && handleMockUpload(e.target.files[0].name)}
                />
                <Button 
                  onClick={() => document.getElementById('client-file-upload')?.click()}
                  style={{ borderRadius: '8px' }}
                >
                  Upload File
                </Button>
              </div>
            </Card>

          </Col>

          {/* Right Side: Financial balance and contracts review checklists */}
          <Col xs={24} lg={9}>
            {/* Financial Status Summary */}
            <Card title={<span style={{ fontWeight: 700 }}>Invoices & Financial Summary</span>} style={{ borderRadius: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Total Contract Value:</span>
                  <span style={{ fontWeight: 700 }}>₹{activeBooking.billingAmount.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                  <span>Payments Credited:</span>
                  <span style={{ fontWeight: 700 }}>-₹{activeBooking.depositReceived.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ea580c' }}>
                  <span>Balance Outstanding:</span>
                  <span style={{ fontWeight: 800 }}>₹{activeBooking.balanceDue.toLocaleString()}</span>
                </div>

                <Divider style={{ margin: '8px 0' }} />
                <Progress 
                  percent={Math.round((activeBooking.depositReceived / activeBooking.billingAmount) * 100)} 
                  strokeColor="#16a34a"
                  format={p => `${p}% Settled`}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <CreditCard size={20} color="#9e2a2b" style={{ flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Payment Method On File:</span>
                    <strong>Stripe Inflow Account ending •••• 9841</strong>
                  </div>
                </div>
              </div>
            </Card>

            {/* Event checklist */}
            <Card title={<span style={{ fontWeight: 700 }}>Event Checklist Tracker</span>} style={{ borderRadius: '16px' }}>
              <List
                dataSource={[
                  { text: 'Reserve room dates hold', checked: true },
                  { text: 'Verify 50% deposit received', checked: activeBooking.depositReceived > 0 },
                  { text: 'BEO specifications signed off', checked: clientBEO?.status === 'Approved' },
                  { text: 'Submit complete Guest list RSVPs', checked: false },
                  { text: 'Coordinate beverage packages selection', checked: true },
                ]}
                renderItem={item => (
                  <List.Item style={{ border: 0, padding: '8px 0' }}>
                    <Checkbox checked={item.checked} disabled style={{ color: '#1e293b' }}>
                      <span style={{ textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? '#94a3b8' : '#1e293b' }}>
                        {item.text}
                      </span>
                    </Checkbox>
                  </List.Item>
                )}
              />
            </Card>
          </Col>

        </Row>
      )}
    </div>
  );
};
