export type ProfileStatus = "PENDING" | "VERIFIED" | "IGNORED";
export type CreationSource = "MATCH_SEEKER" | "ADMIN";

export interface ProfileDetailItem {
  id: string;      // Unique row ID
  label: string;   // Bio-data label (e.g. "Occupation", "Date of Birth", custom label)
  value: string;   // Text-only property value
}

export interface ModerationAuditEntry {
  action: "VERIFY" | "IGNORE" | "STATUS_CHANGE";
  actorId: string;           // yvUserId of admin
  actorDisplayName?: string;
  timestamp: string;         // ISO 8601 UTC
  fromStatus: ProfileStatus;
  toStatus: ProfileStatus;
  reason?: string;
}

export interface ProfileRecord {
  profileId: string;              // Unique immutable ID: FIRST5YYYYmmmDDHHmmxxx
  name: string;                   // Mandatory primary display name
  details: ProfileDetailItem[];   // Flexible text details
  createdBy: string;              // Creator display name or email
  createdByUserId: string;        // Canonical yvUserId
  creationSource: CreationSource; // "MATCH_SEEKER" | "ADMIN"
  createdAt: string;              // ISO 8601 UTC
  updatedAt: string;              // ISO 8601 UTC
  status: ProfileStatus;          // "PENDING" | "VERIFIED" | "IGNORED"
  tags: string[];                 // "Verified by Admin", "Added by Admin"
  moderationHistory: ModerationAuditEntry[];
  isDeleted: boolean;             // Soft deletion
  deletedAt?: string;
  deletedBy?: string;
}

export interface CreateProfileInput {
  name: string;
  details?: Array<{ label: string; value: string }>;
}

export interface UpdateProfileInput {
  name: string;
  details: Array<{ id?: string; label: string; value: string }>;
}

export interface AdminStats {
  totalProfiles: number;
  pendingProfiles: number;
  verifiedProfiles: number;
  ignoredProfiles: number;
  addedByAdmin: number;
  addedBySeeker: number;
}

export interface ProfileListQuery {
  status?: ProfileStatus;
  creationSource?: CreationSource;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProfileListResult {
  profiles: ProfileRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
