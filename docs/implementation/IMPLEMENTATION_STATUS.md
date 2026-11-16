# VastAlliance — Implementation Status Tracker

**Product:** VastAlliance (`vastally`)  
**Milestone:** V0 Foundation  
**Last Updated:** 2026-11-16  

---

## Feature Matrix

| Feature | Status | Primary Files | Verification Evidence | Known Limitations |
|---|---|---|---|---|
| **Yet Vast Private Package Standard** | Tested | `.npmrc`, `package.json` | Isolated `npm view @yetvast/auth` with `${NODE_AUTH_TOKEN}`, `npm install` green | PAT required in CI/Vercel |
| **Yet Vast Auth Google Sign-In** | Tested | `lib/auth/oauth.ts`, `app/api/auth/*` | Authorize redirect & code exchange contract (`exchangeCodeForAssertion`) | Central Auth registration required for live prod |
| **Session & Identity Boundaries** | Tested | `lib/auth/session.ts` | 4 passing unit tests in `tests/auth-session.test.ts` | Host-bound `yv_alliance_session` cookie |
| **Application Roles (`ADMIN`, `MATCH_SEEKER`)** | Tested | `lib/auth/rbac.ts`, `app/adminDahsboard/page.tsx` | Tests in `tests/auth-session.test.ts` for `YETVAST_APP_ADMIN_USER_IDS` | Immutable server-only allowlist |
| **Profile ID Generator** | Tested | `lib/profile-id/generator.ts` | 7 passing unit tests in `tests/profile-id.test.ts` | Format `FIRST5YYYYmmmDDHHmmxxx`, 10 retry ceiling |
| **Flexible Bio-Data Profile Model** | Tested | `types/profile.ts`, `services/profile.service.ts` | 8 passing tests in `tests/profile-service.test.ts` | Text-only properties in V0 |
| **One-Profile-Per-Seeker Enforcement** | Tested | `services/profile.service.ts` | Server 409 rejection verified in `tests/profile-service.test.ts` | Applies to active (`!isDeleted`) profiles |
| **Profile Form UI (CSS Modules)** | Implemented | `components/profile/ProfileForm.tsx`, `ProfileForm.module.css` | Mandatory Name, label dropdown, custom label, row locking | Pure CSS Modules, No Tailwind |
| **Admin Dashboard (`/adminDahsboard`)** | Implemented | `app/adminDahsboard/page.tsx`, `components/admin/AdminDashboard.tsx` | Route `/adminDahsboard`, overview stats, listing, search, pagination | Preserves exact route spelling |
| **Moderation Actions & Audit Trail** | Tested | `services/moderation.service.ts` | 3 passing tests in `tests/moderation-service.test.ts` | Full audit history and status transitions |
| **Firestore Database Rules & Dual Persistence** | Implemented | `firestore.rules`, `lib/db/*` | Closed client rules, in-memory test fallback, Firebase Admin Firestore | Production needs GCP credentials |
