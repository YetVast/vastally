# VastAlliance — Yet Vast Foundation Documentation Pack

**Prepared:** 16 November 2026  
**Purpose:** Provide the minimum current Yet Vast umbrella and central-auth references needed to initialize VastAlliance and implement its first working sign-in flow.

## Start here

1. `docs/product/VASTALLIANCE_PRODUCT_AND_AUTH_IMPLEMENTATION_BRIEF.md` — app-specific product context, known decisions, sign-in architecture, sequence, acceptance criteria and open questions.
2. `docs/shared/Yet-Vast-Auth-Updated-Project-Documentation_2026-11-16.md` — current central Auth architecture, application registration/approval rules, identity, OAuth, security and implementation status.
3. `docs/shared/Yet-Vast-Auth-Project-Handbook_UPDATED_2026-11-16.md` — consumer integration and operations handbook, including package contracts and identity/session boundaries.
4. `docs/shared/YET_VAST_PRIVATE_PACKAGE_CONSUMPTION_STANDARD.md` — mandatory private `@yetvast/*` package installation and CI/Vercel token procedure.
5. `docs/shared/YVS_Application_Development_Standards_v1.0.0.md` — mandatory engineering and security standards.
6. `docs/shared/YVS-ARCHITECTURE-CONTEXT_UPDATED_2026-11-16.md` — parent umbrella, brand, product-independence and shared architecture context.

## Why these documents

VastAlliance needs the current Auth consumer contract, not the implementation history of another consumer app. The Auth project documentation and handbook describe the central authority; the YVS standards establish common engineering constraints; the product brief translates prior VastAlliance decisions into a concrete implementation sequence.

## Deliberately excluded

- YappOut-specific product, sign-in and incident documents.
- Yet Vast Home project handbook and Home-specific OAuth implementation reports.
- Cogmit project handbook.
- Old (non-updated) copies of Auth handbooks, histories and architecture context.
- The 14 November Auth documentation, superseded by the 16 November current update.
- Any YappOut package-resolution or redirect-URI incident report.

These documents are not required to establish VastAlliance's own consumer integration. They may be consulted in their source projects only when a concrete shared issue warrants it.

## Implementation guardrails

- VastAlliance is a consumer of Yet Vast Auth; it must not duplicate central identity management.
- Use the current official SDK APIs. Do not copy YappOut's callback route or environment variable names without checking the current SDK contract and VastAlliance origin.
- The exact production origin and callback URI must be registered centrally and match exactly.
- Central application registration and approval are controlled by Yet Vast Auth Admins.
- Keep central identity, VastAlliance profiles and VastAlliance roles separate.
- Use Google as the initial persistent identity provider unless the central registration and product decision explicitly change.
- Keep `NODE_AUTH_TOKEN` (build-time package registry access) separate from OAuth credentials and runtime user sessions.
- Do not start AI / LiteRT-LM or VastComm work in the initial sign-in milestone.
