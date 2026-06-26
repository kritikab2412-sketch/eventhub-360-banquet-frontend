import axios from 'axios';
import type { Venue, Booking, BEO, MenuItem, KOTItem, Staff, AuditLog, ApiResponse, BookingStatus, Guest, VaultDocument, BEOApprovalStep, Task } from '../types/banquet';
import { INITIAL_VENUES, INITIAL_BOOKINGS, INITIAL_MENU_ITEMS, INITIAL_KOTS, INITIAL_STAFF, INITIAL_AUDIT_LOGS, INITIAL_GUESTS, INITIAL_DOCUMENTS, INITIAL_APPROVAL_STEPS, INITIAL_TASKS } from '../constants/banquet';
import { showToast } from '../components/Feedback/ToastAlerts';

// Global Axios Configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eh_jwt_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const response = error.response;
    if (response) {
      if (response.status === 401) {
        showToast.error('Session expired. Please log in again.');
      } else if (response.status === 403) {
        showToast.error('Access Denied: You do not have permission.');
      } else {
        showToast.error(response.data?.message || 'Server error occurred.');
      }
    } else {
      showToast.error('Network Error: Cannot connect to the API server.');
    }
    return Promise.reject(error);
  }
);

export default api;

// ==========================================
// MOCK DATABASE & PERSISTENCE LAYER (LOCAL STORAGE)
// ==========================================

const getStoredData = <T>(key: string, initialData: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return initialData;
  }
};

const saveStoredData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initialize Mock Databases
let venuesDB = getStoredData<Venue[]>('eh_venues', INITIAL_VENUES);
let bookingsDB = getStoredData<Booking[]>('eh_bookings', INITIAL_BOOKINGS);

// Simulated Delay for APIs
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Recalculate billing amount and financial status for booking
const recalculateFinancials = (booking: Booking): Booking => {
  const billingAmount = booking.billingAmount || booking.guestCount * 85;
  const depositRequired = Math.round(billingAmount * 0.5);
  const depositReceived = booking.depositReceived || booking.paidAmount || 0;
  const balanceDue = Math.max(0, billingAmount - depositReceived);
  const refundedAmount = booking.refundedAmount || 0;
  
  let paymentStatus: Booking['paymentStatus'] = 'Unpaid';
  if (refundedAmount > 0 && depositReceived === 0) {
    paymentStatus = 'Refunded';
  } else if (depositReceived >= billingAmount && billingAmount > 0) {
    paymentStatus = 'Fully Paid';
  } else if (depositReceived >= depositRequired && depositRequired > 0) {
    paymentStatus = 'Deposit Paid';
  }
  
  const overdue = booking.overdue !== undefined ? booking.overdue : (paymentStatus === 'Unpaid' && new Date(booking.date).getTime() < Date.now());
  
  return {
    ...booking,
    billingAmount,
    paidAmount: depositReceived,
    depositRequired,
    depositReceived,
    balanceDue,
    refundedAmount,
    overdue,
    paymentStatus
  };
};

// ==========================================
// MOCK SERVICES
// ==========================================

