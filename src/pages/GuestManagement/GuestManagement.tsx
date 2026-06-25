import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guestService } from '../../services/api';
import { Guest } from '../../types/banquet';
import { SkeletonLoader } from '../../components/Common/SkeletonLoader';
import { showToast } from '../../components/Feedback/ToastAlerts';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Tag, Button, Input, Modal, Select, Row, Col, Space, Divider, Alert } from 'antd';
import { Users, Plus, Search, FileSpreadsheet, Sparkles, UserCheck, ShieldAlert, Navigation } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';

const guestSchema = zod.object({
  name: zod.string().min(3, 'Name must be at least 3 characters'),
  eventName: zod.string().min(3, 'Event name must be specified'),
  rsvp: zod.enum(['Confirmed', 'Pending', 'Declined']),
  accommodation: zod.string().min(1, 'Specify room or allocation'),
  transport: zod.string().min(1, 'Specify transport status'),
  meal: zod.string().min(1, 'Specify dietary meal preference'),
  isVIP: zod.boolean().default(false),
  tableNumber: zod.string().default('Unassigned'),
  dietaryAlerts: zod.array(zod.string()).min(1, 'Specify at least one dietary alert')
});

type GuestFormValues = zod.infer<typeof guestSchema>;

export const GuestManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  
  // Filters State
  const [search, setSearch] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState('All');

  const { data: guestsRes, isLoading } = useQuery({
    queryKey: ['guests', search, rsvpFilter],
    queryFn: () => guestService.getGuests(search, rsvpFilter)
  });

  const guests = guestsRes?.data || [];

  // Mutations
  const createGuestMutation = useMutation({
    mutationFn: (newGuest: Omit<Guest, 'id'>) => 
      guestService.createGuest(newGuest, user?.username || 'Unknown'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      showToast.success('Guest registered successfully!');
      setIsModalOpen(false);
      reset();
    }
  });

  const updateSeatingMutation = useMutation({
    mutationFn: ({ guestId, table }: { guestId: string; table: string }) =>
      guestService.updateGuestSeating(guestId, table, user?.username || 'Unknown'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      showToast.success('Seating arrangement updated successfully.');
    }
  });

  const importGuestsMutation = useMutation({
    mutationFn: (list: Omit<Guest, 'id'>[]) => 
      guestService.importBulkGuests(list, user?.username || 'Unknown'),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      setImporting(false);
      setIsImportModalOpen(false);
    }
  });

  const { control, handleSubmit, reset, formState } = useForm<any>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      name: '',
      eventName: 'Miller Wedding',
      rsvp: 'Confirmed',
      accommodation: 'Goa Suite 101',
      transport: 'Driver Assigned',
      meal: 'Vegetarian',
      isVIP: false,
      tableNumber: 'Unassigned',
      dietaryAlerts: ['Vegetarian']
    }
  });

  const errors: any = formState.errors;

  const handleCreateGuest = (data: any) => {
    createGuestMutation.mutate(data);
  };

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, guestId: string) => {
    e.dataTransfer.setData('text/plain', guestId);
  };

  const handleDropGuest = (e: React.DragEvent, tableName: string) => {
    e.preventDefault();
    const guestId = e.dataTransfer.getData('text/plain');
    if (!guestId) return;
    updateSeatingMutation.mutate({ guestId, table: tableName });
  };

  // Bulk Excel Import Simulator
  const handleTriggerBulkImport = () => {
    setImporting(true);
    const mockExcelData: Omit<Guest, 'id'>[] = [
      { name: 'VIP Senator Rawlins', eventName: 'TechConf Annual Gala', rsvp: 'Confirmed', accommodation: 'Suite 201', transport: 'VIP Escalade Assigned', meal: 'Nut-Free', isVIP: true, tableNumber: 'Table 1', dietaryAlerts: ['Nut-Free'] },
      { name: 'Dr. Evelyn Vance', eventName: 'TechConf Annual Gala', rsvp: 'Confirmed', accommodation: 'Room 109', transport: 'Shuttle Assigned', meal: 'Gluten-Free', isVIP: true, tableNumber: 'Table 1', dietaryAlerts: ['Gluten-Free'] },
      { name: 'Mr. Marcus Sterling', eventName: 'TechConf Annual Gala', rsvp: 'Confirmed', accommodation: 'Room 110', transport: 'Self arrival', meal: 'Halal', isVIP: false, tableNumber: 'Table 2', dietaryAlerts: ['Halal'] },
      { name: 'Mrs. Linda Sterling', eventName: 'TechConf Annual Gala', rsvp: 'Confirmed', accommodation: 'Room 110', transport: 'Self arrival', meal: 'Vegetarian', isVIP: false, tableNumber: 'Table 2', dietaryAlerts: ['Vegetarian'] },
    ];
    setTimeout(() => {
      importGuestsMutation.mutate(mockExcelData);
    }, 1200);
  };

  const columns = [
    {
      title: 'Guest Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Guest) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {record.isVIP && <Tag color="gold" style={{ margin: 0, fontWeight: 700 }}>VIP</Tag>}
          <strong style={{ color: '#1e293b' }}>{text}</strong>
        </div>
      )
    },
    {
      title: 'Event Allocated',
      dataIndex: 'eventName',
      key: 'eventName'
    },
    {
      title: 'RSVP Status',
      dataIndex: 'rsvp',
      key: 'rsvp',
      render: (rsvp: Guest['rsvp']) => (
        <Tag color={rsvp === 'Confirmed' ? 'green' : rsvp === 'Pending' ? 'orange' : 'red'}>
          {rsvp.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Table seating',
      dataIndex: 'tableNumber',
      key: 'tableNumber',
      render: (table: string) => (
        <Tag color={table === 'Unassigned' ? 'red' : 'geekblue'} style={{ fontWeight: 600 }}>
          {table.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Transit Info',
      key: 'transit',
      render: (_: any, record: Guest) => (
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          Acc: {record.accommodation} • Trans: {record.transport}
        </span>
      )
    },
    {
      title: 'Meal Alerts',
      dataIndex: 'dietaryAlerts',
      key: 'dietaryAlerts',
      render: (alerts: string[]) => (
        <Space size={4} wrap>
          {alerts.map(a => <Tag color="volcano" key={a} style={{ fontSize: '10px' }}>{a}</Tag>)}
        </Space>
      )
    }
  ];

  // Table Seating Coordinator Categories
  const tablesList = ['Table 1', 'Table 2', 'Table 3', 'Unassigned'];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Guest Register
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: '4px 0 0 0' }}>
            Guest Management
          </h1>
        </div>

        <Space>
          <Button 
            icon={<FileSpreadsheet size={16} />} 
            onClick={() => setIsImportModalOpen(true)}
            style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Bulk Excel Import
          </Button>
          <Button 
            type="primary" 
            icon={<Plus size={16} />} 
            onClick={() => setIsModalOpen(true)}
            style={{ backgroundColor: '#9e2a2b', borderColor: '#9e2a2b', borderRadius: '8px' }}
          >
            Register Guest
          </Button>
        </Space>
      </div>

      {/* Seating Assignment Visual Playground */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#a8201a" />
            <span style={{ fontWeight: 700 }}>Visual Seating Coordinator (Drag & Drop)</span>
          </div>
        }
        style={{ borderRadius: '16px', marginBottom: '24px', border: '1px solid #ffeef0' }}
      >
        <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px' }}>
          Drag a guest card from one table container and drop it onto another to dynamically reassign ballroom seating.
        </p>

        <Row gutter={16}>
          {tablesList.map(tbl => {
            const tableGuests = guests.filter(g => g.tableNumber === tbl);
            return (
              <Col xs={24} sm={12} md={6} key={tbl}>
                <div 
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDropGuest(e, tbl)}
                  style={{ 
                    background: tbl === 'Unassigned' ? '#fff5f5' : '#f8fafc',
                    border: tbl === 'Unassigned' ? '2px dashed #fca5a5' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    minHeight: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>
                    <strong style={{ color: tbl === 'Unassigned' ? '#ef4444' : '#1e293b' }}>{tbl.toUpperCase()}</strong>
                    <Tag color={tbl === 'Unassigned' ? 'red' : 'geekblue'}>{tableGuests.length} Guests</Tag>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
                    {tableGuests.map(g => (
                      <div 
                        key={g.id}
                        draggable
                        onDragStart={e => handleDragStart(e, g.id)}
                        style={{ 
                          background: '#fff', 
                          border: g.isVIP ? '1px solid #fbbf24' : '1px solid #e2e8f0', 
                          borderRadius: '8px', 
                          padding: '10px', 
                          cursor: 'grab',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                          fontSize: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{g.name}</span>
                          {g.isVIP && <Tag color="gold" style={{ fontSize: '9px', margin: 0, padding: '0 4px' }}>VIP</Tag>}
                        </div>
                        {g.dietaryAlerts.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                            {g.dietaryAlerts.map(a => <span key={a} style={{ fontSize: '9px', color: '#ea580c' }}>• {a}</span>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* Filters */}
      <Card style={{ borderRadius: '12px', marginBottom: '24px', border: '1px solid #eef0f2' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input
              placeholder="Search guests by name or event..."
              prefix={<Search size={16} color="#64748b" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ borderRadius: '8px' }}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select 
              value={rsvpFilter} 
              onChange={setRsvpFilter} 
              style={{ width: '100%' }}
              options={[
                { value: 'All', label: 'All RSVPs' },
                { value: 'Confirmed', label: 'Confirmed Only' },
                { value: 'Pending', label: 'Pending Holds' },
                { value: 'Declined', label: 'Declined' }
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* Table */}
      {isLoading ? (
        <SkeletonLoader type="table" />
      ) : (
        <Card style={{ borderRadius: '16px', border: '1px solid #eef0f2' }}>
          <Table 
            dataSource={guests} 
            columns={columns} 
            rowKey="id" 
            pagination={{ pageSize: 8 }}
            style={{ borderRadius: '8px', overflow: 'hidden' }}
          />
        </Card>
      )}

      {/* Register Guest Modal */}
      <Modal
        title="Register Event Guest"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={500}
      >
        <form onSubmit={handleSubmit(handleCreateGuest)} style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Guest Full Name</label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input {...field} placeholder="e.g. Mr. Aditya Sen" />}
            />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Event Assignment</label>
            <Controller
              name="eventName"
              control={control}
              render={({ field }) => <Input {...field} placeholder="e.g. Miller Wedding" />}
            />
            {errors.eventName && <span className="form-error">{errors.eventName.message}</span>}
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">VIP Status</label>
                <Controller
                  name="isVIP"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onChange={field.onChange} style={{ width: '100%' }}>
                      <Select.Option value={true}>Yes (VIP Guest)</Select.Option>
                      <Select.Option value={false}>No (Standard)</Select.Option>
                    </Select>
                  )}
                />
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Table Assign</label>
                <Controller
                  name="tableNumber"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} style={{ width: '100%' }}>
                      <Select.Option value="Unassigned">Unassigned</Select.Option>
                      <Select.Option value="Table 1">Table 1</Select.Option>
                      <Select.Option value="Table 2">Table 2</Select.Option>
                      <Select.Option value="Table 3">Table 3</Select.Option>
                    </Select>
                  )}
                />
              </div>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">RSVP Status</label>
                <Controller
                  name="rsvp"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} style={{ width: '100%' }}>
                      <Select.Option value="Confirmed">Confirmed</Select.Option>
                      <Select.Option value="Pending">Pending</Select.Option>
                      <Select.Option value="Declined">Declined</Select.Option>
                    </Select>
                  )}
                />
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Meal Alerts</label>
                <Controller
                  name="dietaryAlerts"
                  control={control}
                  render={({ field }) => (
                    <Select mode="multiple" {...field} style={{ width: '100%' }}>
                      <Select.Option value="Vegetarian">Vegetarian</Select.Option>
                      <Select.Option value="Vegan">Vegan</Select.Option>
                      <Select.Option value="Gluten-Free">Gluten-Free</Select.Option>
                      <Select.Option value="Nut-Free">Nut-Free</Select.Option>
                      <Select.Option value="Halal">Halal</Select.Option>
                    </Select>
                  )}
                />
                {errors.dietaryAlerts && <span className="form-error">{errors.dietaryAlerts.message}</span>}
              </div>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Hotel Accommodation</label>
                <Controller
                  name="accommodation"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="e.g. Rm 204 or Awaiting" />}
                />
                {errors.accommodation && <span className="form-error">{errors.accommodation.message}</span>}
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Transit Status</label>
                <Controller
                  name="transport"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="e.g. Driver Assigned, Self Arrival" />}
                />
                {errors.transport && <span className="form-error">{errors.transport.message}</span>}
              </div>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={createGuestMutation.isPending}
              style={{ backgroundColor: '#9e2a2b', borderColor: '#9e2a2b' }}
            >
              Add Guest
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Excel Import Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={18} color="#15803d" />
            <span>Excel Guest List Importer</span>
          </div>
        }
        open={isImportModalOpen}
        onCancel={() => setIsImportModalOpen(false)}
        footer={null}
        width={400}
      >
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>
            Select an event guest list spreadsheet (.xlsx, .csv) to auto-populate VIP tables.
          </p>

          <Button 
            type="primary"
            onClick={handleTriggerBulkImport}
            loading={importing}
            style={{ backgroundColor: '#15803d', borderColor: '#15803d', height: '40px', borderRadius: '8px', fontWeight: 600, width: '100%' }}
          >
            {importing ? 'Processing Sheets...' : 'Simulate Sheet Upload'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
