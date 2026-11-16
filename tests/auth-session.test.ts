import { describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "@/lib/auth/session";
import { resolveUserRole } from "@/lib/auth/rbac";
import { VastSessionUser } from "@/types/user";

describe("Session Management & RBAC Security", () => {
  const sampleUser: VastSessionUser = {
    yvUserId: "yvnowyv",
    role: "ADMIN",
    displayName: "Yagnik Patel",
    email: "yvnowyv@gmail.com",
    provider: "google",
    authenticatedAt: "2026-11-16T22:00:00.000Z",
  };

  it("signs and successfully verifies a valid host-bound session token", () => {
    const token = signSessionToken(sampleUser);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(2);

    const verified = verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.yvUserId).toBe("yvnowyv");
    expect(verified?.role).toBe("ADMIN");
    expect(verified?.displayName).toBe("Yagnik Patel");
    expect(verified?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("rejects tampered session tokens", () => {
    const token = signSessionToken(sampleUser);
    const [payload, sig] = token.split(".");

    // Alter payload data
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...sampleUser, role: "SUPER_ADMIN" })
    ).toString("base64url");

    const tamperedToken = `${tamperedPayload}.${sig}`;
    expect(verifySessionToken(tamperedToken)).toBeNull();

    // Alter signature
    const badSigToken = `${payload}.${sig.slice(0, -2)}xx`;
    expect(verifySessionToken(badSigToken)).toBeNull();
  });

  it("rejects expired session tokens", () => {
    // Expired TTL (-10 seconds)
    const expiredToken = signSessionToken(sampleUser, -10);
    expect(verifySessionToken(expiredToken)).toBeNull();
  });

  it("correctly identifies ADMIN vs MATCH_SEEKER from YETVAST_APP_ADMIN_USER_IDS", () => {
    process.env.YETVAST_APP_ADMIN_USER_IDS = "yvnowyv,admin_user";

    expect(resolveUserRole("yvnowyv")).toBe("ADMIN");
    expect(resolveUserRole("YVNOWYV")).toBe("ADMIN"); // Case-insensitive
    expect(resolveUserRole("admin_user")).toBe("ADMIN");
    expect(resolveUserRole("regular_seeker")).toBe("MATCH_SEEKER");
    expect(resolveUserRole("unknown")).toBe("MATCH_SEEKER");
  });
});