export const venueService = {
  getVenues: async (search?: string, type?: string, status?: string): Promise<ApiResponse<Venue[]>> => {
    await delay();
    venuesDB = getStoredData<Venue[]>('eh_venues', INITIAL_VENUES);
    let filtered = [...venuesDB];

    if (search) {
      filtered = filtered.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (type && type !== 'All') {
      filtered = filtered.filter(v => v.locationType === type);
    }
    if (status && status !== 'Any') {
      filtered = filtered.filter(v => v.status === status);
    }

    return {
      success: true,
      message: 'Venues retrieved successfully',
      data: filtered
    };
  },

  createVenue: async (venue: Omit<Venue, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>, actor: string): Promise<ApiResponse<Venue>> => {
    await delay();
    const newVenue: Venue = {
      ...venue,
      id: `venue-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: actor,
      updatedAt: new Date().toISOString(),
      updatedBy: actor
    };

    venuesDB.push(newVenue);
    saveStoredData('eh_venues', venuesDB);
    auditService.log(actor, 'Created Space', 'Venue', newVenue.id, `Added venue space: ${newVenue.name}`, '', JSON.stringify(newVenue));

    return {
      success: true,
      message: 'Venue created successfully',
      data: newVenue
    };
  },

  updateVenue: async (id: string, updates: Partial<Venue>, actor: string): Promise<ApiResponse<Venue>> => {
    await delay();
    venuesDB = getStoredData<Venue[]>('eh_venues', INITIAL_VENUES);
    const index = venuesDB.findIndex(v => v.id === id);
    if (index === -1) throw new Error('Venue not found');

    const oldVenue = { ...venuesDB[index] };
    const updatedVenue = {
      ...venuesDB[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: actor
    };

    venuesDB[index] = updatedVenue;
    saveStoredData('eh_venues', venuesDB);
    auditService.log(
      actor, 
      'Modified Space', 
      'Venue', 
      id, 
      `Updated venue details for: ${updatedVenue.name}`,
      JSON.stringify(oldVenue),
      JSON.stringify(updatedVenue)
    );

    return {
      success: true,
      message: 'Venue updated successfully',
      data: updatedVenue
    };
  }
};

export const bookingService = {
  getBookings: async (search?: string, status?: string): Promise<ApiResponse<Booking[]>> => {
    await delay();
    bookingsDB = getStoredData<Booking[]>('eh_bookings', INITIAL_BOOKINGS);
    let filtered = bookingsDB.map(recalculateFinancials);

    if (search) {
      filtered = filtered.filter(b => b.clientName.toLowerCase().includes(search.toLowerCase()) || b.eventType.toLowerCase().includes(search.toLowerCase()) || b.venueName.toLowerCase().includes(search.toLowerCase()));
    }
    if (status && status !== 'All') {
      filtered = filtered.filter(b => b.status === status);
    }

    return {
      success: true,
      message: 'Bookings retrieved successfully',
      data: filtered
    };
  },

  createBooking: async (booking: Omit<Booking, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'depositRequired' | 'depositReceived' | 'balanceDue' | 'refundedAmount' | 'overdue' | 'paymentStatus' | 'lifecycleHistory'>, actor: string): Promise<ApiResponse<Booking>> => {
    await delay();
    
    // Check conflicts (Availability Engine)
    bookingsDB = getStoredData<Booking[]>('eh_bookings', INITIAL_BOOKINGS);
    const isConflict = bookingsDB.some(b => {
      const bStart = b.startDate || b.date;
      const bEnd = b.endDate || b.date;
      return (
        b.venueId === booking.venueId && 
        b.status !== 'Blocked' &&
        b.status !== 'Archived' &&
        booking.startDate <= bEnd && 
        booking.endDate >= bStart &&
        booking.startTime < b.endTime && 
        booking.endTime > b.startTime
      );
    });

    const billingAmt = booking.billingAmount || booking.guestCount * 85;
    const rawBooking: Booking = {
      ...booking,
      id: `booking-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: actor,
      updatedAt: new Date().toISOString(),
      updatedBy: actor,
      depositRequired: Math.round(billingAmt * 0.5),
      depositReceived: booking.paidAmount || 0,
      balanceDue: billingAmt - (booking.paidAmount || 0),
      refundedAmount: 0,
      overdue: false,
      paymentStatus: 'Unpaid',
      lifecycleHistory: [
        { status: booking.status || 'Inquiry', actor, timestamp: new Date().toISOString(), note: 'Booking registered' }
      ]
    };

    const finalBooking = recalculateFinancials(rawBooking);
    bookingsDB.push(finalBooking);
    saveStoredData('eh_bookings', bookingsDB);
    
    auditService.log(actor, 'Created Booking', 'Booking', finalBooking.id, `Placed hold for ${finalBooking.clientName} at ${finalBooking.venueName}`, '', JSON.stringify(finalBooking));

    if (isConflict) {
      // Trigger a conflict alert automatically
      const conflictMsg = `Double Booking Warning: Conflict detected for ${booking.venueName} from ${booking.startDate} to ${booking.endDate}`;
      showToast.pushAlert('Conflict Detected', conflictMsg, 'error');
    }

    return {
      success: true,
      message: 'Booking created successfully',
      data: finalBooking
    };
  },

  updateBookingStatus: async (id: string, status: BookingStatus, actor: string, note?: string): Promise<ApiResponse<Booking>> => {
    await delay();
    bookingsDB = getStoredData<Booking[]>('eh_bookings', INITIAL_BOOKINGS);
    const index = bookingsDB.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Booking not found');

    const oldBooking = { ...bookingsDB[index] };
    const oldStatus = oldBooking.status;
    
    const lifecycleHistory = oldBooking.lifecycleHistory || [];
    const updatedHistory = [...lifecycleHistory, { status, actor, timestamp: new Date().toISOString(), note }];

    const updated = recalculateFinancials({
      ...bookingsDB[index],
      status,
      lifecycleHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
      updatedBy: actor
    });

    bookingsDB[index] = updated;
    saveStoredData('eh_bookings', bookingsDB);

    // Workflow Automation triggers
    if (status === 'Confirmed' && oldStatus !== 'Confirmed') {
      const storedTasks = getStoredData<Task[]>('eh_tasks', INITIAL_TASKS);
      const autoTasks: Task[] = [
        { id: `task-auto-${Date.now()}-1`, bookingId: id, title: 'Setup round tables & egress paths', roleAssigned: 'Banquet Mgr', completed: false, dueDate: updated.date, autoTriggered: true },
        { id: `task-auto-${Date.now()}-2`, bookingId: id, title: 'Reconcile Platinum F&B menu package options', roleAssigned: 'Kitchen Mgr', completed: false, dueDate: updated.date, autoTriggered: true },
        { id: `task-auto-${Date.now()}-3`, bookingId: id, title: 'Submit 50% deposit invoice request', roleAssigned: 'Finance', completed: false, dueDate: updated.date, autoTriggered: true }
      ];
      saveStoredData('eh_tasks', [...storedTasks, ...autoTasks]);

      const currentAlerts = getStoredData<any[]>('eh_session_notifications', []);
      currentAlerts.unshift({
        id: Date.now() + 1,
        type: 'info',
        title: 'Workflow: Auto Tasks Triggered',
        desc: `Operational checklist initialized for Confirmed event: ${updated.clientName}`,
        time: 'Just now',
        unread: true,
        category: 'Operations',
        priority: 'High'
      });
      saveStoredData('eh_session_notifications', currentAlerts);
    }

    if (status === 'BEO Approved' && oldStatus !== 'BEO Approved') {
      const storedTasks = getStoredData<Task[]>('eh_tasks', INITIAL_TASKS);
      const invoiceTask: Task = {
        id: `task-auto-${Date.now()}-4`,
        bookingId: id,
        title: 'Verify e-Sign Contract & execute details',
        roleAssigned: 'Finance',
        completed: false,
        dueDate: updated.date,
        autoTriggered: true
      };
      saveStoredData('eh_tasks', [...storedTasks, invoiceTask]);

      const currentAlerts = getStoredData<any[]>('eh_session_notifications', []);
      currentAlerts.unshift({
        id: Date.now() + 2,
        type: 'success',
        title: 'Workflow: BEO Approved Sign-off',
        desc: `Awaiting Finance contract execution for BEO approval.`,
        time: 'Just now',
        unread: true,
        category: 'Documents',
        priority: 'High'
      });
      saveStoredData('eh_session_notifications', currentAlerts);
    }

    auditService.log(
      actor, 
      'Modified Status', 
      'Booking', 
      id, 
      `Updated booking status of ${updated.clientName} from ${oldStatus} to ${status}`,
      oldStatus,
      status
    );

    return {
      success: true,
      message: `Booking status updated to ${status}`,
      data: updated
    };
  },

  updateFinancials: async (id: string, updates: { depositReceived: number; refundedAmount?: number; overdue?: boolean; billingAmount?: number }, actor: string, role: string): Promise<ApiResponse<Booking>> => {
    await delay();
    
    // RBAC check: Only Finance can edit billing parameters directly
    if (role !== 'Finance') {
      throw new Error('Access Denied: Only Finance department can record transactions.');
    }

    bookingsDB = getStoredData<Booking[]>('eh_bookings', INITIAL_BOOKINGS);
    const index = bookingsDB.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Booking not found');

    const oldBooking = { ...bookingsDB[index] };
    const updatedRaw = {
      ...bookingsDB[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: actor
    };

    const finalBooking = recalculateFinancials(updatedRaw);
    bookingsDB[index] = finalBooking;
    saveStoredData('eh_bookings', bookingsDB);

    auditService.log(
      actor,
      'Recorded Payment',
      'Finance',
      id,
      `Recorded financial update for ${finalBooking.clientName}. Total billing is ₹${finalBooking.billingAmount}, deposit received: ₹${finalBooking.depositReceived}`,
      JSON.stringify(oldBooking),
      JSON.stringify(finalBooking)
    );

    return {
      success: true,
      message: 'Financial details recorded in ledger.',
      data: finalBooking
    };
  }
};

export const beoService = {
  getBEOByBookingId: async (bookingId: string): Promise<ApiResponse<BEO | null>> => {
    await delay();
    const storedBEOs = getStoredData<BEO[]>('eh_beos', []);
    const beo = storedBEOs.find(b => b.bookingId === bookingId);
    
    if (!beo) {
      // Create empty draft BEO based on booking details
      bookingsDB = getStoredData<Booking[]>('eh_bookings', INITIAL_BOOKINGS);
      const booking = bookingsDB.find(b => b.id === bookingId);
      if (!booking) return { success: false, message: 'Booking not found', data: null };

      const defaultBEO: BEO = {
        id: `beo-${Date.now()}`,
        bookingId: bookingId,
        version: 'v1.0',
        status: 'Draft',
        clientProfile: {
          clientName: booking.clientName,
          eventType: booking.eventType,
          guestCount: booking.guestCount,
          venueName: booking.venueName,
        },
        timeline: [
          { id: '1', start: '18:00', end: '19:30', activity: 'Welcome Cocktails & Canapés' },
          { id: '2', start: '19:30', end: '21:30', activity: 'Main 4-Course Dinner Service' }
        ],
        foodAndBeverage: {
          horsDoeuvres: ['Truffle Arancini with Saffron Aioli', 'Smoked Salmon Blinis with Caviar'],
          mainEntrees: ['Slow-Roasted Wagyu Beef Short Rib', 'Pan-Seared Sea Bass with Asparagus'],
          specialDietary: 'Provide 12 Vegan and 5 Gluten-Free substitutes.',
          selectedPackage: 'Platinum Signature Dining'
        },
        decorAndSetup: {
          tableRunners: 'White Silk Table Runners',
          runnerUnits: 45,
          chairs: 'Gold Chiavari Chairs',
          chairUnits: 150
        },
        avRequirements: {
          projector: true,
          wirelessMicUnits: 2
        },
        estimatedTotal: booking.billingAmount || 42500,
        createdAt: new Date().toISOString(),
        createdBy: 'Sales Mgr',
        updatedAt: new Date().toISOString(),
        updatedBy: 'Sales Mgr',
        versions: [
          { version: 'v1.0', actor: 'Sales Mgr', timestamp: new Date().toISOString(), notes: 'Initial Draft Created', data: JSON.stringify({ timeline: [], foodAndBeverage: {} }) }
        ],
        approvals: []
      };

      storedBEOs.push(defaultBEO);
      saveStoredData('eh_beos', storedBEOs);
      return { success: true, message: 'New BEO draft created', data: defaultBEO };
    }

    return {
      success: true,
      message: 'BEO retrieved successfully',
      data: beo
    };
  },

  saveBEO: async (beo: BEO, actor: string, changeNotes = 'Updated elements'): Promise<ApiResponse<BEO>> => {
    await delay();
    const storedBEOs = getStoredData<BEO[]>('eh_beos', []);
    const index = storedBEOs.findIndex(b => b.id === beo.id);

    const prevVersionFloat = parseFloat(beo.version.replace('v', '')) || 1.0;
    const newVersionStr = `v${(prevVersionFloat + 0.1).toFixed(1)}`;

    const newVersionRecord = {
      version: newVersionStr,
      actor,
      timestamp: new Date().toISOString(),
      notes: changeNotes,
      data: JSON.stringify(beo)
    };

    const versions = beo.versions || [];
    const updatedBEO = {
      ...beo,
      version: newVersionStr,
      versions: [newVersionRecord, ...versions],
      updatedAt: new Date().toISOString(),
      updatedBy: actor
    };

    if (index === -1) {
      storedBEOs.push(updatedBEO);
    } else {
      storedBEOs[index] = updatedBEO;
    }

    saveStoredData('eh_beos', storedBEOs);
    auditService.log(actor, 'Modified BEO', 'BEO', beo.id, `Saved BEO details for ${beo.clientProfile.clientName} as ${newVersionStr}`, beo.version, newVersionStr);

    return {
      success: true,
      message: 'BEO details saved successfully',
      data: updatedBEO
    };
  },

  cloneBEO: async (beoId: string, actor: string): Promise<ApiResponse<BEO>> => {
    await delay();
    const storedBEOs = getStoredData<BEO[]>('eh_beos', []);
    const sourceBEO = storedBEOs.find(b => b.id === beoId);
    if (!sourceBEO) throw new Error('BEO not found');

    const cloned: BEO = {
      ...sourceBEO,
      id: `beo-${Date.now()}`,
      version: 'v1.0',
      status: 'Draft',
      createdAt: new Date().toISOString(),
      createdBy: actor,
      updatedAt: new Date().toISOString(),
      updatedBy: actor,
      versions: [
        { version: 'v1.0', actor, timestamp: new Date().toISOString(), notes: 'Cloned from ' + sourceBEO.id, data: JSON.stringify(sourceBEO) }
      ],
      approvals: []
    };

    storedBEOs.push(cloned);
    saveStoredData('eh_beos', storedBEOs);
    auditService.log(actor, 'Cloned BEO', 'BEO', cloned.id, `Cloned BEO #${sourceBEO.id.slice(4, 9).toUpperCase()} to new draft BEO #${cloned.id.slice(4, 9).toUpperCase()}`);

    return { success: true, message: 'BEO Cloned successfully', data: cloned };
  },

  autoSaveBEO: async (beo: BEO, actor: string): Promise<ApiResponse<BEO>> => {
    // Immediate, no synthetic delay for background auto-saving
    const storedBEOs = getStoredData<BEO[]>('eh_beos', []);
    const index = storedBEOs.findIndex(b => b.id === beo.id);
    if (index === -1) return { success: false, message: 'Not found', data: beo };

    const updated = {
      ...beo,
      updatedAt: new Date().toISOString(),
      updatedBy: actor
    };

    storedBEOs[index] = updated;
    saveStoredData('eh_beos', storedBEOs);
    return { success: true, message: 'Auto saved in background', data: updated };
  },

  updateBEOStatus: async (id: string, status: BEO['status'], actor: string): Promise<ApiResponse<BEO>> => {
    await delay();
    const storedBEOs = getStoredData<BEO[]>('eh_beos', []);
    const index = storedBEOs.findIndex(b => b.id === id);
    if (index === -1) throw new Error('BEO not found');

    const oldStatus = storedBEOs[index].status;
    const updated = {
      ...storedBEOs[index],
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: actor
    };

    storedBEOs[index] = updated;
    saveStoredData('eh_beos', storedBEOs);
    auditService.log(actor, 'Approved BEO', 'BEO', id, `Updated BEO status to ${status}`, oldStatus, status);

    return {
      success: true,
      message: `BEO Status updated to ${status}`,
      data: updated
    };
  }
};

export const auditService = {
  getLogs: async (): Promise<ApiResponse<AuditLog[]>> => {
    await delay(100);
    const fileLogs = getStoredData<AuditLog[]>('eh_audit', INITIAL_AUDIT_LOGS);
    const combined = [...fileLogs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return {
      success: true,
      message: 'Audit logs retrieved',
      data: combined
    };
  },

  log: (actor: string, action: string, type: string, resId: string, desc: string, oldVal = '', newVal = '') => {
    const logs = getStoredData<AuditLog[]>('eh_audit', INITIAL_AUDIT_LOGS);
    const newLog: AuditLog = {
      id: `a-${Date.now()}`,
      actor,
      role: actor,
      action,
      resourceType: type,
      resourceId: resId,
      details: desc,
      timestamp: new Date().toISOString(),
      oldValue: oldVal,
      newValue: newVal
    };
    logs.unshift(newLog);
    saveStoredData('eh_audit', logs);
    
    // Dispatch system audit notification triggers locally
    const systemNotif = {
      id: Date.now(),
      type: 'info',
      title: `${action} logged`,
      desc: desc,
      time: 'Just now',
      unread: true
    };
    // Save system alerts dynamically to trigger operations stream
    const currentAlerts = getStoredData<any[]>('eh_session_notifications', []);
    currentAlerts.unshift(systemNotif);
    saveStoredData('eh_session_notifications', currentAlerts);
  }
};

export const kitchenService = {
  getKOTs: async (): Promise<ApiResponse<KOTItem[]>> => {
    await delay(100);
    const storedKOTs = getStoredData<KOTItem[]>('eh_kots', INITIAL_KOTS);
    return {
      success: true,
      message: 'KOTs loaded',
      data: storedKOTs
    };
  },
  
  dispatchKOT: async (id: string, actor: string): Promise<ApiResponse<null>> => {
    await delay();
    const storedKOTs = getStoredData<KOTItem[]>('eh_kots', INITIAL_KOTS);
    const index = storedKOTs.findIndex(k => k.id === id);
    if (index !== -1) {
      storedKOTs[index].status = 'COMPLETED';
      saveStoredData('eh_kots', storedKOTs);
      auditService.log(actor, 'Dispatched KOT', 'Operations', id, `Dispatched food tray for KOT ${storedKOTs[index].kotNumber}`);
    }
    return { success: true, message: 'KOT food dispatched', data: null };
  },

  escalateKOT: async (id: string, actor: string): Promise<ApiResponse<null>> => {
    await delay();
    const storedKOTs = getStoredData<KOTItem[]>('eh_kots', INITIAL_KOTS);
    const index = storedKOTs.findIndex(k => k.id === id);
    if (index !== -1) {
      storedKOTs[index].status = 'DELAYED';
      storedKOTs[index].bottleneck = 'Grill Station bottleneck';
      saveStoredData('eh_kots', storedKOTs);
      auditService.log(actor, 'Escalated KOT', 'Operations', id, `Escalated delayed service for KOT ${storedKOTs[index].kotNumber}`);
    }
    return { success: true, message: 'KOT escalated to Head Chef', data: null };
  }
};

export const guestService = {
  getGuests: async (search?: string, rsvp?: string): Promise<ApiResponse<Guest[]>> => {
    await delay(100);
    const storedGuests = getStoredData<Guest[]>('eh_guests', INITIAL_GUESTS);
    let filtered = [...storedGuests];

    if (search) {
      filtered = filtered.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || g.eventName.toLowerCase().includes(search.toLowerCase()));
    }
    if (rsvp && rsvp !== 'All') {
      filtered = filtered.filter(g => g.rsvp === rsvp);
    }

    return { success: true, message: 'Guests retrieved', data: filtered };
  },

  createGuest: async (guest: Omit<Guest, 'id'>, actor: string): Promise<ApiResponse<Guest>> => {
    await delay();
    const storedGuests = getStoredData<Guest[]>('eh_guests', INITIAL_GUESTS);
    const newGuest: Guest = {
      ...guest,
      id: `g-${Date.now()}`
    };
    storedGuests.push(newGuest);
    saveStoredData('eh_guests', storedGuests);
    auditService.log(actor, 'Added Guest', 'Guest', newGuest.id, `Registered guest ${newGuest.name} for ${newGuest.eventName}`);
    return { success: true, message: 'Guest added successfully', data: newGuest };
  },

  updateGuestSeating: async (id: string, tableNumber: string, actor: string): Promise<ApiResponse<Guest>> => {
    await delay(100);
    const storedGuests = getStoredData<Guest[]>('eh_guests', INITIAL_GUESTS);
    const index = storedGuests.findIndex(g => g.id === id);
    if (index === -1) throw new Error('Guest not found');

    const oldSeating = storedGuests[index].tableNumber;
    const updated = {
      ...storedGuests[index],
      tableNumber
    };

    storedGuests[index] = updated;
    saveStoredData('eh_guests', storedGuests);
    auditService.log(actor, 'Guest Seating Assigned', 'Guest', id, `Re-assigned guest ${updated.name} seating from ${oldSeating} to ${tableNumber}`);
    
    return { success: true, message: 'Guest seating updated', data: updated };
  },

  importBulkGuests: async (importedGuests: Omit<Guest, 'id'>[], actor: string): Promise<ApiResponse<Guest[]>> => {
    await delay(1000); // realistic load loop
    const storedGuests = getStoredData<Guest[]>('eh_guests', INITIAL_GUESTS);
    const parsed: Guest[] = importedGuests.map((g, idx) => ({
      ...g,
      id: `g-imported-${Date.now()}-${idx}`
    }));
    
    const combined = [...storedGuests, ...parsed];
    saveStoredData('eh_guests', combined);
    auditService.log(actor, 'Imported Guests', 'Guest', 'Bulk', `Bulk imported ${parsed.length} guests into database ledger.`);
    
    return { success: true, message: `Successfully imported ${parsed.length} guests.`, data: parsed };
  }
};

export const documentService = {
  getDocuments: async (search?: string, type?: string): Promise<ApiResponse<VaultDocument[]>> => {
    await delay(100);
    const storedDocs = getStoredData<VaultDocument[]>('eh_documents', INITIAL_DOCUMENTS);
    let filtered = [...storedDocs];

    if (search) {
      filtered = filtered.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (type && type !== 'All') {
      filtered = filtered.filter(d => d.type === type);
    }

    return { success: true, message: 'Documents retrieved', data: filtered };
  },

  requestESignature: async (docId: string, actor: string): Promise<ApiResponse<VaultDocument>> => {
    await delay();
    const storedDocs = getStoredData<VaultDocument[]>('eh_documents', INITIAL_DOCUMENTS);
    const index = storedDocs.findIndex(d => d.id === docId);
    if (index === -1) throw new Error('Document not found');

    const oldStatus = storedDocs[index].status;
    const updated = {
      ...storedDocs[index],
      status: 'Signed' as const,
      versions: [
        { version: `v${parseFloat(storedDocs[index].versions[0].version.slice(1)) + 1.0}`, author: actor, time: 'Just now', active: true },
        ...storedDocs[index].versions.map(v => ({ ...v, active: false }))
      ]
    };

    storedDocs[index] = updated;
    saveStoredData('eh_documents', storedDocs);
    auditService.log(actor, 'Signed Document', 'Document', docId, `Request signed and approved: ${updated.name}`, oldStatus, 'Signed');
    return { success: true, message: 'e-Signature completed successfully', data: updated };
  },

  updateDocumentStatus: async (docId: string, status: VaultDocument['status'], actor: string): Promise<ApiResponse<VaultDocument>> => {
    await delay();
    const storedDocs = getStoredData<VaultDocument[]>('eh_documents', INITIAL_DOCUMENTS);
    const index = storedDocs.findIndex(d => d.id === docId);
    if (index === -1) throw new Error('Document not found');

    const oldStatus = storedDocs[index].status;
    const updated = {
      ...storedDocs[index],
      status
    };

    storedDocs[index] = updated;
    saveStoredData('eh_documents', storedDocs);
    auditService.log(actor, 'Document Status Shift', 'Document', docId, `Shifted contract status for ${updated.name} to ${status}`, oldStatus, status);
    
    return { success: true, message: 'Document updated', data: updated };
  }
};

export const approvalService = {
  getApprovalSteps: async (): Promise<ApiResponse<BEOApprovalStep[]>> => {
    await delay(100);
    const storedSteps = getStoredData<BEOApprovalStep[]>('eh_approval_steps', INITIAL_APPROVAL_STEPS);
    return { success: true, message: 'Approval steps loaded', data: storedSteps };
  },

  submitDecision: async (stepId: string, status: 'Approved' | 'Rejected', comments: string, actor: string): Promise<ApiResponse<BEOApprovalStep>> => {
    await delay();
    const storedSteps = getStoredData<BEOApprovalStep[]>('eh_approval_steps', INITIAL_APPROVAL_STEPS);
    const index = storedSteps.findIndex(s => s.id === stepId);
    if (index === -1) throw new Error('Approval step not found');

    const updated = {
      ...storedSteps[index],
      status,
      comments,
      reviewerName: actor,
      updatedAt: new Date().toISOString()
    };

    storedSteps[index] = updated;
    saveStoredData('eh_approval_steps', storedSteps);
    auditService.log(actor, `${status} BEO Step`, 'BEOApproval', stepId, `${status} BEO approval request as ${updated.role}. Comments: ${comments}`);
    return { success: true, message: `BEO review recorded as ${status}`, data: updated };
  }
};

export const taskService = {
  getTasks: async (bookingId?: string, roleAssigned?: string): Promise<ApiResponse<Task[]>> => {
    await delay(100);
    let stored = getStoredData<Task[]>('eh_tasks', INITIAL_TASKS);
    if (bookingId) {
      stored = stored.filter(t => t.bookingId === bookingId);
    }
    if (roleAssigned) {
      stored = stored.filter(t => t.roleAssigned === roleAssigned);
    }
    return { success: true, message: 'Tasks retrieved', data: stored };
  },
  
  createTask: async (task: { bookingId: string; title: string; roleAssigned: string; dueDate: string }, actor: string): Promise<ApiResponse<Task>> => {
    await delay(100);
    const stored = getStoredData<Task[]>('eh_tasks', INITIAL_TASKS);
    const newTask = {
      ...task,
      id: `task-${Date.now()}`,
      completed: false,
      autoTriggered: false
    };
    stored.push(newTask);
    saveStoredData('eh_tasks', stored);
    auditService.log(actor, 'Created Task', 'Task', newTask.id, `Created task: ${newTask.title} for ${newTask.roleAssigned}`);
    return { success: true, message: 'Task created', data: newTask };
  },

  toggleTaskCompleted: async (id: string, actor: string): Promise<ApiResponse<Task>> => {
    await delay(100);
    const stored = getStoredData<Task[]>('eh_tasks', INITIAL_TASKS);
    const idx = stored.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Task not found');
    stored[idx].completed = !stored[idx].completed;
    saveStoredData('eh_tasks', stored);
    auditService.log(actor, 'Toggle Task', 'Task', id, `Toggled completion state of task: ${stored[idx].title} to ${stored[idx].completed}`);
    return { success: true, message: 'Task completion toggled', data: stored[idx] };
  }
};
