import { VastRole, VastSessionUser } from "@/types/user";

/**
 * Returns the list of designated canonical Yet Vast user IDs that have ADMIN privileges in VastAlliance.
 * Read exclusively from server-only environment variable YETVAST_APP_ADMIN_USER_IDS.
 */
export function getAdminUserIds(): string[] {
  const raw = process.env.YETVAST_APP_ADMIN_USER_IDS || "";
  return raw
    .split(",")
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Resolves the application role for a verified canonical Yet Vast user ID.
 */
export function resolveUserRole(yvUserId: string): VastRole {
  if (!yvUserId) return "MATCH_SEEKER";
  const admins = getAdminUserIds();
  return admins.includes(yvUserId.toLowerCase()) ? "ADMIN" : "MATCH_SEEKER";
}

/**
 * Asserts that the user is authenticated. Throws an error if not.
 */
export function assertAuthenticated(user: VastSessionUser | null): asserts user is VastSessionUser {
  if (!user || !user.yvUserId) {
    const error = new Error("Authentication required.");
    (error as unknown as { status: number }).status = 401;
    throw error;
  }
}

/**
 * Asserts that the user is authenticated and has the ADMIN role.
 */
export function assertAdmin(user: VastSessionUser | null): asserts user is VastSessionUser & { role: "ADMIN" } {
  assertAuthenticated(user);
  if (user.role !== "ADMIN") {
    const error = new Error("Forbidden: Administrator privileges required.");
    (error as unknown as { status: number }).status = 403;
    throw error;
  }
}
