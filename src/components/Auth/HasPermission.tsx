import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface HasPermissionProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const HasPermission: React.FC<HasPermissionProps> = ({ permission, fallback = null, children }) => {
  const { hasPermission } = useAuth();
  
  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
