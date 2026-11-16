import { beforeEach, describe, expect, it } from "vitest";
import { profileService } from "@/services/profile.service";
import { moderationService } from "@/services/moderation.service";
import { setProfileStoreForTesting } from "@/lib/db";
import { InMemoryProfileStore } from "@/lib/db/in-memory-store";
import { VastSessionUser } from "@/types/user";

describe("ModerationService & Audit Trail", () => {
  let memoryStore: InMemoryProfileStore;

  const adminUser: VastSessionUser = {
    yvUserId: "admin_yv",
    role: "ADMIN",
    displayName: "Admin Yagnik",
    email: "admin@example.com",
    provider: "google",
    authenticatedAt: "2026-11-16T22:00:00Z",
  };

  const matchSeeker: VastSessionUser = {
    yvUserId: "seeker1",
    role: "MATCH_SEEKER",
    displayName: "Alice Seeker",
    email: "alice@example.com",
    provider: "google",
    authenticatedAt: "2026-11-16T22:00:00Z",
  };

  beforeEach(() => {
    memoryStore = new InMemoryProfileStore();
    setProfileStoreForTesting(memoryStore);
  });

  it("verifies a profile and adds the 'Verified by Admin' tag with audit trail", async () => {
    const profile = await profileService.createProfile(matchSeeker, {
      name: "Alice Seeker",
      details: [{ label: "City", value: "Bangalore" }],
    });

    expect(profile.status).toBe("PENDING");
    expect(profile.tags).not.toContain("Verified by Admin");

    const verified = await moderationService.verifyProfile(
      profile.profileId,
      adminUser,
      "Profile details verified via phone interview."
    );

    expect(verified.status).toBe("VERIFIED");
    expect(verified.tags).toContain("Verified by Admin");
    expect(verified.moderationHistory).toHaveLength(1);
    expect(verified.moderationHistory[0].action).toBe("VERIFY");
    expect(verified.moderationHistory[0].actorId).toBe("admin_yv");
    expect(verified.moderationHistory[0].fromStatus).toBe("PENDING");
    expect(verified.moderationHistory[0].toStatus).toBe("VERIFIED");
    expect(verified.moderationHistory[0].reason).toBe(
      "Profile details verified via phone interview."
    );
  });

  it("ignores a profile and removes the 'Verified by Admin' tag", async () => {
    const profile = await profileService.createProfile(matchSeeker, {
      name: "Bob Incomplete",
    });

    // First verify
    await moderationService.verifyProfile(profile.profileId, adminUser);

    // Then ignore
    const ignored = await moderationService.ignoreProfile(
      profile.profileId,
      adminUser,
      "Incomplete contact details."
    );

    expect(ignored.status).toBe("IGNORED");
    expect(ignored.tags).not.toContain("Verified by Admin");
    expect(ignored.moderationHistory).toHaveLength(2);
    expect(ignored.moderationHistory[0].action).toBe("IGNORE");
    expect(ignored.moderationHistory[0].fromStatus).toBe("VERIFIED");
    expect(ignored.moderationHistory[0].toStatus).toBe("IGNORED");
  });

  it("blocks non-admin users from executing moderation actions", async () => {
    const profile = await profileService.createProfile(matchSeeker, {
      name: "Charlie",
    });

    await expect(
      moderationService.verifyProfile(profile.profileId, matchSeeker)
    ).rejects.toThrow(/Administrator privileges required/);

    await expect(
      moderationService.ignoreProfile(profile.profileId, matchSeeker)
    ).rejects.toThrow(/Administrator privileges required/);
  });
});
