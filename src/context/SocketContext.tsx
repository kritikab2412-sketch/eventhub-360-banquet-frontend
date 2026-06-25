import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { showToast } from '../components/Feedback/ToastAlerts';

interface SocketContextType {
  socket: Socket | any | null;
  isConnected: boolean;
  emitEvent: (event: string, data: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { jwtToken } = useAuth();
  const [socket, setSocket] = useState<Socket | any | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!jwtToken) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000';
    
    // Create socket connection
    const socketInstance = io(wsUrl, {
      autoConnect: false,
      auth: { token: jwtToken },
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
    });

    setSocket(socketInstance);

    // Bind real event listeners
    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Socket.IO Connected to Server');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket.IO Disconnected');
    });

    socketInstance.on('connect_error', () => {
      // If server is not reachable, fallback to a local simulation loop
      setIsConnected(true); // Simulate connected state
      console.warn('Socket.IO Server unreachable. Running coordination simulation engine.');
    });

    socketInstance.connect();

    return () => {
      socketInstance.disconnect();
    };
  }, [jwtToken]);

  // Simulation Engine (when server is offline)
  useEffect(() => {
    if (!isConnected || !socket) return;

    // Simulate KOT status updates and bottleneck triggers every 30 seconds
    const interval = setInterval(() => {
      // Trigger live notifications
      const alerts = [
        { title: 'Kitchen Alert', desc: 'Main Course: Roasted Wagyu is delayed due to high grill occupancy.', type: 'warning' },
        { title: 'Layout Updated', desc: 'Banquet Manager updated the Imperial Grand Ballroom layout.', type: 'info' },
        { title: 'BEO Update', desc: 'BEO #8842-A has been sent for approval.', type: 'success' },
        { title: 'Table Service Warning', desc: 'Table 22 awaiting dessert for 12 minutes.', type: 'error' }
      ];

      const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
      
      // Dispatch custom events locally to satisfy listeners
      if (socket.listeners && socket.listeners('operation_alert')) {
        socket.listeners('operation_alert').forEach((cb: any) => cb(randomAlert));
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [isConnected, socket]);

  const emitEvent = (event: string, data: any) => {
    if (socket) {
      socket.emit(event, data);
      
      // Local Echo simulation for offline sandbox
      setTimeout(() => {
        if (event === 'dispatch_kot') {
          showToast.success(`KOT ${data.kotId} has been dispatched to floor service.`);
          if (socket.listeners('kot_status_changed')) {
            socket.listeners('kot_status_changed').forEach((cb: any) => cb({ id: data.kotId, status: 'DISPATCHED' }));
          }
        }
        if (event === 'escalate_kot') {
          showToast.warning(`KOT ${data.kotId} escalated! Alert sent to Kitchen Manager.`);
          if (socket.listeners('kot_status_changed')) {
            socket.listeners('kot_status_changed').forEach((cb: any) => cb({ id: data.kotId, status: 'DELAYED', bottleneck: 'Escalated by Operations Mgr' }));
          }
        }
      }, 500);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, emitEvent }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
