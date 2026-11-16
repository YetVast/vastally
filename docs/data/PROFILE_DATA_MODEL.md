# VastAlliance — Profile Data Model & ID Generation

**Standard ID:** YVA-DATA-001  
**Product:** VastAlliance (`vastally`)  
**Storage Engine:** Google Cloud Firestore (Primary)  
**Effective Date:** 2026-11-16  

---

## 1. Bio-Data Profile Model

The VastAlliance profile is designed to store personal bio-data for matchmaking. Only **Name** is mandatory. All other fields are stored as flexible, user-defined text key-value details.

### Profile Document Schema (`profiles/{profileId}`)

```typescript
export interface ProfileDetailItem {
  id: string;      // Unique row identifier (UUID or nanoid)
  label: string;   // Label (e.g. "Occupation", "Date of Birth", or custom label)
  value: string;   // Text-only string value
}

export type ProfileStatus = "PENDING" | "VERIFIED" | "IGNORED";
export type CreationSource = "MATCH_SEEKER" | "ADMIN";

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
  profileId: string;         // Format: FIRST5YYYYmmmDDHHmmxxx
  name: string;              // Mandatory primary display name
  details: ProfileDetailItem[]; // Flexible text properties
  createdBy: string;         // Display name of creator
  createdByUserId: string;   // Canonical Yet Vast User ID (yvUserId)
  creationSource: CreationSource; // "MATCH_SEEKER" | "ADMIN"
  createdAt: string;         // ISO 8601 UTC
  updatedAt: string;         // ISO 8601 UTC
  status: ProfileStatus;     // "PENDING" | "VERIFIED" | "IGNORED"
  tags: string[];            // e.g. ["Verified by Admin"], ["Added by Admin"]
  moderationHistory: ModerationAuditEntry[];
  isDeleted: boolean;        // Soft delete flag
  deletedAt?: string;
  deletedBy?: string;
}
```

---

## 2. Profile ID Generation Standard

Every profile receives a unique, immutable `profileId` generated strictly on the server upon initial creation.

### 2.1 Format: `FIRST5YYYYmmmDDHHmmxxx`
Example: `YAGN2026nov162217abc`

1. **`FIRST5` (Name Prefix):**
   - The profile name is normalized: alphanumeric characters only (`/[^a-zA-Z0-9]/g`), transformed to uppercase.
   - The first 5 characters are taken. If fewer than 5 characters exist, all available characters are used.
   - Example: "Yagnik Patel" -> "YAGNI", "Ali" -> "ALI".
2. **`YYYYmmmDDHHmm` (Timestamp):**
   - Deterministic UTC timestamp at creation time.
   - `YYYY`: 4-digit year (e.g. `2026`)
   - `mmm`: 3-letter lowercase month abbreviation (e.g. `jan`, `feb`, `mar`, `apr`, `may`, `jun`, `jul`, `aug`, `sep`, `oct`, `nov`, `dec`)
   - `DD`: 2-digit day of month (`01`-`31`)
   - `HH`: 2-digit UTC hour (`00`-`23`)
   - `mm`: 2-digit UTC minute (`00`-`59`)
3. **`xxx` (Random Suffix):**
   - 3 cryptographically secure random lowercase characters from `a-z` (`crypto.randomInt(0, 26)`).
4. **Collision Handling & Atomic Uniqueness:**
   - The server performs an atomic transaction or document existence check on the database.
   - If `profileId` exists, another 3-character random suffix is generated, retrying up to 10 times.
   - If max retries are exceeded, a clear generation error is returned.

---

## 3. Ownership & Multi-Tenancy Rules

1. **Match Seeker Constraint:**
   - A Match Seeker can own **at most one active (`!isDeleted`) profile**.
   - Enforced server-side using a transaction on the `user_profiles/{yvUserId}` mapping collection or querying active profiles by `createdByUserId`.
2. **Admin Privileges:**
   - An Admin can create unlimited profiles.
   - Admin-created profiles automatically carry `creationSource: "ADMIN"` and the tag `"Added by Admin"`.
   - Admin-created profiles start with status `"PENDING"`.
