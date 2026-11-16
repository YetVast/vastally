# VastAlliance — Product Foundation and Yet Vast Auth Sign-In Handoff

**Prepared:** 16 November 2026  
**Product name:** VastAlliance  
**Development shorthand:** `vastally`  
**Potential future domain:** `vastalliance.yetvast.com`  
**Parent umbrella:** Yet Vast Apps / Yet Vast Solutions  
**Document status:** Initial product context and sign-in implementation handoff; not a source-code audit.

## 1. Purpose

VastAlliance is a Yet Vast application intended to help people discover and connect with relevant profiles through a structured profile and discovery experience. The initial product direction includes two application roles:

- **Admin** — manages the application's profile and operational content.
- **Match Seeker** — creates or maintains a profile, discovers relevant profiles, bookmarks profiles and initiates contact.

The precise matching criteria, profile schema, moderation workflow and admin content-management workflow must be confirmed in the product design before implementation. Do not invent these as already-decided requirements.

## 2. Previously established product boundaries

The following decisions were established in prior planning and should be preserved as the starting baseline:

- Google OAuth through central **Yet Vast Auth** is the primary sign-in route.
- Firestore is the intended application data store for Match Seeker and application data.
- Admin-managed profiles may potentially be stored in GitHub; this is a prior architectural possibility, not a finalized storage decision.
- Identity data is separate from VastAlliance application data.
- A user has one shared Yet Vast identity/account, while VastAlliance owns its application-specific roles and authorization.
- Application-specific role assignment must not be confused with central Yet Vast Auth roles.
- Anonymous/public access may be configurable by product policy; define which pages and actions are public before implementing route guards.
- Initial user-facing capabilities include profiles, profile discovery, bookmarks, and direct phone / WhatsApp contact links.
- AI / LiteRT-LM is excluded from the initial scope.
- VastComm integration is excluded from the initial scope and may be considered later.

## 3. Authentication architecture

### 3.1 Authority boundaries

**Yet Vast Auth is the central identity authority. VastAlliance is the consumer application.**

Yet Vast Auth is responsible for:
- Google OAuth and central identity resolution.
- Issuing the authorization code and signed identity assertion through its registered OAuth flow.
- Publishing signing keys through its JWKS endpoint.
- Maintaining the central application registration and approval state.
- Enforcing the provider and redirect-URI policy attached to the application registration.

VastAlliance is responsible for:
- Starting the central OAuth flow using the supported `@yetvast/auth` consumer SDK.
- Handling its registered callback.
- Exchanging the authorization code server-to-server using the supported SDK integration.
- Verifying the signed identity assertion using the central Auth JWKS.
- Creating and clearing a VastAlliance-origin, host-bound session.
- Mapping the verified central Yet Vast user ID to VastAlliance application data.
- Enforcing its own application roles and data permissions on the server.

Do not implement a second, competing Google identity system inside VastAlliance. Do not create a separate central identity record in VastAlliance's Firestore.

### 3.2 Identity and application data separation

Keep these concerns separate:

1. **Central identity:** canonical Yet Vast user ID and linked identity providers, owned by Yet Vast Auth.
2. **VastAlliance account/profile:** VastAlliance-specific profile fields and preferences, keyed by the verified Yet Vast user ID.
3. **VastAlliance authorization:** roles such as `ADMIN` and `MATCH_SEEKER`, assigned and checked by VastAlliance.
4. **Contact information:** phone and WhatsApp details, with explicit visibility and consent rules.

Do not use email as the permanent primary key when the verified immutable Yet Vast user ID is available. Do not automatically merge accounts based only on matching email addresses.

### 3.3 Provider policy

Google is the default persistent identity provider under the current Yet Vast Auth policy. GitHub is a separate optional linked provider / access pathway and must not be assumed to be enabled for VastAlliance. Do not add GitHub sign-in unless the central application registration and product requirement explicitly call for it.

### 3.4 OAuth flow to implement

