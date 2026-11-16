import { getProfileStore } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/rbac";
import { ModerationAuditEntry, ProfileRecord, ProfileStatus } from "@/types/profile";
import { VastSessionUser } from "@/types/user";

export class ModerationService {
  private get store() {
    return getProfileStore();
  }

  /**
   * Admin-only: Verifies a profile.
   */
  async verifyProfile(profileId: string, adminUser: VastSessionUser, reason?: string): Promise<ProfileRecord> {
    assertAdmin(adminUser);
    return this.applyStatusTransition(profileId, adminUser, "VERIFY", "VERIFIED", reason);
  }

  /**
   * Admin-only: Ignores a profile.
   */
  async ignoreProfile(profileId: string, adminUser: VastSessionUser, reason?: string): Promise<ProfileRecord> {
    assertAdmin(adminUser);
    return this.applyStatusTransition(profileId, adminUser, "IGNORE", "IGNORED", reason);
  }

  /**
   * Admin-only: Changes status to any valid ProfileStatus.
   */
  async changeStatus(
    profileId: string,
    adminUser: VastSessionUser,
    newStatus: ProfileStatus,
    reason?: string
  ): Promise<ProfileRecord> {
    assertAdmin(adminUser);
    return this.applyStatusTransition(profileId, adminUser, "STATUS_CHANGE", newStatus, reason);
  }

  private async applyStatusTransition(
    profileId: string,
    adminUser: VastSessionUser,
    action: "VERIFY" | "IGNORE" | "STATUS_CHANGE",
    targetStatus: ProfileStatus,
    reason?: string
  ): Promise<ProfileRecord> {
    const existing = await this.store.getProfileById(profileId);
    if (!existing) {
      const err = new Error("Profile not found.");
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    const fromStatus = existing.status;
    const now = new Date().toISOString();

    const auditEntry: ModerationAuditEntry = {
      action,
      actorId: adminUser.yvUserId,
      actorDisplayName: adminUser.displayName || adminUser.email || adminUser.yvUserId,
      timestamp: now,
      fromStatus,
      toStatus: targetStatus,
      reason: reason?.trim() || undefined,
    };

    // Keep tags consistent with moderation status
    const tagSet = new Set(existing.tags);
    if (targetStatus === "VERIFIED") {
      tagSet.add("Verified by Admin");
    } else {
      tagSet.delete("Verified by Admin");
    }

    const updated: ProfileRecord = {
      ...existing,
      status: targetStatus,
      tags: Array.from(tagSet),
      moderationHistory: [auditEntry, ...existing.moderationHistory],
      updatedAt: now,
    };

    await this.store.saveProfile(updated);
    return updated;
  }
}

export const moderationService = new ModerationService();
