import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { venueService } from '../../services/api';
import { SkeletonLoader } from '../../components/Common/SkeletonLoader';
import { showToast } from '../../components/Feedback/ToastAlerts';
import { Card, Row, Col, Button, Alert } from 'antd';
import { Layers, Trash2, ShieldAlert } from 'lucide-react';

interface LayoutItem {
  id: string;
  name: string;
  type: 'round-table' | 'stage' | 'dance-floor' | 'buffet-station';
  x: number;
  y: number;
  seats?: number;
}

export const LayoutConfigurator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'2d' | '3d'>('2d');
  
  // Set default workspace to Imperial Grand Ballroom (Max Cap: 1200)
  const { data: venuesRes, isLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: () => venueService.getVenues()
  });

  const venues = venuesRes?.data || [];
  const activeVenue = venues[0] || { name: 'Grand Ballroom C', maxCapacity: 120 };

  // Set default layout elements
  const [elements, setElements] = useState<LayoutItem[]>([
    { id: 't-1', name: 'T01', type: 'round-table', x: 120, y: 220, seats: 10 },
    { id: 't-2', name: 'T02', type: 'round-table', x: 240, y: 220, seats: 10 },
    { id: 't-3', name: 'T03', type: 'round-table', x: 360, y: 220, seats: 10 },
    { id: 't-4', name: 'T04', type: 'round-table', x: 120, y: 340, seats: 10 },
    { id: 't-5', name: 'T05', type: 'round-table', x: 240, y: 340, seats: 10 },
    { id: 't-6', name: 'T06', type: 'round-table', x: 360, y: 340, seats: 10 },
    { id: 'stage-1', name: 'MAIN STAGE (24\' x 8\')', type: 'stage', x: 300, y: 50 },
    { id: 'dance-1', name: 'DANCE FLOOR', type: 'dance-floor', x: 350, y: 130 },
    { id: 'buffet-1', name: 'BUFFET STATION - HOT', type: 'buffet-station', x: 200, y: 450 },
    { id: 'buffet-2', name: 'BUFFET STATION - COLD', type: 'buffet-station', x: 500, y: 450 }
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Dynamic capacity calculations
  const totalSeating = elements
    .filter(el => el.type === 'round-table')
    .reduce((sum, el) => sum + (el.seats || 0), 0);

  const capacityExceeded = totalSeating > activeVenue.maxCapacity;

  const handleAddElement = (type: LayoutItem['type']) => {
    let newItem: LayoutItem;
    const offset = elements.length * 15;
    
    if (type === 'round-table') {
      const tableNum = elements.filter(e => e.type === 'round-table').length + 1;
      const formattedNum = tableNum < 10 ? `T0${tableNum}` : `T${tableNum}`;
      newItem = {
        id: `t-${Date.now()}`,
        name: formattedNum,
        type: 'round-table',
        x: 100 + (offset % 300),
        y: 180 + (offset % 200),
        seats: 10
      };
    } else if (type === 'stage') {
      newItem = { id: `stage-${Date.now()}`, name: 'STAGE ADD-ON', type: 'stage', x: 150, y: 80 };
    } else if (type === 'dance-floor') {
      newItem = { id: `dance-${Date.now()}`, name: 'DANCE FLOOR', type: 'dance-floor', x: 220, y: 140 };
    } else {
      newItem = { id: `buffet-${Date.now()}`, name: 'BUFFET LINE', type: 'buffet-station', x: 180, y: 420 };
    }

    setElements([...elements, newItem]);
    setSelectedId(newItem.id);
    showToast.success(`Added ${newItem.name} to layout.`);
  };

  const handleDeleteElement = (id: string) => {
    const item = elements.find(el => el.id === id);
    if (!item) return;
    setElements(elements.filter(el => el.id !== id));
    setSelectedId(null);
    showToast.info(`Removed ${item.name} from layout.`);
  };

  const handleSaveLayout = () => {
    if (capacityExceeded) {
      showToast.error(`Capacity Exception: Seating count (${totalSeating}) exceeds hall maximum capacity (${activeVenue.maxCapacity})!`);
      return;
    }
    showToast.success('Layout configuration saved successfully.');
  };

  if (isLoading) {
    return <SkeletonLoader type="detail" />;
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Banquets / Layout Configurator
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: '4px 0 0 0' }}>
            Workspace: {activeVenue.name}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Editor Mode Selector */}
          <div style={{ display: 'flex', padding: '4px', background: '#f1f5f9', borderRadius: '24px' }}>
            <Button 
              type={activeTab === '2d' ? 'primary' : 'text'} 
              onClick={() => setActiveTab('2d')}
              style={{ borderRadius: '20px', fontSize: '13px', backgroundColor: activeTab === '2d' ? '#fff' : 'transparent', color: '#1e293b', border: 0, boxShadow: activeTab === '2d' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              2D Editor
            </Button>
            <Button 
              type={activeTab === '3d' ? 'primary' : 'text'} 
              onClick={() => {
                setActiveTab('3d');
                showToast.info('Rendering 3D preview model...');
              }}
              style={{ borderRadius: '20px', fontSize: '13px', backgroundColor: activeTab === '3d' ? '#fff' : 'transparent', color: '#1e293b', border: 0, boxShadow: activeTab === '3d' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              3D Preview
            </Button>
          </div>

          <div style={{ padding: '8px 16px', border: '1px solid #eef0f2', borderRadius: '8px', background: '#fff', fontSize: '13px', fontWeight: 600 }}>
            Seating Capacity: <span style={{ color: capacityExceeded ? '#ef4444' : '#1e293b' }}>{totalSeating}</span> / {activeVenue.maxCapacity} Pax
          </div>

          <Button 
            type="primary" 
            onClick={handleSaveLayout}
            style={{ backgroundColor: '#9e2a2b', borderColor: '#9e2a2b', fontWeight: 600 }}
          >
            Save Layout
          </Button>
        </div>
      </div>

      {capacityExceeded && (
        <Alert
          message="Capacity Exception Triggered"
          description={`Seating layout requests ${totalSeating} guests, which exceeds the venue's maximum allowable capacity of ${activeVenue.maxCapacity}. You will not be allowed to publish this layout.`}
          type="error"
          showIcon
          icon={<ShieldAlert size={18} />}
          style={{ marginBottom: '20px', borderRadius: '8px' }}
        />
      )}

      {activeTab === '2d' ? (
        <Row gutter={24}>
          {/* Left panel layout shapes tools */}
          <Col xs={24} md={4}>
            <Card style={{ borderRadius: '16px', height: '100%' }} bodyStyle={{ padding: '16px 12px' }}>
              <h4 style={{ fontWeight: 600, color: '#64748b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '16px', textAlign: 'center' }}>Toolbox</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Button 
                  icon={<div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #a8201a', display: 'inline-block', marginRight: '8px' }} />}
                  style={{ display: 'flex', alignItems: 'center', height: '40px', borderRadius: '8px' }}
                  onClick={() => handleAddElement('round-table')}
                >
                  Round Table
                </Button>
                <Button 
                  icon={<div style={{ width: '16px', height: '8px', background: '#3b82f6', display: 'inline-block', marginRight: '8px' }} />}
                  style={{ display: 'flex', alignItems: 'center', height: '40px', borderRadius: '8px' }}
                  onClick={() => handleAddElement('stage')}
                >
                  Stage
                </Button>
                <Button 
                  icon={<div style={{ width: '12px', height: '12px', background: '#cbd5e1', display: 'inline-block', marginRight: '8px' }} />}
                  style={{ display: 'flex', alignItems: 'center', height: '40px', borderRadius: '8px' }}
                  onClick={() => handleAddElement('dance-floor')}
                >
                  Dance Floor
                </Button>
                <Button 
                  icon={<div style={{ width: '16px', height: '8px', background: '#8b5cf6', display: 'inline-block', marginRight: '8px' }} />}
                  style={{ display: 'flex', alignItems: 'center', height: '40px', borderRadius: '8px' }}
                  onClick={() => handleAddElement('buffet-station')}
                >
                  Buffet Line
                </Button>

                {selectedId && (
                  <div style={{ marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '12px' }}>ELEMENT DETAILS</span>
                    
                    <Button 
                      type="primary" 
                      danger 
                      icon={<Trash2 size={16} />}
                      onClick={() => handleDeleteElement(selectedId)}
                      style={{ width: '100%', borderRadius: '8px' }}
                    >
                      Delete Item
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </Col>

          {/* Seating Grid Canvas */}
          <Col xs={24} md={20}>
            <div className="layout-canvas-frame">
              <div style={{ position: 'absolute', top: '12px', left: '12px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                EXTERIOR WALL - 24' height
              </div>

              {/* Layout Nodes */}
              {elements.map(el => {
                const isSelected = selectedId === el.id;
                
                if (el.type === 'round-table') {
                  return (
                    <div 
                      key={el.id}
                      className={`canvas-node-table ${isSelected ? 'selected' : ''}`}
                      style={{ left: `${el.x}px`, top: `${el.y}px` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(el.id);
                      }}
                    >
                      {el.name}
                    </div>
                  );
                }

                if (el.type === 'stage') {
                  return (
                    <div
                      key={el.id}
                      className={`canvas-node-stage ${isSelected ? 'selected' : ''}`}
                      style={{ left: `${el.x}px`, top: `${el.y}px` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(el.id);
                      }}
                    >
                      {el.name}
                    </div>
                  );
                }

                if (el.type === 'dance-floor') {
                  return (
                    <div
                      key={el.id}
                      className={`canvas-node-dance ${isSelected ? 'selected' : ''}`}
                      style={{ left: `${el.x}px`, top: `${el.y}px` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(el.id);
                      }}
                    >
                      {el.name}
                    </div>
                  );
                }

                return (
                  <div
                    key={el.id}
                    className={`canvas-node-buffet ${isSelected ? 'selected' : ''}`}
                    style={{ left: `${el.x}px`, top: `${el.y}px` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(el.id);
                    }}
                  >
                    {el.name}
                  </div>
                );
              })}
            </div>
          </Col>
        </Row>
      ) : (
        /* 3D Model Mock container */
        <Card style={{ borderRadius: '16px', background: '#0f172a', border: 0, minHeight: '520px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center' }}>
          <div style={{ maxWidth: '400px' }}>
            <Layers size={64} color="#a8201a" style={{ margin: '0 auto 24px', animation: 'pulse 2s infinite' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>3D Spatial Renderer Loaded</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '24px' }}>
              Virtual tour preview models generated for Imperial Ballroom C. Walkways, fire egress clearance buffers, and ceiling fixtures mapped.
            </p>
            <Button type="primary" style={{ backgroundColor: '#a8201a', borderColor: '#a8201a', borderRadius: '8px' }}>Launch Fullscreen VR</Button>
          </div>
        </Card>
      )}
    </div>
  );
};
