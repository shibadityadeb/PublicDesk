// ==================== Enums ====================

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  SUPERVISOR = "SUPERVISOR",
  OFFICER = "OFFICER",
  CITIZEN = "CITIZEN",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
}

export enum AppointmentStatus {
  SCHEDULED = "SCHEDULED",
  CONFIRMED = "CONFIRMED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export enum TokenStatus {
  WAITING = "WAITING",
  CALLED = "CALLED",
  IN_SERVICE = "IN_SERVICE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export enum OfficeStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  MAINTENANCE = "MAINTENANCE",
}

export enum CounterStatus {
  AVAILABLE = "AVAILABLE",
  BUSY = "BUSY",
  ON_BREAK = "ON_BREAK",
  OFFLINE = "OFFLINE",
}

export enum ServiceStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export enum Priority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

// ==================== Entities ====================

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  profilePicture?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Office {
  id: string;
  name: string;
  code: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  status: OfficeStatus;
  openingTime: string;
  closingTime: string;
  workingDays: string[];
  maxCapacity: number;
  currentCapacity: number;
  createdAt: string;
}

export interface Counter {
  id: string;
  number: number;
  name: string;
  status: CounterStatus;
  officeId: string;
  office?: Office;
  currentOfficerId?: string;
  serviceId?: string;
}

export interface Service {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: string;
  status: ServiceStatus;
  estimatedDuration: number;
  maxDailyCapacity: number;
  requiresAppointment: boolean;
  requiresDocuments: boolean;
  documentList?: string[];
  fees: number;
  officeId: string;
  office?: Office;
}

export interface Appointment {
  id: string;
  appointmentNumber: string;
  citizenId: string;
  citizen?: User;
  serviceId: string;
  service?: Service;
  officeId: string;
  office?: Office;
  scheduledDate: string;
  scheduledTime: string;
  status: AppointmentStatus;
  priority: Priority;
  notes?: string;
  cancellationReason?: string;
  tokenId?: string;
  checkedInAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Token {
  id: string;
  tokenNumber: string;
  qrCode: string;
  qrData: string;
  status: TokenStatus;
  priority: Priority;
  appointmentId?: string;
  citizenId: string;
  citizen?: User;
  officeId: string;
  office?: Office;
  serviceId: string;
  service?: Service;
  counterId?: string;
  counterNumber?: number;
  calledAt?: string;
  servedAt?: string;
  completedAt?: string;
  estimatedWaitTime?: number;
  actualWaitTime?: number;
  notes?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  status: string;
  recipientId: string;
  subject: string;
  body: string;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

// ==================== API Response Types ====================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedApiResponse<T> extends ApiResponse<PaginatedResponse<T>> {}

// ==================== Auth Types ====================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ==================== Analytics Types ====================

export interface DashboardMetrics {
  totalTokens: number;
  todayTokens: number;
  completedTokens: number;
  waitingTokens: number;
  totalAppointments: number;
  todayAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  completionRate: number;
  cancelRate: number;
  avgWaitTime: string;
}

export interface QueueStatus {
  waiting: number;
  called: number;
  inService: number;
  completedToday: number;
  avgWaitTime: number;
  estimatedNewWait: number;
}
