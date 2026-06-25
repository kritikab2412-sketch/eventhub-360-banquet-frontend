import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Result, Button } from 'antd';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role } = useAuth();

  if (!user) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Result
          status="403"
          title="Not Authenticated"
          subTitle="Please sign in to access the Banquet Management platform."
        />
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div style={{ padding: '60px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Result
          icon={<ShieldAlert size={64} color="#a8201a" />}
          title="Access Denied"
          subTitle={`Your current role (${role}) does not have permission to view this view.`}
          extra={
            <div style={{ color: '#64748b' }}>
              Switch your role in the top header menu to preview this section.
            </div>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
};
