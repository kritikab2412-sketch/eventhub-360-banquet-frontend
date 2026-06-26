export type SpaceType = 'Indoor' | 'Outdoor' | 'Hybrid';
export type VenueStatus = 'Active' | 'Maintenance';

export interface HallConfig {
  layoutsAllowed: string[];
  amenities: string[];
}

export interface Venue {
  id: string;
  name: string;
  maxCapacity: number;
  locationType: SpaceType;
  status: VenueStatus;
  features: string[];
  lastInspection: string;
  image: string;
  maintenanceNote?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type BookingStatus = 
  | 'Inquiry'
  | 'Tentative'
  | 'Confirmed'
  | 'BEO Draft'
  | 'BEO Approved'
  | 'In Progress'
  | 'Completed'
  | 'Archived'
  | 'Blocked';

export interface BookingLifecycleStep {
  status: BookingStatus;
  actor: string;
  timestamp: string;
  note?: string;
}

export interface Booking {
  id: string;
  clientName: string;
  eventType: string;
  guestCount: number;
  venueId: string;
  venueName: string;
  date: string; // YYYY-MM-DD
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  setupTime?: string; // HH:MM
  status: BookingStatus;
  billingAmount: number;
  paidAmount: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  
  // Financial metrics
  depositRequired: number;
  depositReceived: number;
  balanceDue: number;
  refundedAmount: number;
  overdue: boolean;
  paymentStatus: 'Unpaid' | 'Deposit Paid' | 'Fully Paid' | 'Refunded' | 'Overdue';
  
  // Operational timelines
  lifecycleHistory?: BookingLifecycleStep[];
}

export type BEOStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Published';

export interface TimelineSlot {
  id: string;
  start: string;
  end: string;
  activity: string;
}

export interface FoodSelection {
  horsDoeuvres: string[];
  mainEntrees: string[];
  specialDietary: string;
  selectedPackage: string;
}

export interface DecorSetup {
  tableRunners: string;
  runnerUnits: number;
  chairs: string;
  chairUnits: number;
}

export interface AVRequirement {
  projector: boolean;
  wirelessMicUnits: number;
}

export interface BEOVersion {
  version: string;
  actor: string;
  timestamp: string;
  notes?: string;
  data: string; // stringified BEO details or sub-state
}

export interface BEOApprovalHistory {
  role: string;
  actor: string;
  status: 'Approved' | 'Rejected' | 'Pending';
  comments?: string;
  timestamp: string;
}

export interface BEO {
  id: string;
  bookingId: string;
  version: string;
  status: BEOStatus;
  clientProfile: {
    clientName: string;
    eventType: string;
    guestCount: number;
    venueName: string;
  };
  timeline: TimelineSlot[];
  foodAndBeverage: FoodSelection;
  decorAndSetup: DecorSetup;
  avRequirements: AVRequirement;
  estimatedTotal: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  
  // Extended history tracking
  versions?: BEOVersion[];
  approvals?: BEOApprovalHistory[];
}

export type KOTStatus = 'IN PREP' | 'DELAYED' | 'DISPATCHED' | 'COMPLETED';

export interface KOTItem {
  id: string;
  kotNumber: string;
  tableRange: string;
  pax: number;
  itemName: string;
  timeStarted: string; // HH:MM:SS or timestamp
  durationSeconds: number;
  status: KOTStatus;
  chefAssigned: string;
  bottleneck?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'busy' | 'offline';
  avatar: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  role: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  timestamp: string;
  
  // Diff verification fields
  oldValue?: string;
  newValue?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  cost: number;
  price: number;
  category: 'Hors D\'oeuvres' | 'Main Entrees' | 'Desserts' | 'Beverages';
  dietaryNotes: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  errors?: string[];
}

export interface Guest {
  id: string;
  name: string;
  eventName: string;
  rsvp: 'Confirmed' | 'Pending' | 'Declined';
  accommodation: string;
  transport: string;
  meal: string;
  
  // Seating and VIP parameters
  isVIP: boolean;
  tableNumber: string;
  dietaryAlerts: string[];
  transportAssigned?: string;
  accommodationAssigned?: string;
}

export interface DocumentVersion {
  version: string;
  author: string;
  time: string;
  active?: boolean;
}

export interface VaultDocument {
  id: string;
  name: string;
  type: 'Contract' | 'BEO' | 'Quotation' | 'Proposal';
  size: string;
  format: string;
  expiresInDays: number;
  status: 'Signed' | 'Pending e-Signature' | 'Draft' | 'Sent' | 'Viewed' | 'Completed' | 'Archived';
  versions: DocumentVersion[];
  createdAt: string;
}

export interface BEOApprovalStep {
  id: string;
  role: string;
  reviewerName: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  comments?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  bookingId: string;
  title: string;
  roleAssigned: string;
  completed: boolean;
  dueDate: string;
  autoTriggered: boolean;
}
