export type Role = "ROLE_USER" | "ROLE_ADMIN";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  currency: Currency;
  dailyLimit: number;
  createdAt: string;
  active: boolean;
  avatarUrl?: string;
}

export type Currency = "EUR" | "USD" | "GBP" | "INR" | "ALL" | "MKD";

/** Local persistence / sync state of an entity. */
export type SyncStatus = "LOCAL" | "PENDING" | "SYNCED" | "FAILED";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  active: boolean;
  // Sync metadata (optional in the public contract; managed by repositories).
  serverId?: string;
  updatedAt?: string;
  deletedAt?: string;
  version?: number;
  syncStatus?: SyncStatus;
}

export interface Expense {
  id: string;
  userId: string;
  productName: string;
  /** Major-unit decimal for the UI. Stored as integer minor units in SQLite. */
  amount: number;
  currency: Currency;
  categoryId: string;
  notes?: string;
  /** UTC ISO business date of the expense. */
  expenseDate: string;
  /** UTC ISO creation timestamp. */
  createdAt: string;
  // Sync metadata (optional in the public contract; managed by repositories).
  serverId?: string;
  updatedAt?: string;
  deletedAt?: string;
  version?: number;
  syncStatus?: SyncStatus;
  deviceId?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
