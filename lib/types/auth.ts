import type { UserRole } from "./hierarchy";

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  accessLevel: number;
  dailyAnalysisLimit: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  dailyUsageDate?: string;
  dailyUsageCount?: number;
  department?: string;
};

export type CurrentUserSession = Pick<
  UserProfile,
  | "uid"
  | "email"
  | "displayName"
  | "role"
  | "accessLevel"
  | "dailyAnalysisLimit"
  | "dailyUsageDate"
  | "dailyUsageCount"
  | "active"
  | "department"
>;

export type AuthBootstrapRequest = {
  displayName: string;
  bootstrapKey: string;
};

export type CreateUserRequest = {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  accessLevel?: number;
  dailyAnalysisLimit?: number;
  department?: string;
};

export type CreateUserResponse = {
  user: UserProfile;
};
