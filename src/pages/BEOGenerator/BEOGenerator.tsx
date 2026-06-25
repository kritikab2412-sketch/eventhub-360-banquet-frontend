import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { beoService, bookingService, auditService } from '../../services/api';
import type { BEO, TimelineSlot, BEOVersion } from '../../types/banquet';
import { SkeletonLoader } from '../../components/Common/SkeletonLoader';
import { showToast } from '../../components/Feedback/ToastAlerts';
import { useAuth } from '../../context/AuthContext';
import { Card, Row, Col, Input, Button, Tag, Checkbox, Divider, Modal, Table, Space, List } from 'antd';
import { Save, Send, Plus, Trash2, Printer, Link2, Info, Copy, History, AlertCircle, FileCode } from 'lucide-react';
import dayjs from 'dayjs';

export const BEOGenerator: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, role, hasPermission } = useAuth();
  
  // Active BEO State
  const [beoData, setBeoData] = useState<BEO | null>(null);
  const [newTimeline, setNewTimeline] = useState({ start: '', end: '', activity: '' });
  
  // Modals state for versions
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareSource, setCompareSource] = useState<BEOVersion | null>(null);

  // Get active booking (defaulting to Arts Foundation or first confirmed booking)
  const { data: bookingsRes } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingService.getBookings()
  });

  const bookings = bookingsRes?.data || [];
  const selectedBooking = bookings.find((b: any) => b.clientName.includes('Arts') || b.status === 'Confirmed') || bookings[0];

  const { data: beoRes, isLoading } = useQuery({
    queryKey: ['beo', selectedBooking?.id],
    queryFn: () => beoService.getBEOByBookingId(selectedBooking?.id),
    enabled: !!selectedBooking?.id
  });

  useEffect(() => {
    if (beoRes?.data) {
      setBeoData(beoRes.data);
    }
  }, [beoRes]);

  // Auto Save background timer ref
  const autoSaveTimerRef = useRef<any>(null);

  // Setup background auto-save loop
  useEffect(() => {
    if (!beoData) return;
    
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer to auto-save after 10 seconds of inactivity
    autoSaveTimerRef.current = setTimeout(() => {
      beoService.autoSaveBEO(beoData, user?.username || 'Unknown');
      console.log('BEO Auto saved in background.');
    }, 10000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [beoData, user]);

  const saveMutation = useMutation({
    mutationFn: (updated: BEO) => beoService.saveBEO(updated, user?.username || 'Unknown', 'Updated custom guidelines'),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['beo', selectedBooking?.id] });
      showToast.success('BEO details saved successfully.');
      if (res.data) {
        setBeoData(res.data);
      }
    }
  });

  const cloneMutation = useMutation({
    mutationFn: (beoId: string) => beoService.cloneBEO(beoId, user?.username || 'Unknown'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beo', selectedBooking?.id] });
      showToast.success('BEO version cloned successfully!');
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BEO['status'] }) => 
      beoService.updateBEOStatus(id, status, user?.username || 'Unknown'),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['beo', selectedBooking?.id] });
      showToast.success(`BEO Status updated to ${variables.status}`);
      if (beoData) {
        setBeoData({ ...beoData, status: variables.status });
      }
    }
  });

  // Dynamic calculations
  const calculateTotal = (data: BEO): number => {
    const guestCount = data.clientProfile.guestCount || 0;
    const foodCost = guestCount * 85; // $85 per pax package rate
    const chairCost = (data.decorAndSetup.chairUnits || 0) * 4.5;
    const runnerCost = (data.decorAndSetup.runnerUnits || 0) * 12;
    const avCost = (data.avRequirements.projector ? 450 : 0) + (data.avRequirements.wirelessMicUnits * 75);
    return foodCost + chairCost + runnerCost + avCost;
  };

  const handleUpdateField = (section: string, field: string, value: any) => {
    if (!beoData) return;
    
    let updated: BEO;
    if (section === 'clientProfile') {
      updated = {
        ...beoData,
        clientProfile: { ...beoData.clientProfile, [field]: value }
      };
    } else if (section === 'foodAndBeverage') {
      updated = {
        ...beoData,
        foodAndBeverage: { ...beoData.foodAndBeverage, [field]: value }
      };
    } else if (section === 'decorAndSetup') {
      updated = {
        ...beoData,
        decorAndSetup: { ...beoData.decorAndSetup, [field]: value }
      };
    } else if (section === 'avRequirements') {
      updated = {
        ...beoData,
        avRequirements: { ...beoData.avRequirements, [field]: value }
      };
    } else {
      updated = { ...beoData, [field]: value };
    }

    updated.estimatedTotal = calculateTotal(updated);
    setBeoData(updated);
  };

  const handleAddTimelineSlot = () => {
    if (!beoData || !newTimeline.start || !newTimeline.activity) {
      showToast.warning('Fill start time and activity before adding.');
      return;
    }
    
    const newSlot: TimelineSlot = {
      id: `slot-${Date.now()}`,
      start: newTimeline.start,
      end: newTimeline.end || 'TBD',
      activity: newTimeline.activity
    };

    const updated = {
      ...beoData,
      timeline: [...beoData.timeline, newSlot]
    };
    
    setBeoData(updated);
    setNewTimeline({ start: '', end: '', activity: '' });
    showToast.success('Schedule slot added.');
  };

  const handleRemoveTimelineSlot = (slotId: string) => {
    if (!beoData) return;
    const updated = {
      ...beoData,
      timeline: beoData.timeline.filter(t => t.id !== slotId)
    };
    setBeoData(updated);
    showToast.info('Timeline slot removed.');
  };

  const handleSaveDraft = () => {
    if (beoData) {
      saveMutation.mutate(beoData);
    }
  };

  const handleCloneBEO = () => {
    if (beoData) {
      cloneMutation.mutate(beoData.id);
    }
  };

  const handleRestoreVersion = (ver: BEOVersion) => {
    try {
      const restoredState = JSON.parse(ver.data);
      setBeoData(restoredState);
      saveMutation.mutate(restoredState);
      setIsVersionModalOpen(false);
      showToast.success(`Restored BEO state to version ${ver.version}`);
    } catch (e) {
      showToast.error('Failed to parse version ledger state.');
    }
  };

  const handleCompareOpen = (ver: BEOVersion) => {
    setCompareSource(ver);
    setIsCompareModalOpen(true);
  };

  const handleSendForApproval = () => {
    if (!hasPermission('manage_beo')) {
      showToast.error('Your role does not have authorization to publish BEO guidelines.');
      return;
    }
    if (beoData) {
      statusMutation.mutate({ id: beoData.id, status: 'Pending Approval' });
    }
  };

  const handleGeneratePDF = () => {
    showToast.success('PDF document compiled! Triggering print spooler...');
    window.print();
  };

  if (isLoading || !beoData) {
    return <SkeletonLoader type="detail" />;
  }

  const isEditable = beoData.status === 'Draft' && hasPermission('manage_beo');

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            BEO Generator
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: '4px 0 0 0' }}>
            BEO #{beoData.id.slice(4, 9).toUpperCase()}-{beoData.version}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button 
            icon={<History size={16} />} 
            onClick={() => setIsVersionModalOpen(true)}
          >
            History Logs
          </Button>
          <Button 
            icon={<Copy size={16} />} 
            onClick={handleCloneBEO}
            loading={cloneMutation.isPending}
          >
            Clone BEO
          </Button>
          <Button 
            icon={<Save size={16} />} 
            onClick={handleSaveDraft}
            disabled={!isEditable}
          >
            Save Draft
          </Button>
          <Button 
            type="primary" 
            icon={<Send size={16} />} 
            onClick={handleSendForApproval}
            disabled={beoData.status !== 'Draft'}
            style={{ backgroundColor: '#9e2a2b', borderColor: '#9e2a2b', fontWeight: 600 }}
          >
            Send for Approval
          </Button>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Side: Builder Forms */}
        <Col xs={24} lg={15}>
          {/* Section 1: Client & Event Profile */}
          <Card 
            title={<span style={{ fontWeight: 600 }}>Client & Event Profile</span>}
            style={{ borderRadius: '16px', marginBottom: '20px' }}
            extra={<Tag color={beoData.status === 'Approved' ? 'green' : 'orange'}>{beoData.status}</Tag>}
          >
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label">Client Name</label>
                  <Input 
                    value={beoData.clientProfile.clientName} 
                    onChange={(e) => handleUpdateField('clientProfile', 'clientName', e.target.value)}
                    disabled={!isEditable}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label">Event Type</label>
                  <Input 
                    value={beoData.clientProfile.eventType} 
                    onChange={(e) => handleUpdateField('clientProfile', 'eventType', e.target.value)}
                    disabled={!isEditable}
                  />
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label">Guest Count (GTD)</label>
                  <Input 
                    type="number"
                    value={beoData.clientProfile.guestCount} 
                    onChange={(e) => handleUpdateField('clientProfile', 'guestCount', parseInt(e.target.value) || 0)}
                    disabled={!isEditable}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label">Venue Room</label>
                  <Input 
                    value={beoData.clientProfile.venueName} 
                    disabled
                  />
                </div>
              </Col>
            </Row>
          </Card>

          {/* Section 2: Function Timeline */}
          <Card 
            title={<span style={{ fontWeight: 600 }}>Function Timeline</span>}
            style={{ borderRadius: '16px', marginBottom: '20px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {beoData.timeline.map((slot) => (
                <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                    <strong style={{ color: '#a8201a', width: '90px' }}>{slot.start} - {slot.end}</strong>
                    <span style={{ color: '#1e293b' }}>{slot.activity}</span>
                  </div>
                  {isEditable && (
                    <Button 
                      type="text" 
                      danger 
                      icon={<Trash2 size={14} />} 
                      onClick={() => handleRemoveTimelineSlot(slot.id)}
                    />
                  )}
                </div>
              ))}

              {isEditable && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', borderTop: '1px dashed #e2e8f0', paddingTop: '16px' }}>
                  <Input 
                    placeholder="18:00" 
                    value={newTimeline.start} 
                    onChange={(e) => setNewTimeline({ ...newTimeline, start: e.target.value })}
                    style={{ width: '90px' }}
                  />
                  <Input 
                    placeholder="19:30" 
                    value={newTimeline.end} 
                    onChange={(e) => setNewTimeline({ ...newTimeline, end: e.target.value })}
                    style={{ width: '90px' }}
                  />
                  <Input 
                    placeholder="Activity detail (e.g. Cocktail Hour)" 
                    value={newTimeline.activity} 
                    onChange={(e) => setNewTimeline({ ...newTimeline, activity: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <Button 
                    type="dashed" 
                    icon={<Plus size={14} />} 
                    onClick={handleAddTimelineSlot}
                    style={{ color: '#a8201a', borderColor: '#a8201a' }}
                  >
                    Add Slot
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Section 3: F&B Selection */}
          <Card 
            title={<span style={{ fontWeight: 600 }}>Food & Beverage Selection</span>}
            style={{ borderRadius: '16px', marginBottom: '20px' }}
          >
            <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px', borderLeft: '4px solid #d97706', color: '#b45309', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
              <Info size={16} />
              <span>Selected Package: <strong>Platinum Signature Dining</strong>. Includes free-flow wine and artisan coffee bar.</span>
            </div>

            <Row gutter={24}>
              <Col span={12}>
                <h4 style={{ fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>Hors D'oeuvres</h4>
                <Checkbox.Group
                  value={beoData.foodAndBeverage.horsDoeuvres}
                  onChange={(checked) => handleUpdateField('foodAndBeverage', 'horsDoeuvres', checked)}
                  disabled={!isEditable}
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <Checkbox value="Truffle Arancini with Saffron Aioli">Truffle Arancini with Saffron Aioli</Checkbox>
                  <Checkbox value="Smoked Salmon Blinis with Caviar">Smoked Salmon Blinis with Caviar</Checkbox>
                  <Checkbox value="Glazed Pork Belly Pops">Glazed Pork Belly Pops</Checkbox>
                </Checkbox.Group>
              </Col>
              
              <Col span={12}>
                <h4 style={{ fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>Main Entrées</h4>
                <Checkbox.Group
                  value={beoData.foodAndBeverage.mainEntrees}
                  onChange={(checked) => handleUpdateField('foodAndBeverage', 'mainEntrees', checked)}
                  disabled={!isEditable}
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <Checkbox value="Slow-Roasted Wagyu Beef Short Rib">Slow-Roasted Wagyu Beef Short Rib</Checkbox>
                  <Checkbox value="Pan-Seared Sea Bass with Asparagus">Pan-Seared Sea Bass with Asparagus</Checkbox>
                  <Checkbox value="Wild Mushroom Risotto">Wild Mushroom Risotto</Checkbox>
                </Checkbox.Group>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Right Side: Live BEO Preview Page Sheet */}
        <Col xs={24} lg={9}>
          <div className="beo-preview-sticky">
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Preview</span>
                  <Tag color="cyan">BEO #{beoData.id.slice(4, 9).toUpperCase()}</Tag>
                </div>
              }
              style={{ borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            >
              {/* Printable BEO Paper Frame */}
              <div className="printable-beo-sheet">
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>EVENTHUB360</h3>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Official Banquet Event Order</span>
                  <div style={{ borderBottom: '2px solid #a8201a', width: '60px', margin: '8px auto 0 auto' }}></div>
                </div>

                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginBottom: '16px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 0', color: '#64748b' }}>Post As:</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>{beoData.clientProfile.eventType}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 0', color: '#64748b' }}>Expected Guest:</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>{beoData.clientProfile.guestCount} pax</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 0', color: '#64748b' }}>Venue:</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>{beoData.clientProfile.venueName}</td>
                    </tr>
                  </tbody>
                </table>

                <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px' }}>Event Schedule</h4>
                <div style={{ fontSize: '11px', marginBottom: '16px' }}>
                  {beoData.timeline.map((slot) => (
                    <div key={slot.id} style={{ display: 'flex', marginBottom: '6px' }}>
                      <span style={{ width: '80px', fontWeight: 600, color: '#a8201a' }}>{slot.start} - {slot.end}</span>
                      <span style={{ flex: 1 }}>{slot.activity}</span>
                    </div>
                  ))}
                </div>

                <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px' }}>Menu Summary</h4>
                <ul style={{ fontSize: '11px', margin: 0, paddingLeft: '16px', marginBottom: '16px', color: '#1e293b' }}>
                  {[...beoData.foodAndBeverage.horsDoeuvres, ...beoData.foodAndBeverage.mainEntrees].map((food, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{food}</li>
                  ))}
                </ul>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Estimated Total</span>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#a8201a', margin: '4px 0' }}>
                    ${beoData.estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Excludes service charges & taxes</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Button 
                  type="primary" 
                  icon={<Printer size={16} />}
                  onClick={handleGeneratePDF}
                  style={{ backgroundColor: '#1e293b', borderColor: '#1e293b', height: '40px', borderRadius: '8px', fontWeight: 600 }}
                >
                  Generate PDF
                </Button>
              </div>
            </Card>
          </div>
        </Col>
      </Row>

      {/* Version History Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a8201a' }}>
            <History size={20} />
            <span>BEO Version History Ledger</span>
          </div>
        }
        open={isVersionModalOpen}
        onCancel={() => setIsVersionModalOpen(false)}
        footer={null}
        width={550}
      >
        <div style={{ marginTop: '16px' }}>
          <List
            dataSource={beoData.versions || []}
            renderItem={(ver: any) => (
              <div 
                key={ver.version} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  marginBottom: '10px',
                  background: ver.version === beoData.version ? '#f0fdf4' : '#fff'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '14px', color: '#1e293b' }}>{ver.version}</strong>
                    {ver.version === beoData.version && <Tag color="green">ACTIVE</Tag>}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Modified by {ver.actor} on {dayjs(ver.timestamp).format('MMM DD, HH:mm')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#1e293b', marginTop: '6px', fontStyle: 'italic' }}>
                    "{ver.notes}"
                  </div>
                </div>

                <Space>
                  <Button 
                    size="small" 
                    onClick={() => handleCompareOpen(ver)}
                    disabled={ver.version === beoData.version}
                  >
                    Compare
                  </Button>
                  <Button 
                    size="small" 
                    type="primary"
                    onClick={() => handleRestoreVersion(ver)}
                    disabled={ver.version === beoData.version}
                    style={{ backgroundColor: '#9e2a2b', borderColor: '#9e2a2b' }}
                  >
                    Restore
                  </Button>
                </Space>
              </div>
            )}
          />
        </div>
      </Modal>

      {/* Compare Version Modal */}
      {compareSource && (
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode size={20} color="#a8201a" />
              <span>Comparing BEO state: {compareSource.version} vs Current ({beoData.version})</span>
            </div>
          }
          open={isCompareModalOpen}
          onCancel={() => setIsCompareModalOpen(false)}
          footer={null}
          width={650}
        >
          <div style={{ marginTop: '20px' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Card title={<Tag color="default">Version {compareSource.version}</Tag>} bodyStyle={{ padding: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                  <pre style={{ fontSize: '11px' }}>
                    {JSON.stringify(JSON.parse(compareSource.data), null, 2)}
                  </pre>
                </Card>
              </Col>
              <Col span={12}>
                <Card title={<Tag color="green">Current ({beoData.version})</Tag>} bodyStyle={{ padding: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                  <pre style={{ fontSize: '11px' }}>
                    {JSON.stringify(beoData, null, 2)}
                  </pre>
                </Card>
              </Col>
            </Row>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button onClick={() => setIsCompareModalOpen(false)}>Close Comparison</Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
