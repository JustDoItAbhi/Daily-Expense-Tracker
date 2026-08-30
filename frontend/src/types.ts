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

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  active: boolean;
}

export interface Expense {
  id: string;
  userId: string;
  productName: string;
  amount: number;
  currency: Currency;
  categoryId: string;
  notes?: string;
  expenseDate: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
