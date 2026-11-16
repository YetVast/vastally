# VastAlliance — Architecture Decision Records (ADR)

## ADR-001: Next.js App Router with React 19 & TypeScript
- **Context:** VastAlliance requires modern server-rendered pages, API route handlers, and server actions.
- **Decision:** Adopt Next.js 15 (App Router) with React 19 and TypeScript.
- **Consequence:** Full server-side authorization enforcement, robust streaming and layout composition, strict type safety.

## ADR-002: Pure CSS Modules & Canonical YVS Design Tokens (No Tailwind)
- **Context:** The prompt and Yet Vast standards mandate pure CSS Modules and design tokens, explicitly forbidding Tailwind CSS for VastAlliance V0.
- **Decision:** Implement all visual components with CSS Modules (`*.module.css`) referencing CSS Custom Properties for YVS Brand Colors (`#FFFF11` Yellow, `#4B0084` Indigo) and semantic color tokens.
- **Consequence:** Zero CSS framework bloat, precise visual alignment with YVS design guidelines, strict encapsulation of styles.

## ADR-003: Yet Vast Auth Central Identity Authority
- **Context:** Yet Vast Auth provides single identity across all Yet Vast Solutions.
- **Decision:** Consume official `@yetvast/auth` SDK with Google OAuth Authorization Code flow + PKCE S256. Map verified `yvUserId` to VastAlliance local host-bound session `yv_alliance_session`.
- **Consequence:** No duplicated user credentials; clear separation between central identity and VastAlliance-specific profile data.

## ADR-004: Flexible Bio-Data Property Model
- **Context:** Bio-data requires an arbitrary number of user-defined attributes without rigid database schema migrations.
- **Decision:** Store details as an array of `{ id: string, label: string, value: string }`, with mandatory primary `name` field.
- **Consequence:** Users can pick from standard labels (Date of Birth, Gender, Occupation, etc.) or add arbitrary custom labels.

## ADR-005: Deterministic Profile ID Format `FIRST5YYYYmmmDDHHmmxxx`
- **Context:** Stable, readable, and collision-resistant identifiers are required.
- **Decision:** Generate profile IDs on the server using the first 5 uppercase normalized letters of the name, creation timestamp in UTC `YYYYmmmDDHHmm`, and 3 random lowercase characters, with database collision verification and retry.
- **Consequence:** Human-readable IDs that are deterministic at creation time and globally unique.

## ADR-006: Server-Enforced Match Seeker One-Profile Invariant
- **Context:** Match Seekers must be limited to exactly one active profile.
- **Decision:** Enforce active profile uniqueness on the server keyed by `createdByUserId` (`yvUserId`). Admins are exempt and can create unlimited profiles.
- **Consequence:** Prevents spam or duplicate profile creation.

## ADR-007: Dual Persistence Layer (Firestore + In-Memory Fallback)
- **Context:** Production uses Google Cloud Firestore via Firebase Admin SDK. Local development and automated testing must run reliably without requiring immediate live Google Cloud credentials.
- **Decision:** Provide a unified repository interface (`ProfileRepository`) implemented by both `FirestoreProfileRepository` and `InMemoryProfileRepository`.
- **Consequence:** Tests and builds pass without live network dependencies while production seamlessly targets Firestore.
