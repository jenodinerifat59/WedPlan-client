export const SERVICE_CATEGORIES = [
  "Photography & Videography",
  "Wedding Venues",
  "Decoration & Florist",
  "Catering Services",
  "Makeup & Styling",
  "Wedding Fashion",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export type Role = "customer" | "vendor" | "admin";
export type SubscriptionPlan = "free" | "premium";
export type ServiceStatus = "pending" | "approved" | "rejected";
export type BookingStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type TransactionStatus = "pending" | "completed" | "failed" | "refunded";

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  isBlocked: boolean;
  businessName?: string | null;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt?: string | null;
  createdAt?: string;
}

export interface VendorSummary {
  id: string;
  name: string;
  businessName?: string | null;
  image?: string | null;
  email?: string;
}

export interface Service {
  id: string;
  vendorId: string;
  serviceName: string;
  category: ServiceCategory;
  description: string;
  price: number;
  location: string;
  images: string[];
  status: ServiceStatus;
  isActive: boolean;
  createdAt: string;
  vendor?: VendorSummary;
}

export interface Booking {
  id: string;
  serviceId: string;
  vendorId: string;
  customerId: string;
  eventDate: string;
  eventLocation: string;
  message: string;
  status: BookingStatus;
  createdAt: string;
  service?: Service;
  customer?: VendorSummary;
  vendor?: VendorSummary;
}

export interface Transaction {
  id: string;
  vendorId: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  stripeSessionId: string;
  stripeSubscriptionId?: string | null;
  status: TransactionStatus;
  createdAt: string;
  vendor?: VendorSummary;
}

export interface ApiListResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

export interface ServiceFilters {
  q?: string;
  category?: ServiceCategory | "all";
  location?: string;
  sort?: "price_asc" | "price_desc" | "newest";
  page?: number;
  limit?: number;
  status?: ServiceStatus | "all";
  isActive?: boolean;
}

export interface CreateServiceInput {
  serviceName: string;
  category: ServiceCategory;
  description: string;
  price: number;
  location: string;
  images: string[];
}

export interface CreateBookingInput {
  serviceId: string;
  eventDate: string;
  eventLocation: string;
  message: string;
}

export interface ProfileUpdateInput {
  name?: string;
  image?: string;
  businessName?: string;
}

export interface DashboardStats {
  totalServices?: number;
  activeServices?: number;
  pendingBookings?: number;
  acceptedBookings?: number;
  rejectedBookings?: number;
  totalBookings?: number;
  totalUsers?: number;
  totalVendors?: number;
  totalCustomers?: number;
  totalTransactions?: number;
  pendingServices?: number;
}
