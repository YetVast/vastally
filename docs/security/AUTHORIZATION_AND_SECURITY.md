# VastAlliance — Authorization and Security Controls

**Standard ID:** YVA-SEC-001  
**Product:** VastAlliance (`vastally`)  
**Effective Date:** 2026-11-16  

---

## 1. Security Architecture & Threat Model

VastAlliance enforces security controls strictly at the server trust boundary. Client-side hiding of UI elements is treated purely as user experience, never as an authorization mechanism.

### 1.1 Authentication & Session Security
- **Strict HTTPS:** All communications require TLS. In local development, loopback HTTP is permitted.
- **Host-Bound Session Cookie:**
  - Cookie name: `yv_alliance_session`
  - Attributes: `HttpOnly`, `SameSite=Lax`, `Secure` (in production), `Path=/`
  - Never specifies a parent `.yetvast.com` domain to prevent cross-subdomain cookie leakage.
- **CSRF Protection:**
  - Mutation endpoints check `Origin` and `Referer` headers against the approved application origin.
- **Signed Assertion Verification:**
  - Assertion tokens received during OAuth code exchange are cryptographically verified using Yet Vast Auth public JWKS keys (`EdDSA` / `RS256`).

---

## 2. Role-Based Access Control (RBAC)

### 2.1 VastAlliance Application Roles
- `MATCH_SEEKER`:
  - Permitted: Create 1 profile, read own profile, update own profile, soft-delete own profile.
  - Forbidden: Reading all profiles, reading other users' private profiles, creating more than 1 active profile, updating moderation status, adding admin tags (`Verified by Admin`, `Added by Admin`), accessing `/adminDahsboard`.
- `ADMIN`:
  - Permitted: Access `/adminDahsboard`, read overview statistics, read all profiles with filters/search, create unlimited profiles, edit any profile, delete any profile, change moderation status (`PENDING`, `VERIFIED`, `IGNORED`), apply tags, audit trail recording.

### 2.2 Server-Side Authorization Enforcement
- All protected API routes (`/api/profiles/*`, `/api/admin/*`, `/api/moderation/*`) execute server-side session verification.
- Roles are computed server-side during sign-in by comparing the verified canonical `yvUserId` with the server-only `YETVAST_APP_ADMIN_USER_IDS` environment variable.
- A user cannot modify their own role via any API parameter.

---

## 3. Firestore Security Rules (`firestore.rules`)

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Client-side direct database access is closed.
    // All reads and writes go through the trusted Next.js server authority.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
All database queries are executed via the Firebase Admin SDK on the Next.js server, ensuring complete server-side authorization enforcement and preventing any direct client-side tamper attempts.
