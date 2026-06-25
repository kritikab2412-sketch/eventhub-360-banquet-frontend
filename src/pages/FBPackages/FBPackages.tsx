import React, { useState } from 'react';
import type { MenuItem } from '../../types/banquet';
import { INITIAL_MENU_ITEMS } from '../../constants/banquet';
import { Card, Row, Col, Tag, Table, Button } from 'antd';
import { Utensils, Award, BookOpen, Coffee } from 'lucide-react';

export const FBPackages: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'Hors D\'oeuvres' | 'Main Entrees' | 'Desserts' | 'Beverages'>('all');
  
  const menuItems = INITIAL_MENU_ITEMS;

  const categories = [
    { key: 'all', label: 'All Items', icon: <BookOpen size={16} /> },
    { key: 'Hors D\'oeuvres', label: 'Hors D\'oeuvres', icon: <Award size={16} /> },
    { key: 'Main Entrees', label: 'Main Entrées', icon: <Utensils size={16} /> },
    { key: 'Desserts', label: 'Desserts', icon: <Award size={16} /> },
    { key: 'Beverages', label: 'Beverages', icon: <Coffee size={16} /> }
  ];

  const filteredItems = activeTab === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeTab);

  const columns = [
    {
      title: 'Item Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong style={{ color: '#1e293b' }}>{text}</strong>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag color="blue">{cat}</Tag>,
    },
    {
      title: 'Cost per Pax',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => <span style={{ fontWeight: 600, color: '#a8201a' }}>₹{price.toFixed(2)}</span>,
    },
    {
      title: 'Dietary Mappings',
      dataIndex: 'dietaryNotes',
      key: 'dietaryNotes',
      render: (notes: string[]) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          {notes.map(n => (
            <Tag color={n === 'Vegetarian' ? 'green' : n === 'Gluten-Free' ? 'purple' : 'orange'} key={n}>
              {n}
            </Tag>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Menu Catalog
        </span>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: '4px 0 0 0' }}>
          F&B Catering Packages
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
          Browse premium culinary assets, per-pax pricing calculations, and dietary substitutions setup.
        </p>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Side: Package Card overview */}
        <Col xs={24} lg={8}>
          <Card 
            title={<span style={{ fontWeight: 600 }}>Active Tier Packages</span>}
            style={{ borderRadius: '16px', height: '100%', border: '1px solid #eef0f2' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', border: '1px solid #a8201a', background: '#fff5f5', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '15px', color: '#a8201a' }}>Platinum Signature</strong>
                  <Tag color="red">Popular</Tag>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Includes 3 hors d'oeuvres, 2 mains, 2 desserts, free-flow wine and coffee bar.</p>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#a8201a' }}>₹85.00 <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>/ pax</span></div>
              </div>

              <div style={{ padding: '16px', border: '1px solid #cbd5e1', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '15px', color: '#1e293b' }}>Gold Standard</strong>
                  <Tag>Standard</Tag>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Includes 2 hors d'oeuvres, 2 mains, 1 dessert, soft beverages and water bar.</p>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>₹65.00 <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>/ pax</span></div>
              </div>

              <div style={{ padding: '16px', border: '1px solid #cbd5e1', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '15px', color: '#1e293b' }}>Silver Standard</strong>
                  <Tag>Economy</Tag>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Includes 1 hors d'oeuvre, 1 main, 1 dessert, soft beverages.</p>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>₹48.00 <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>/ pax</span></div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Right Side: Dishes table list with custom tabs */}
        <Col xs={24} lg={16}>
          <Card style={{ borderRadius: '16px', border: '1px solid #eef0f2' }}>
            {/* Custom Tab list */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px', overflowX: 'auto' }}>
              {categories.map(cat => (
                <Button
                  key={cat.key}
                  type={activeTab === cat.key ? 'primary' : 'default'}
                  onClick={() => setActiveTab(cat.key as any)}
                  icon={cat.icon}
                  style={{ 
                    borderRadius: '24px', 
                    fontSize: '13px', 
                    backgroundColor: activeTab === cat.key ? '#9e2a2b' : 'transparent',
                    borderColor: activeTab === cat.key ? '#9e2a2b' : '#cbd5e1',
                    color: activeTab === cat.key ? '#fff' : '#1e293b'
                  }}
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            <Table 
              dataSource={filteredItems} 
              columns={columns} 
              rowKey="id" 
              pagination={{ pageSize: 5 }} 
              style={{ borderRadius: '8px', overflow: 'hidden' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
