import React from 'react';
import { Skeleton, Card, Row, Col } from 'antd';

interface SkeletonLoaderProps {
  type: 'card' | 'table' | 'detail';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, count = 3 }) => {
  if (type === 'card') {
    return (
      <Row gutter={[24, 24]}>
        {Array.from({ length: count }).map((_, i) => (
          <Col xs={24} sm={12} md={8} lg={6} key={i}>
            <Card
              cover={<div style={{ height: 180, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Skeleton.Image active /></div>}
              style={{ borderRadius: '16px', overflow: 'hidden' }}
            >
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  if (type === 'table') {
    return (
      <div style={{ background: '#fff', padding: '24px', borderRadius: '16px' }}>
        <Skeleton active paragraph={{ rows: 6 }} title={false} />
      </div>
    );
  }

  return (
    <Card style={{ borderRadius: '16px', padding: '24px' }}>
      <Skeleton active avatar paragraph={{ rows: 4 }} />
    </Card>
  );
};