1. User selects **Sign in with Yet Vast** / Google from VastAlliance.
2. VastAlliance server initiates the supported Yet Vast Auth OAuth transaction using the official SDK.
3. The flow uses OAuth state and PKCE as required by the central public-client contract.
4. Yet Vast Auth checks the application registration, approval status, provider policy and exact redirect URI.
5. User authenticates with Google.
6. Yet Vast Auth resolves or creates the central Yet Vast identity.
7. Auth redirects to the exact registered VastAlliance callback with a short-lived, single-use authorization code.
8. VastAlliance backend exchanges the code server-to-server.
9. VastAlliance verifies the signed identity assertion against the Auth JWKS.
10. VastAlliance creates its own secure, host-bound session.
11. VastAlliance loads or initializes its application profile and role mapping using the verified Yet Vast user ID.
12. Every protected server action / route checks the session and application-specific authorization.

Use the exact SDK APIs and callback conventions in the current `@yetvast/auth` documentation and package version. This document intentionally does not invent callback paths, environment variable names, or SDK function signatures.

## 4. Central application registration requirements

VastAlliance must be registered as a consumer application in Yet Vast Auth before production sign-in can work.

Current central policy in the supplied 16 November Auth documentation:
- The central application registry is controlled by Yet Vast Auth Admins. A consumer app cannot approve or register itself.
- The application ID is generated centrally; the applicant does not choose it.
- The registered production origin and redirect URI must exactly match the deployed application.
- A designated App Administrator must be a canonical Yet Vast user ID and must match the consumer deployment's server-only `YETVAST_APP_ADMIN_USER_IDS` configuration.
- The central Auth registration's status and provider policy must permit the requested flow.

Before registration, decide and document:
- Actual production origin (do not assume the potential future domain is already live).
- Exact callback URI generated by the implementation.
- App display name and concise purpose.
- Designated App Administrator's canonical Yet Vast user ID.
- Whether anonymous access is allowed and which routes/actions remain public.
- Google-only provider policy for initial release unless a separate decision changes it.

## 5. VastAlliance application role model

Initial roles:
- `ADMIN`
- `MATCH_SEEKER`

These are **VastAlliance roles**, not Yet Vast Auth global roles.

Recommended authorization principle:
- A verified central identity establishes who the user is.
- A VastAlliance-owned role record establishes what that user can do inside VastAlliance.
- Role assignment and changes must be server-authorized and auditable.
- Never trust a role supplied by the browser or a client-writable profile field.
- Do not grant `ADMIN` merely because a user is the designated central App Administrator; keep central app administration and product-level profile administration explicitly mapped.

The exact bootstrap and recovery process for the first VastAlliance Admin remains to be designed and documented before production launch.

## 6. Initial technical direction

Based on the previously discussed Yet Vast application conventions:
- Next.js App Router.
- React and TypeScript.
- CSS Modules and CSS custom properties / design tokens; no Tailwind CSS.
- Vercel deployment.
- `@yetvast/auth` and, where suitable, `@yetvast/auth-ui` from the private GitHub Packages registry.
- Firestore for VastAlliance application data, with server-side authorization and rules designed around verified user identity.

Do not infer that every data object must live in Firestore. The possible GitHub-backed admin profile/content store is unresolved and should be decided against query, update, audit, access-control and operational requirements.

## 7. Build-time package authentication is not user sign-in

If VastAlliance consumes private `@yetvast/*` packages:
- Add the credential-free root `.npmrc` exactly as specified by the shared package-consumption standard.
- Configure `NODE_AUTH_TOKEN` in Vercel / CI with the required GitHub Classic PAT permissions.
- Verify isolated package access and run `npm ci` plus all quality gates.

`NODE_AUTH_TOKEN` authorizes npm to download private packages during build. It is not a Google OAuth credential, a Yet Vast identity token, or an end-user session secret.

## 8. Security and privacy requirements to resolve during implementation

