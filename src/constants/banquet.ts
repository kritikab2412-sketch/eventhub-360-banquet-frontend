import { Venue, Booking, MenuItem, KOTItem, Staff, AuditLog, Guest, VaultDocument, BEOApprovalStep } from '../types/banquet';

export const THEME_COLORS = {
  primary: '#9e2a2b',       // Deep Burgundy
  primaryHover: '#bd3a42',
  secondaryActive: '#ffe5e5', // Soft Pink
  bgGray: '#f8f9fa',
  borderLight: '#eef0f2',
  textDark: '#1e293b',
  textSecondary: '#64748b',
};

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Banquet Mgr': ['view_dashboard', 'manage_venues', 'manage_bookings', 'manage_beo', 'manage_ops', 'view_billing'],
  'Sales Mgr': ['view_dashboard', 'manage_bookings', 'manage_beo', 'view_venues', 'view_billing'],
  'Kitchen Mgr': ['view_dashboard', 'view_beo', 'manage_ops'],
  'Finance': ['view_dashboard', 'view_beo', 'view_billing', 'manage_billing'],
};

export const INITIAL_VENUES: Venue[] = [
  {
    id: 'venue-1',
    name: 'Imperial Grand Ballroom',
    maxCapacity: 1200,
    locationType: 'Indoor',
    status: 'Active',
    features: ['Fiber Wi-Fi', 'Atmos Sound', 'RGB Ceiling'],
    lastInspection: '2 days ago',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600',
    createdAt: '2026-06-10T09:00:00Z',
    createdBy: 'Banquet Mgr',
    updatedAt: '2026-06-17T14:30:00Z',
    updatedBy: 'Banquet Mgr'
  },
  {
    id: 'venue-2',
    name: 'Zenith Sky Terrace',
    maxCapacity: 450,
    locationType: 'Outdoor',
    status: 'Maintenance',
    features: ['Bar Setup', 'Outdoor Heaters'],
    lastInspection: '5 days ago',
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=600',
    maintenanceNote: 'Elevator repair in progress',
    createdAt: '2026-06-11T10:00:00Z',
    createdBy: 'Banquet Mgr',
    updatedAt: '2026-06-19T08:00:00Z',
    updatedBy: 'Banquet Mgr'
  },
  {
    id: 'venue-3',
    name: 'Royal Dining Wing',
    maxCapacity: 120,
    locationType: 'Indoor',
    status: 'Active',
    features: ['Prep Station', 'Private Entry'],
    lastInspection: '1 day ago',
    image: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=600',
    createdAt: '2026-06-12T11:00:00Z',
    createdBy: 'Banquet Mgr',
    updatedAt: '2026-06-18T10:00:00Z',
    updatedBy: 'Banquet Mgr'
  },
  {
    id: 'venue-4',
    name: 'Emerald Pavilion',
    maxCapacity: 250,
    locationType: 'Hybrid',
    status: 'Active',
    features: ['Pool View', 'Ambient Lighting'],
    lastInspection: 'Yesterday',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=600',
    createdAt: '2026-06-14T08:30:00Z',
    createdBy: 'Banquet Mgr',
    updatedAt: '2026-06-18T16:00:00Z',
    updatedBy: 'Banquet Mgr'
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'booking-1',
    clientName: 'Miller Wedding',
    eventType: 'Wedding',
    guestCount: 150,
    venueId: 'venue-3',
    venueName: 'Royal Dining Wing',
    date: '2024-09-01',
    startTime: '14:00',
    endTime: '22:00',
    status: 'Confirmed',
    billingAmount: 18000,
    paidAmount: 9000,
    notes: 'Gluten free requests',
    createdAt: '2026-06-15T09:00:00Z',
    createdBy: 'Sales Mgr',
    updatedAt: '2026-06-15T09:00:00Z',
    updatedBy: 'Sales Mgr',
    depositRequired: 9000,
    depositReceived: 9000,
    balanceDue: 9000,
    refundedAmount: 0,
    overdue: false,
    paymentStatus: 'Deposit Paid',
    lifecycleHistory: [
      { status: 'Inquiry', actor: 'Sales Mgr', timestamp: '2026-06-10T10:00:00Z', note: 'Initial client contact' },
      { status: 'Tentative', actor: 'Sales Mgr', timestamp: '2026-06-12T14:30:00Z', note: 'Date hold requested' },
      { status: 'Confirmed', actor: 'Sales Mgr', timestamp: '2026-06-15T09:00:00Z', note: 'Contract signed, deposit received' }
    ]
  },
  {
    id: 'booking-2',
    clientName: 'TechConf Annual Gala',
    eventType: 'Gala',
    guestCount: 600,
    venueId: 'venue-1',
    venueName: 'Imperial Grand Ballroom',
    date: '2024-09-03',
    startTime: '09:00',
    endTime: '17:00',
    status: 'Tentative',
    billingAmount: 45000,
    paidAmount: 5000,
    notes: 'Requires dual projectors',
    createdAt: '2026-06-16T10:00:00Z',
    createdBy: 'Sales Mgr',
    updatedAt: '2026-06-16T10:00:00Z',
    updatedBy: 'Sales Mgr',
    depositRequired: 22500,
    depositReceived: 5000,
    balanceDue: 40000,
    refundedAmount: 0,
    overdue: true,
    paymentStatus: 'Overdue',
    lifecycleHistory: [
      { status: 'Inquiry', actor: 'Sales Mgr', timestamp: '2026-06-14T09:00:00Z', note: 'Web form submission' },
      { status: 'Tentative', actor: 'Sales Mgr', timestamp: '2026-06-16T10:00:00Z', note: 'Tentative hold for main ballroom' }
    ]
  },
  {
    id: 'booking-3',
    clientName: 'Arts Foundation Gala',
    eventType: 'Gala',
    guestCount: 800,
    venueId: 'venue-1',
    venueName: 'Imperial Grand Ballroom',
    date: '2024-09-05',
    startTime: '18:00',
    endTime: '23:00',
    status: 'BEO Approved',
    billingAmount: 52000,
    paidAmount: 52000,
    notes: 'Premium bar setup needed',
    createdAt: '2026-06-15T11:00:00Z',
    createdBy: 'Sales Mgr',
    updatedAt: '2026-06-17T12:00:00Z',
    updatedBy: 'Banquet Mgr',
    depositRequired: 26000,
    depositReceived: 52000,
    balanceDue: 0,
    refundedAmount: 0,
    overdue: false,
    paymentStatus: 'Fully Paid',
    lifecycleHistory: [
      { status: 'Inquiry', actor: 'Sales Mgr', timestamp: '2026-06-11T11:00:00Z' },
      { status: 'Tentative', actor: 'Sales Mgr', timestamp: '2026-06-13T10:00:00Z' },
      { status: 'Confirmed', actor: 'Sales Mgr', timestamp: '2026-06-15T11:00:00Z' },
      { status: 'BEO Draft', actor: 'Sales Mgr', timestamp: '2026-06-16T15:00:00Z' },
      { status: 'BEO Approved', actor: 'Banquet Mgr', timestamp: '2026-06-17T12:00:00Z', note: 'All stakeholders signed' }
    ]
  },
  {
    id: 'booking-4',
    clientName: 'Kitchen Maintenance Block',
    eventType: 'Maintenance',
    guestCount: 0,
    venueId: 'venue-1',
    venueName: 'Imperial Grand Ballroom',
    date: '2024-09-05',
    startTime: '14:00',
    endTime: '17:30',
    status: 'Blocked',
    billingAmount: 0,
    paidAmount: 0,
    notes: 'Exhaust fan servicing',
    createdAt: '2026-06-18T08:00:00Z',
    createdBy: 'Banquet Mgr',
    updatedAt: '2026-06-18T08:00:00Z',
    updatedBy: 'Banquet Mgr',
    depositRequired: 0,
    depositReceived: 0,
    balanceDue: 0,
    refundedAmount: 0,
    overdue: false,
    paymentStatus: 'Fully Paid'
  },
  {
    id: 'booking-5',
    clientName: 'Delta Brunch',
    eventType: 'Brunch',
    guestCount: 300,
    venueId: 'venue-2',
    venueName: 'Zenith Sky Terrace',
    date: '2024-09-08',
    startTime: '10:00',
    endTime: '15:00',
    status: 'Confirmed',
    billingAmount: 22000,
    paidAmount: 11000,
    createdAt: '2026-06-16T15:00:00Z',
    createdBy: 'Sales Mgr',
    updatedAt: '2026-06-16T15:00:00Z',
    updatedBy: 'Sales Mgr',
    depositRequired: 11000,
    depositReceived: 11000,
    balanceDue: 11000,
    refundedAmount: 0,
    overdue: false,
    paymentStatus: 'Deposit Paid',
    lifecycleHistory: [
      { status: 'Inquiry', actor: 'Sales Mgr', timestamp: '2026-06-14T10:00:00Z' },
      { status: 'Tentative', actor: 'Sales Mgr', timestamp: '2026-06-15T09:00:00Z' },
      { status: 'Confirmed', actor: 'Sales Mgr', timestamp: '2026-06-16T15:00:00Z' }
    ]
  },
  {
    id: 'booking-6',
    clientName: 'Realty Mixer',
    eventType: 'Cocktail',
    guestCount: 100,
    venueId: 'venue-3',
    venueName: 'Royal Dining Wing',
    date: '2024-09-10',
    startTime: '17:00',
    endTime: '21:00',
    status: 'Inquiry',
    billingAmount: 12000,
    paidAmount: 0,
    createdAt: '2026-06-17T09:00:00Z',
    createdBy: 'Sales Mgr',
    updatedAt: '2026-06-17T09:00:00Z',
    updatedBy: 'Sales Mgr',
    depositRequired: 6000,
    depositReceived: 0,
    balanceDue: 12000,
    refundedAmount: 0,
    overdue: false,
    paymentStatus: 'Unpaid',
    lifecycleHistory: [
      { status: 'Inquiry', actor: 'Sales Mgr', timestamp: '2026-06-17T09:00:00Z', note: 'Client requested info package' }
    ]
  },
  {
    id: 'booking-7',
    clientName: 'Corporate Dinner',
    eventType: 'Dinner',
    guestCount: 200,
    venueId: 'venue-4',
    venueName: 'Emerald Pavilion',
    date: '2024-09-13',
    startTime: '19:00',
    endTime: '23:00',
    status: 'Confirmed',
    billingAmount: 24000,
    paidAmount: 15000,
    createdAt: '2026-06-17T11:00:00Z',
    createdBy: 'Sales Mgr',
    updatedAt: '2026-06-17T11:00:00Z',
    updatedBy: 'Sales Mgr',
    depositRequired: 12000,
    depositReceived: 12000,
    balanceDue: 12000,
    refundedAmount: 0,
    overdue: false,
    paymentStatus: 'Deposit Paid',
    lifecycleHistory: [
      { status: 'Inquiry', actor: 'Sales Mgr', timestamp: '2026-06-15T11:00:00Z' },
      { status: 'Tentative', actor: 'Sales Mgr', timestamp: '2026-06-16T10:00:00Z' },
      { status: 'Confirmed', actor: 'Sales Mgr', timestamp: '2026-06-17T11:00:00Z' }
    ]
  }
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  { id: 'm-1', name: 'Truffle Arancini with Saffron Aioli', cost: 3.50, price: 9.00, category: 'Hors D\'oeuvres', dietaryNotes: ['Vegetarian'] },
  { id: 'm-2', name: 'Smoked Salmon Blinis with Caviar', cost: 5.00, price: 14.00, category: 'Hors D\'oeuvres', dietaryNotes: ['Pescatarian'] },
  { id: 'm-3', name: 'Slow-Roasted Wagyu Beef Short Rib', cost: 15.00, price: 38.00, category: 'Main Entrees', dietaryNotes: ['Gluten-Free'] },
  { id: 'm-4', name: 'Pan-Seared Sea Bass with Asparagus', cost: 12.00, price: 32.00, category: 'Main Entrees', dietaryNotes: ['Gluten-Free', 'Pescatarian'] },
  { id: 'm-5', name: 'Truffle Gnocchi', cost: 6.00, price: 18.00, category: 'Main Entrees', dietaryNotes: ['Vegetarian'] },
  { id: 'm-6', name: 'Chocolate Lava Fondant', cost: 3.00, price: 9.50, category: 'Desserts', dietaryNotes: ['Vegetarian'] },
  { id: 'm-7', name: 'Artisan Fruit & Cheese Platter', cost: 4.50, price: 12.00, category: 'Desserts', dietaryNotes: ['Vegetarian', 'Gluten-Free'] },
  { id: 'm-8', name: 'Free-flow Cabernet Sauvignon & Chardonnay', cost: 8.00, price: 22.00, category: 'Beverages', dietaryNotes: ['Vegan', 'Gluten-Free'] },
  { id: 'm-9', name: 'Artisan Coffee & Organic Tea Bar', cost: 2.00, price: 6.00, category: 'Beverages', dietaryNotes: ['Vegan', 'Gluten-Free'] }
];

