export type VastRole = "ADMIN" | "MATCH_SEEKER";

export interface VastSessionUser {
  yvUserId: string; // Canonical Yet Vast user ID (e.g. "yvnowyv")
  role: VastRole;   // VastAlliance role: ADMIN or MATCH_SEEKER
  displayName: string | null;
  email: string | null;
  provider: "google";
  authenticatedAt: string;
}

export interface VastSessionPayload extends VastSessionUser {
  iat: number;
  exp: number;
}
