import { AdminStats, ProfileListQuery, ProfileListResult, ProfileRecord } from "@/types/profile";
import { IProfileStore } from "./types";

export class InMemoryProfileStore implements IProfileStore {
  private profiles = new Map<string, ProfileRecord>();

  async saveProfile(profile: ProfileRecord): Promise<void> {
    // Clone to ensure immutability
    this.profiles.set(profile.profileId, JSON.parse(JSON.stringify(profile)));
  }

  async getProfileById(profileId: string): Promise<ProfileRecord | null> {
    const profile = this.profiles.get(profileId);
    if (!profile || profile.isDeleted) {
      return null;
    }
    return JSON.parse(JSON.stringify(profile));
  }

  async getActiveProfileByUserId(userId: string): Promise<ProfileRecord | null> {
    for (const profile of Array.from(this.profiles.values())) {
      if (profile.createdByUserId === userId && !profile.isDeleted) {
        return JSON.parse(JSON.stringify(profile));
      }
    }
    return null;
  }

  async checkProfileIdExists(profileId: string): Promise<boolean> {
    return this.profiles.has(profileId);
  }

  async listProfiles(query: ProfileListQuery): Promise<ProfileListResult> {
    let all = Array.from(this.profiles.values()).filter((p) => !p.isDeleted);

    if (query.status) {
      all = all.filter((p) => p.status === query.status);
    }

    if (query.creationSource) {
      all = all.filter((p) => p.creationSource === query.creationSource);
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim().toLowerCase();
      all = all.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.profileId.toLowerCase().includes(term) ||
          p.details.some((d) => d.value.toLowerCase().includes(term) || d.label.toLowerCase().includes(term))
      );
    }

    // Sort by createdAt descending
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const total = all.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = all.slice(startIndex, startIndex + limit);

    return {
      profiles: JSON.parse(JSON.stringify(paginated)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getStats(): Promise<AdminStats> {
    const active = Array.from(this.profiles.values()).filter((p) => !p.isDeleted);
    let pending = 0;
    let verified = 0;
    let ignored = 0;
    let addedByAdmin = 0;
    let addedBySeeker = 0;

    for (const p of active) {
      if (p.status === "PENDING") pending++;
      else if (p.status === "VERIFIED") verified++;
      else if (p.status === "IGNORED") ignored++;

      if (p.creationSource === "ADMIN") addedByAdmin++;
      else if (p.creationSource === "MATCH_SEEKER") addedBySeeker++;
    }

    return {
      totalProfiles: active.length,
      pendingProfiles: pending,
      verifiedProfiles: verified,
      ignoredProfiles: ignored,
      addedByAdmin,
      addedBySeeker,
    };
  }

  async clearAll(): Promise<void> {
    this.profiles.clear();
  }
}
