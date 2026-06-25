import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalService, beoService } from '../../services/api';
import { BEOApprovalStep } from '../../types/banquet';
import { SkeletonLoader } from '../../components/Common/SkeletonLoader';
import { showToast } from '../../components/Feedback/ToastAlerts';
import { useAuth } from '../../context/AuthContext';
import { Card, Row, Col, Button, Tag, Input, Radio, Timeline, List, Divider } from 'antd';
import { FileCheck, ShieldAlert, Sparkles, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';

export const ApprovalWorkflow: React.FC = () => {
  const queryClient = useQueryClient();
  const { role, user } = useAuth();
  
  // Form State
  const [decision, setDecision] = useState<'Approved' | 'Rejected'>('Approved');
  const [comments, setComments] = useState('');

  const { data: stepsRes, isLoading } = useQuery({
    queryKey: ['approval-steps'],
    queryFn: () => approvalService.getApprovalSteps()
  });

  const submitDecisionMutation = useMutation({
    mutationFn: ({ stepId, status, comments }: { stepId: string; status: 'Approved' | 'Rejected'; comments: string }) => 
      approvalService.submitDecision(stepId, status, comments, user?.username || 'Unknown'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-steps'] });
      showToast.success('Review decision submitted successfully!');
      setComments('');
    }
  });

  const steps = stepsRes?.data || [];

  // Find if current role has a pending approval step
  const activeStep = steps.find(s => s.role === role && s.status === 'Pending');

  const handleSubmitReview = () => {
    if (!activeStep) return;
    submitDecisionMutation.mutate({
      stepId: activeStep.id,
      status: decision,
      comments
    });
  };

  const getTimelineIcon = (status: BEOApprovalStep['status']) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle2 size={18} color="#22c55e" />;
      case 'Rejected':
        return <XCircle size={18} color="#ef4444" />;
      default:
        return <AlertCircle size={18} color="#94a3b8" />;
    }
  };

  if (isLoading) {
    return <SkeletonLoader type="detail" />;
  }

  // Check if BEO is fully approved (all steps are approved)
  const isFullyApproved = steps.every(s => s.status === 'Approved');

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Workflow Gateways
        </span>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: '4px 0 0 0' }}>
          BEO Approval Pipeline
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
          Track and review Banquet Event Orders across Sales, Banquet Ops, Kitchen, and Finance departments.
        </p>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Side: Document Overview Card */}
        <Col xs={24} lg={14}>
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>BEO Document Preview (Ref: BEO #8842-A)</span>
                <Tag color={isFullyApproved ? 'green' : 'orange'}>
                  {isFullyApproved ? 'FULLY APPROVED' : 'PENDING STAKEHOLDER SIGN-OFF'}
                </Tag>
              </div>
            }
            style={{ borderRadius: '16px', border: '1px solid #eef0f2', marginBottom: '24px' }}
          >
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', marginBottom: '20px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ marginBottom: '8px' }}><span style={{ color: '#64748b', fontSize: '12px' }}>Client:</span> <strong>Global Tech Solutions</strong></div>
                  <div style={{ marginBottom: '8px' }}><span style={{ color: '#64748b', fontSize: '12px' }}>Event Name:</span> <strong>Annual Corporate Gala</strong></div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: '8px' }}><span style={{ color: '#64748b', fontSize: '12px' }}>Venue Room:</span> <strong>Imperial Ballroom</strong></div>
                  <div style={{ marginBottom: '8px' }}><span style={{ color: '#64748b', fontSize: '12px' }}>Guest Count (GTD):</span> <strong>450 Pax</strong></div>
                </Col>
              </Row>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Estimated Bill (Total Pax):</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#a8201a' }}>$42,500.00</span>
              </div>
            </div>

            <h4 style={{ fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>Pre-Approval Checklists</h4>
            <List
              size="small"
              bordered={false}
              dataSource={[
                { text: 'Layout capacity checked and validated', status: true },
                { text: 'Egress fire clearances mapped', status: true },
                { text: 'Menu packaging unit cost reconciled', status: true },
                { text: 'Client deposit (50%) received and logged in stripe', status: true }
              ]}
              renderItem={item => (
                <List.Item style={{ border: 0, padding: '6px 0', fontSize: '13px' }}>
                  <span style={{ color: '#22c55e', marginRight: '8px', fontWeight: 'bold' }}>✓</span>
                  <span>{item.text}</span>
                </List.Item>
              )}
            />
          </Card>

          {/* Active Review Form (if pending for current role) */}
          {activeStep ? (
            <Card 
              title={<span style={{ color: '#a8201a', fontWeight: 700 }}>Action Required: BEO Sign-Off as {role}</span>}
              style={{ borderRadius: '16px', border: '1px solid #ffe3e3', backgroundColor: '#fff5f5' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label" style={{ marginBottom: '8px' }}>Your Decision</label>
                  <Radio.Group 
                    onChange={(e) => setDecision(e.target.value)} 
                    value={decision}
                    optionType="button"
                    buttonStyle="solid"
                  >
                    <Radio.Button value="Approved" style={{ width: '100px', textAlign: 'center' }}>Approve</Radio.Button>
                    <Radio.Button value="Rejected" style={{ width: '100px', textAlign: 'center' }}>Reject</Radio.Button>
                  </Radio.Group>
                </div>

                <div>
                  <label className="form-label">Review comments</label>
                  <Input.TextArea
                    rows={3}
                    placeholder="Provide detailed feedback or comments..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    style={{ borderRadius: '8px' }}
                  />
                </div>

                <Button
                  type="primary"
                  onClick={handleSubmitReview}
                  loading={submitDecisionMutation.isPending}
                  style={{ backgroundColor: '#9e2a2b', borderColor: '#9e2a2b', width: 'fit-content', borderRadius: '8px', height: '40px', fontWeight: 600 }}
                >
                  Submit Stakeholder Review
                </Button>
              </div>
            </Card>
          ) : (
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Sparkles size={20} color="#94a3b8" />
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                No active sign-off actions required for your current role context (<strong>{role}</strong>). Switch roles in the top header selector to test review gateway inputs.
              </span>
            </div>
          )}
        </Col>

        {/* Right Side: Stakeholder Approval Pipeline Timeline */}
        <Col xs={24} lg={10}>
          <Card 
            title={<span style={{ fontWeight: 600 }}>Stakeholder Signatures</span>}
            style={{ borderRadius: '16px', border: '1px solid #eef0f2' }}
          >
            <Timeline style={{ marginTop: '20px' }}>
              {steps.map(step => {
                const isApproved = step.status === 'Approved';
                const isPending = step.status === 'Pending';
                
                return (
                  <Timeline.Item 
                    key={step.id} 
                    dot={getTimelineIcon(step.status)}
                    color={isApproved ? 'green' : isPending ? 'gray' : 'red'}
                  >
                    <div style={{ paddingLeft: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ fontSize: '14px', color: '#1e293b' }}>{step.role} Approval Gate</strong>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {isApproved ? `Approved by ${step.reviewerName}` : isPending ? 'Awaiting sign-off' : 'Rejected'}
                          </div>
                        </div>
                        {step.updatedAt && (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {dayjs(step.updatedAt).format('MMM DD, HH:mm')}
                          </span>
                        )}
                      </div>
                      
                      {step.comments && (
                        <div style={{ marginTop: '8px', padding: '8px 12px', background: '#f8fafc', borderLeft: '3px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', color: '#64748b' }}>
                          "{step.comments}"
                        </div>
                      )}
                    </div>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
