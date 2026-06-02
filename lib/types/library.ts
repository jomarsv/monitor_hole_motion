import type { UserRole } from "./hierarchy";

export type LibraryItem = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  accessLevel: number;
  ownerUid: string;
  ownerName: string;
  fileName: string;
  contentType: string;
  storagePath: string;
  summary: string;
  excerpt?: string;
  byteSize: number;
  createdAt: string;
  updatedAt: string;
};

export type UploadLibraryItemRequest = {
  title: string;
  description: string;
  tags: string[];
  accessLevel: number;
  summary: string;
  excerpt?: string;
};

export type LibraryAccessPreview = {
  canRead: boolean;
  canWrite: boolean;
  canManageUsers: boolean;
  role: UserRole;
};
