export type UserRole = "admin" | "manager" | "analyst" | "viewer";

export type RoleConfig = {
  role: UserRole;
  label: string;
  accessLevel: number;
  dailyAnalysisLimit: number;
  canManageUsers: boolean;
  canManageLibrary: boolean;
};

export const roleCatalog: Record<UserRole, RoleConfig> = {
  admin: {
    role: "admin",
    label: "Administrador",
    accessLevel: 100,
    dailyAnalysisLimit: 50,
    canManageUsers: true,
    canManageLibrary: true
  },
  manager: {
    role: "manager",
    label: "Gestor",
    accessLevel: 80,
    dailyAnalysisLimit: 30,
    canManageUsers: true,
    canManageLibrary: true
  },
  analyst: {
    role: "analyst",
    label: "Analista",
    accessLevel: 60,
    dailyAnalysisLimit: 20,
    canManageUsers: false,
    canManageLibrary: true
  },
  viewer: {
    role: "viewer",
    label: "Consulta",
    accessLevel: 20,
    dailyAnalysisLimit: 5,
    canManageUsers: false,
    canManageLibrary: false
  }
};

export const roleOptions = Object.values(roleCatalog);

export function getRoleConfig(role: UserRole): RoleConfig {
  return roleCatalog[role];
}

export function normalizeUserRole(role: unknown): UserRole {
  if (role === "admin" || role === "manager" || role === "analyst" || role === "viewer") {
    return role;
  }

  const normalized = String(role ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized === "administrador") return "admin";
  if (normalized === "gestor") return "manager";
  if (normalized === "analista") return "analyst";
  if (normalized === "consulta" || normalized === "viewer") return "viewer";

  return "viewer";
}

export function isRoleAtLeast(userRole: UserRole, minimumRole: UserRole): boolean {
  return roleCatalog[userRole].accessLevel >= roleCatalog[minimumRole].accessLevel;
}

export function getDefaultRole(accessLevel?: number): UserRole {
  if (typeof accessLevel === "number") {
    if (accessLevel >= 100) return "admin";
    if (accessLevel >= 80) return "manager";
    if (accessLevel >= 60) return "analyst";
  }

  return "viewer";
}