export const INITIAL_STAFF: Staff[] = [
  { id: 's-1', name: 'Chef Marco', role: 'Exec Chef • Grill', status: 'active', avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=150' },
  { id: 's-2', name: 'Sarah K.', role: 'Sous Chef • Pastry', status: 'active', avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=150' },
  { id: 's-3', name: 'Thomas J.', role: 'Junior • Prep', status: 'busy', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150' }
];

export const INITIAL_KOTS: KOTItem[] = [
  {
    id: 'kot-1',
    kotNumber: 'KOT #7721',
    tableRange: 'TABLE 12-18',
    pax: 45,
    itemName: 'Appetizer: Truffle Gnocchi',
    timeStarted: '2026-06-19T17:54:00Z',
    durationSeconds: 255, // 4 mins 15s elapsed
    status: 'IN PREP',
    chefAssigned: 'Chef Marco'
  },
  {
    id: 'kot-2',
    kotNumber: 'KOT #7725',
    tableRange: 'TABLE 42-50',
    pax: 60,
    itemName: 'Main: Roasted Wagyu',
    timeStarted: '2026-06-19T17:40:00Z',
    durationSeconds: 1128, // 18 mins 48s elapsed
    status: 'DELAYED',
    chefAssigned: 'Sarah K.',
    bottleneck: 'Grill Station bottleneck'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'a-1', actor: 'Banquet Mgr', role: 'Banquet Mgr', action: 'Created Space', resourceType: 'Venue', resourceId: 'venue-4', details: 'Added new venue space: Emerald Pavilion', timestamp: '2026-06-14T08:30:00Z' },
  { id: 'a-2', actor: 'Sales Mgr', role: 'Sales Mgr', action: 'Created Booking', resourceType: 'Booking', resourceId: 'booking-3', details: 'Placed tentative hold for Arts Foundation Gala (800 Pax)', timestamp: '2026-06-15T11:00:00Z' },
  { id: 'a-3', actor: 'Banquet Mgr', role: 'Banquet Mgr', action: 'Modified Layout', resourceType: 'Booking', resourceId: 'booking-3', details: 'Configured round seating and main stage on Imperial Grand Ballroom layout configurator', timestamp: '2026-06-17T12:00:00Z', oldValue: 'Empty coordinates', newValue: 'Round layout (T01-T06, Stage, Dance Floor)' },
  { id: 'a-4', actor: 'Sales Mgr', role: 'Sales Mgr', action: 'Approved BEO', resourceType: 'BEO', resourceId: 'beo-1', details: 'BEO #8842-A marked as approved by client', timestamp: '2026-06-18T10:15:00Z', oldValue: 'Pending Approval', newValue: 'Approved' }
];

export const INITIAL_GUESTS: Guest[] = [
  { id: 'g-1', name: 'Mr. Aditya Sen', eventName: 'Miller Wedding', rsvp: 'Confirmed', accommodation: 'Goa Resort Rm 101', transport: 'Driver Assigned', meal: 'Vegetarian', isVIP: true, tableNumber: 'Table 1', dietaryAlerts: ['Vegetarian'] },
  { id: 'g-2', name: 'Mrs. Kiran Sen', eventName: 'Miller Wedding', rsvp: 'Confirmed', accommodation: 'Goa Resort Rm 101', transport: 'Driver Assigned', meal: 'Vegetarian', isVIP: false, tableNumber: 'Table 1', dietaryAlerts: ['Vegetarian'] },
  { id: 'g-3', name: 'Dr. Michael Chen', eventName: 'TechConf Annual Gala', rsvp: 'Confirmed', accommodation: 'Goa Resort Rm 104', transport: 'Self Arrival', meal: 'No Preference', isVIP: true, tableNumber: 'Table 2', dietaryAlerts: [] },
  { id: 'g-4', name: 'Lady Diana Vance', eventName: 'Arts Foundation Gala', rsvp: 'Pending', accommodation: 'Awaiting Alloc.', transport: 'Flight Standby', meal: 'Gluten-Free', isVIP: true, tableNumber: 'Unassigned', dietaryAlerts: ['Gluten-Free', 'Nut-Free'] },
  { id: 'g-5', name: 'Lord Sterling Vance', eventName: 'Arts Foundation Gala', rsvp: 'Pending', accommodation: 'Awaiting Alloc.', transport: 'Flight Standby', meal: 'Gluten-Free', isVIP: true, tableNumber: 'Unassigned', dietaryAlerts: ['Gluten-Free'] },
  { id: 'g-6', name: 'Sophia Loren', eventName: 'Realty Mixer', rsvp: 'Confirmed', accommodation: 'Executive Suite 402', transport: 'VIP Benz Standby', meal: 'Vegan', isVIP: true, tableNumber: 'Table 3', dietaryAlerts: ['Vegan'] }
];

export const INITIAL_DOCUMENTS: VaultDocument[] = [
  {
    id: 'doc-1',
    name: 'proposal_wedding_miller.pdf',
    type: 'Proposal',
    size: '1.4 MB',
    format: 'PDF Document',
    expiresInDays: 30,
    status: 'Signed',
    versions: [
      { version: 'v2.0', author: 'Alex (Sales)', time: 'Today, 11:20 AM', active: true },
      { version: 'v1.1', author: 'Finance Reviewer', time: 'Yesterday, 3:45 PM' },
      { version: 'v1.0', author: 'Alex (Sales)', time: 'Jun 14, 2026' }
    ],
    createdAt: '2026-06-14T09:00:00Z'
  },
  {
    id: 'doc-2',
    name: 'catering_contract_techconf.pdf',
    type: 'Contract',
    size: '2.8 MB',
    format: 'PDF Document',
    expiresInDays: 45,
    status: 'Pending e-Signature',
    versions: [
      { version: 'v1.0', author: 'Alex (Sales)', time: 'Yesterday, 9:00 AM', active: true }
    ],
    createdAt: '2026-06-18T09:00:00Z'
  },
  {
    id: 'doc-3',
    name: 'quotation_gala_arts_v3.pdf',
    type: 'Quotation',
    size: '950 KB',
    format: 'PDF Document',
    expiresInDays: 12,
    status: 'Signed',
    versions: [
      { version: 'v3.0', author: 'Banquet Mgr', time: 'Jun 17, 2026', active: true },
      { version: 'v2.0', author: 'Sales Mgr', time: 'Jun 16, 2026' },
      { version: 'v1.0', author: 'Sales Mgr', time: 'Jun 15, 2026' }
    ],
    createdAt: '2026-06-15T11:00:00Z'
  }
];

export const INITIAL_APPROVAL_STEPS: BEOApprovalStep[] = [
  { id: 'step-1', role: 'Sales Mgr', reviewerName: 'Alex Johnson', status: 'Approved', comments: 'Client accepted catering package and seating configurations.', updatedAt: '2026-06-18T10:00:00Z' },
  { id: 'step-2', role: 'Banquet Mgr', reviewerName: 'Marc Sterling', status: 'Approved', comments: 'Egress paths cleared and layout capacity checks passed.', updatedAt: '2026-06-18T10:15:00Z' },
  { id: 'step-3', role: 'Kitchen Mgr', reviewerName: 'Chef Marco', status: 'Pending', comments: '' },
  { id: 'step-4', role: 'Finance', reviewerName: 'Sarah Vance', status: 'Pending', comments: '' }
];

export const INITIAL_TASKS = [
  { id: 'task-1', bookingId: 'booking-1', title: 'Verify Gold chairs setup', roleAssigned: 'Banquet Mgr', completed: true, dueDate: '2024-09-01', autoTriggered: false },
  { id: 'task-2', bookingId: 'booking-1', title: 'Prepare Gluten free entrees list', roleAssigned: 'Kitchen Mgr', completed: false, dueDate: '2024-09-01', autoTriggered: false },
  { id: 'task-3', bookingId: 'booking-2', title: 'Reconcile TechConf outstanding hold deposit', roleAssigned: 'Finance', completed: false, dueDate: '2024-09-03', autoTriggered: true }
];
