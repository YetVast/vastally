import { beforeEach, describe, expect, it } from "vitest";
import { profileService } from "@/services/profile.service";
import { setProfileStoreForTesting } from "@/lib/db";
import { InMemoryProfileStore } from "@/lib/db/in-memory-store";
import { VastSessionUser } from "@/types/user";

describe("ProfileService & Bio-Data Model Invariants", () => {
  let memoryStore: InMemoryProfileStore;

  const matchSeeker1: VastSessionUser = {
    yvUserId: "seeker1",
    role: "MATCH_SEEKER",
    displayName: "Alice Seeker",
    email: "alice@example.com",
    provider: "google",
    authenticatedAt: "2026-11-16T22:00:00Z",
  };

  const matchSeeker2: VastSessionUser = {
    yvUserId: "seeker2",
    role: "MATCH_SEEKER",
    displayName: "Bob Seeker",
    email: "bob@example.com",
    provider: "google",
    authenticatedAt: "2026-11-16T22:00:00Z",
  };

  const adminUser: VastSessionUser = {
    yvUserId: "admin_yv",
    role: "ADMIN",
    displayName: "Admin Yagnik",
    email: "admin@example.com",
    provider: "google",
    authenticatedAt: "2026-11-16T22:00:00Z",
  };

  beforeEach(() => {
    memoryStore = new InMemoryProfileStore();
    setProfileStoreForTesting(memoryStore);
  });

  it("validates that Name is mandatory and rejects empty or whitespace name", async () => {
    await expect(
      profileService.createProfile(matchSeeker1, { name: "" })
    ).rejects.toThrow(/Profile name is mandatory/);

    await expect(
      profileService.createProfile(matchSeeker1, { name: "   " })
    ).rejects.toThrow(/Profile name is mandatory/);
  });

  it("creates a flexible bio-data profile with arbitrary text properties", async () => {
    const created = await profileService.createProfile(matchSeeker1, {
      name: "Alice Seeker",
      details: [
        { label: "Occupation", value: "Software Engineer" },
        { label: "Location", value: "Bangalore" },
        { label: "Custom Diet", value: "Vegetarian" },
      ],
    });

    expect(created.profileId).toMatch(/^ALICE/);
    expect(created.name).toBe("Alice Seeker");
    expect(created.details).toHaveLength(3);
    expect(created.details[0].label).toBe("Occupation");
    expect(created.details[0].value).toBe("Software Engineer");
    expect(created.details[2].label).toBe("Custom Diet");
    expect(created.details[2].value).toBe("Vegetarian");
    expect(created.status).toBe("PENDING");
    expect(created.creationSource).toBe("MATCH_SEEKER");
    expect(created.tags).toEqual([]);
    expect(created.createdByUserId).toBe("seeker1");
  });

  it("strictly enforces the One-Profile Restriction for Match Seekers", async () => {
    // 1st profile creation succeeds
    await profileService.createProfile(matchSeeker1, {
      name: "Alice Seeker",
      details: [{ label: "City", value: "Mumbai" }],
    });

    // 2nd profile creation attempt by the same Match Seeker MUST FAIL
    await expect(
      profileService.createProfile(matchSeeker1, {
        name: "Alice Duplicate",
      })
    ).rejects.toThrow(/A Match Seeker can create only one active profile/);
  });

  it("allows Admins to create multiple profiles with Added by Admin tag and ADMIN source", async () => {
    const p1 = await profileService.createProfile(adminUser, {
      name: "Candidate One",
    });
    const p2 = await profileService.createProfile(adminUser, {
      name: "Candidate Two",
    });

    expect(p1.profileId).toBeDefined();
    expect(p2.profileId).toBeDefined();
    expect(p1.profileId).not.toBe(p2.profileId);
    expect(p1.creationSource).toBe("ADMIN");
    expect(p1.tags).toContain("Added by Admin");
    expect(p1.status).toBe("PENDING");
  });

  it("enforces profile ownership boundaries: Match Seeker cannot access another user's profile", async () => {
    const p1 = await profileService.createProfile(matchSeeker1, {
      name: "Alice Seeker",
    });

    // Seeker 1 can view own profile
    const readBySelf = await profileService.getProfileById(p1.profileId, matchSeeker1);
    expect(readBySelf.name).toBe("Alice Seeker");

    // Seeker 2 is forbidden from viewing Seeker 1's profile
    await expect(
      profileService.getProfileById(p1.profileId, matchSeeker2)
    ).rejects.toThrow(/Forbidden/);

    // Admin can view Seeker 1's profile
    const readByAdmin = await profileService.getProfileById(p1.profileId, adminUser);
    expect(readByAdmin.name).toBe("Alice Seeker");
  });

  it("updates profile while strictly preserving immutable fields (profileId, createdAt, createdBy)", async () => {
    const p1 = await profileService.createProfile(matchSeeker1, {
      name: "Alice Seeker",
      details: [{ label: "Occupation", value: "Junior Dev" }],
    });

    const updated = await profileService.updateProfile(p1.profileId, matchSeeker1, {
      name: "Alice Senior Seeker",
      details: [
        { id: p1.details[0].id, label: "Occupation", value: "Senior Dev" },
        { label: "Company", value: "TechCorp" },
      ],
    });

    expect(updated.name).toBe("Alice Senior Seeker");
    expect(updated.profileId).toBe(p1.profileId); // ID preserved
    expect(updated.createdAt).toBe(p1.createdAt); // createdAt preserved
    expect(updated.createdByUserId).toBe("seeker1"); // owner preserved
    expect(updated.details).toHaveLength(2);
    expect(updated.details[0].value).toBe("Senior Dev");
    expect(updated.details[1].label).toBe("Company");
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(p1.updatedAt).getTime()
    );
  });

  it("soft-deletes a profile properly", async () => {
    const p1 = await profileService.createProfile(matchSeeker1, {
      name: "Alice Seeker",
    });

    await profileService.deleteProfile(p1.profileId, matchSeeker1);

    // After soft-deletion, profile is not returned
    await expect(
      profileService.getProfileById(p1.profileId, matchSeeker1)
    ).rejects.toThrow(/not found/i);

    // Match Seeker can now create a new profile because the old one is deleted
    const p2 = await profileService.createProfile(matchSeeker1, {
      name: "Alice Second Profile",
    });
    expect(p2.profileId).toBeDefined();
  });

  it("provides accurate admin overview statistics and filtered listing", async () => {
    await profileService.createProfile(matchSeeker1, { name: "Alice" });
    await profileService.createProfile(matchSeeker2, { name: "Bob" });
    await profileService.createProfile(adminUser, { name: "Admin Created" });

    const stats = await profileService.getAdminStats(adminUser);
    expect(stats.totalProfiles).toBe(3);
    expect(stats.pendingProfiles).toBe(3);
    expect(stats.verifiedProfiles).toBe(0);
    expect(stats.ignoredProfiles).toBe(0);
    expect(stats.addedByAdmin).toBe(1);
    expect(stats.addedBySeeker).toBe(2);

    const listing = await profileService.listProfiles(adminUser, {
      search: "Alice",
    });
    expect(listing.profiles).toHaveLength(1);
    expect(listing.profiles[0].name).toBe("Alice");
  });
});