- Keep OAuth client secrets, signing material, service-account credentials and package tokens server-side.
- Use secure, HTTP-only, appropriately scoped cookies for the local application session, following the official Auth SDK contract.
- Validate state, PKCE, callback origin and redirect URI using the SDK; do not hand-roll OAuth.
- Enforce profile ownership and role checks on the server.
- Design Firestore rules and server access so one Match Seeker cannot read or modify another user's private profile fields.
- Define public profile fields separately from private contact and account fields.
- Phone / WhatsApp visibility must be an explicit user-facing privacy choice.
- Prevent unauthenticated users from invoking protected writes, even if UI controls are hidden.
- Do not store central Auth credentials or identity-provider tokens in client-readable application documents.
- Log security-relevant administrative actions without logging secrets or unnecessary personal data.

## 9. Sign-in implementation sequence and acceptance criteria

### Phase A — Establish the app shell
- Create the VastAlliance repository and baseline Next.js / TypeScript application.
- Apply YVS engineering standards and CSS Modules / design-token conventions.
- Set the actual deployment origin and environment configuration strategy.

### Phase B — Consume the central Auth packages
- Confirm the currently published package versions from the Auth project documentation / registry.
- Configure `.npmrc` and `NODE_AUTH_TOKEN` according to the shared standard.
- Install the official SDK and UI package only where their documented APIs fit.
- Record exact package versions in the app README.

### Phase C — Register VastAlliance
- Obtain central Auth Admin registration and approval.
- Register exact production origin and exact callback URI.
- Set Google as the initial enabled provider.
- Confirm designated App Administrator canonical user ID and deployment allowlist.

### Phase D — Implement OAuth and local session
- Implement sign-in initiation, callback, code exchange, JWKS verification, session creation and logout using official SDK APIs.
- Implement loading, cancellation, provider-disabled, registration-pending, invalid-redirect and authentication-failure states.
- Ensure return-to paths are constrained to trusted same-origin paths.

### Phase E — Add application identity and roles
- Link the verified Yet Vast user ID to a VastAlliance profile record.
- Implement server-side `ADMIN` / `MATCH_SEEKER` authorization.
- Define the first Admin bootstrap and recovery process.
- Keep central identity records separate from app-specific profile and role data.

### Phase F — Verify end to end
- Test Google sign-in from the actual deployed origin.
- Verify exact callback matching and successful code exchange.
- Verify signature / issuer / audience / expiry according to SDK contract.
- Verify host-bound session persistence, refresh behavior if supported, and logout.
- Test anonymous access policy, role separation, unauthorized API calls and cross-user data isolation.
- Run typecheck, lint, automated tests and production build.
- Record actual results; do not label sign-in production-ready based only on compilation.

## 10. Explicitly out of initial scope

- AI / LiteRT-LM capabilities.
- VastComm integration.
- Automated AI matching or recommendations.
- Any unconfirmed matching algorithm or scoring model.

## 11. Open decisions — do not silently assume

1. Final production domain and deployment origin.
2. Exact callback URI after the app's Auth route is implemented.
3. Exact public-versus-authenticated route matrix.
4. Match Seeker profile fields and which are public/private.
5. Matching / discovery filters and ranking behavior.
6. Admin profile/content storage: Firestore, GitHub, or another justified design.
7. First Admin bootstrap and recovery procedure.
8. Whether a user can hold both `ADMIN` and `MATCH_SEEKER` roles.
9. Contact visibility defaults and consent controls.
10. Profile moderation, reporting, blocking and deletion lifecycle.

## 12. Source of truth and precedence

For central identity, OAuth, application registration, provider policy, package versions and SDK contracts, use the supplied current Yet Vast Auth documentation and ultimately the Auth repository / deployed service. This handoff summarizes consumer requirements; it does not replace central Auth contracts.

For YVS engineering and product-boundary conventions, use the included current YVS Application Development Standards and updated Architecture Context.

For VastAlliance-specific product scope, this document records prior planning decisions. Any unconfirmed items are explicitly marked open rather than treated as implemented.
