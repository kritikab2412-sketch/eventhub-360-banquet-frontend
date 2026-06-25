import React from 'react';
import { Empty, Button } from 'antd';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Found',
  description = 'There are no items to display in this list.',
  actionText,
  onAction
}) => {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px dashed #e2e8f0' }}>
      <Empty
        image={<Inbox size={48} color="#94a3b8" style={{ margin: '0 auto 12px' }} />}
        imageStyle={{ height: 60 }}
        description={
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: '#1e293b', fontWeight: 600 }}>{title}</h4>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>{description}</p>
          </div>
        }
      >
        {actionText && onAction && (
          <Button 
            type="primary" 
            onClick={onAction}
            style={{ backgroundColor: '#9e2a2b', borderColor: '#9e2a2b', borderRadius: '8px', marginTop: '12px' }}
          >
            {actionText}
          </Button>
        )}
      </Empty>
    </div>
  );
};
