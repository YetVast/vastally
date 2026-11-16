import crypto from "crypto";
import { cookies } from "next/headers";
import { VastSessionPayload, VastSessionUser } from "@/types/user";

export const SESSION_COOKIE_NAME = "yv_alliance_session";
export const OAUTH_COOKIE_NAME = "yv_alliance_oauth_flow";
const DEFAULT_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.YETVAST_SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be defined in production");
    }
    return "dev-insecure-session-secret-change-in-production-vastalliance-2026";
  }
  return secret;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Creates a signed host-bound session token.
 */
export function signSessionToken(user: VastSessionUser, ttlSeconds = DEFAULT_SESSION_TTL_SECONDS): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: VastSessionPayload = {
    ...user,
    iat: nowSeconds,
    exp: nowSeconds + ttlSeconds,
  };

  const secret = getSessionSecret();
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies a signed session token. Returns null if invalid or expired.
 */
export function verifySessionToken(token: string): VastSessionPayload | null {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const secret = getSessionSecret();
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");

  // Timing safe equality
  if (signature.length !== expectedSignature.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const rawPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!rawPayload.exp || rawPayload.exp < nowSeconds) {
      return null;
    }
    if (!rawPayload.yvUserId || !rawPayload.role) {
      return null;
    }
    return rawPayload as VastSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Retrieves the current session user on the server.
 */
export async function getSessionUser(): Promise<VastSessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }
    const session = verifySessionToken(token);
    if (!session) {
      return null;
    }
    return {
      yvUserId: session.yvUserId,
      role: session.role,
      displayName: session.displayName,
      email: session.email,
      provider: session.provider,
      authenticatedAt: session.authenticatedAt,
    };
  } catch {
    return null;
  }
}
