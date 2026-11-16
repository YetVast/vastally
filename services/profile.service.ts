import { getProfileStore } from "@/lib/db";
import { generateUniqueProfileId } from "@/lib/profile-id/generator";
import { assertAdmin, assertAuthenticated } from "@/lib/auth/rbac";
import {
  AdminStats,
  CreateProfileInput,
  ProfileDetailItem,
  ProfileListQuery,
  ProfileListResult,
  ProfileRecord,
  UpdateProfileInput,
} from "@/types/profile";
import { VastSessionUser } from "@/types/user";
import crypto from "crypto";

export class ProfileService {
  private get store() {
    return getProfileStore();
  }

  /**
   * Creates a new profile with strict validation and server-side role enforcement.
   */
  async createProfile(user: VastSessionUser, input: CreateProfileInput): Promise<ProfileRecord> {
    assertAuthenticated(user);

    const trimmedName = input.name?.trim();
    if (!trimmedName) {
      const err = new Error("Profile name is mandatory and cannot be empty.");
      (err as unknown as { status: number }).status = 400;
      throw err;
    }

    // Match Seeker one-profile restriction
    if (user.role === "MATCH_SEEKER") {
      const existing = await this.store.getActiveProfileByUserId(user.yvUserId);
      if (existing) {
        const err = new Error("A Match Seeker can create only one active profile.");
        (err as unknown as { status: number }).status = 409;
        throw err;
      }
    }

    // Generate unique immutable profile ID
    const profileId = await generateUniqueProfileId(trimmedName, (id) => this.store.checkProfileIdExists(id));

    const now = new Date().toISOString();
    const isAdmin = user.role === "ADMIN";
    const creationSource = isAdmin ? "ADMIN" : "MATCH_SEEKER";
    const tags: string[] = isAdmin ? ["Added by Admin"] : [];

    // Filter and sanitize detail rows
    const details: ProfileDetailItem[] = (input.details || [])
      .filter((d) => d.label?.trim() && d.value?.trim())
      .map((d) => ({
        id: crypto.randomUUID(),
        label: d.label.trim(),
        value: d.value.trim(),
      }));

    const profile: ProfileRecord = {
      profileId,
      name: trimmedName,
      details,
      createdBy: user.displayName || user.email || user.yvUserId,
      createdByUserId: user.yvUserId,
      creationSource,
      createdAt: now,
      updatedAt: now,
      status: "PENDING",
      tags,
      moderationHistory: [],
      isDeleted: false,
    };

    await this.store.saveProfile(profile);
    return profile;
  }

  /**
   * Retrieves a profile by ID with strict ownership/admin access checks.
   */
  async getProfileById(profileId: string, user: VastSessionUser): Promise<ProfileRecord> {
    assertAuthenticated(user);

    const profile = await this.store.getProfileById(profileId);
    if (!profile) {
      const err = new Error("Profile not found.");
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    // Admins can view any profile. Seekers can view ONLY their own profile.
    if (user.role !== "ADMIN" && profile.createdByUserId !== user.yvUserId) {
      const err = new Error("Forbidden: You do not have permission to view this profile.");
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    return profile;
  }

  /**
   * Retrieves the currently authenticated Match Seeker's active profile.
   */
  async getOwnProfile(user: VastSessionUser): Promise<ProfileRecord | null> {
    assertAuthenticated(user);
    return this.store.getActiveProfileByUserId(user.yvUserId);
  }

  /**
   * Updates an existing profile preserving immutable fields.
   */
  async updateProfile(profileId: string, user: VastSessionUser, input: UpdateProfileInput): Promise<ProfileRecord> {
    assertAuthenticated(user);

    const existing = await this.store.getProfileById(profileId);
    if (!existing) {
      const err = new Error("Profile not found.");
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    // Only Admin or the profile owner can edit
    if (user.role !== "ADMIN" && existing.createdByUserId !== user.yvUserId) {
      const err = new Error("Forbidden: You do not have permission to edit this profile.");
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    const trimmedName = input.name?.trim();
    if (!trimmedName) {
      const err = new Error("Profile name is mandatory and cannot be empty.");
      (err as unknown as { status: number }).status = 400;
      throw err;
    }

    const updatedDetails: ProfileDetailItem[] = (input.details || [])
      .filter((d) => d.label?.trim() && d.value?.trim())
      .map((d) => ({
        id: d.id || crypto.randomUUID(),
        label: d.label.trim(),
        value: d.value.trim(),
      }));

    const updated: ProfileRecord = {
      ...existing,
      name: trimmedName,
      details: updatedDetails,
      updatedAt: new Date().toISOString(),
      // Preserved invariants:
      profileId: existing.profileId,
      createdBy: existing.createdBy,
      createdByUserId: existing.createdByUserId,
      creationSource: existing.creationSource,
      createdAt: existing.createdAt,
      status: existing.status,
      tags: existing.tags,
      moderationHistory: existing.moderationHistory,
      isDeleted: false,
    };

    await this.store.saveProfile(updated);
    return updated;
  }

  /**
   * Soft-deletes a profile with authorization checks.
   */
  async deleteProfile(profileId: string, user: VastSessionUser): Promise<void> {
    assertAuthenticated(user);

    const existing = await this.store.getProfileById(profileId);
    if (!existing) {
      const err = new Error("Profile not found.");
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    // Only Admin or the owner can delete
    if (user.role !== "ADMIN" && existing.createdByUserId !== user.yvUserId) {
      const err = new Error("Forbidden: You do not have permission to delete this profile.");
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    const softDeleted: ProfileRecord = {
      ...existing,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: user.yvUserId,
      updatedAt: new Date().toISOString(),
    };

    await this.store.saveProfile(softDeleted);
  }

  /**
   * Admin-only: list all profiles with filters, search, and pagination.
   */
  async listProfiles(user: VastSessionUser, query: ProfileListQuery): Promise<ProfileListResult> {
    assertAdmin(user);
    return this.store.listProfiles(query);
  }

  /**
   * Admin-only: get aggregated overview statistics.
   */
  async getAdminStats(user: VastSessionUser): Promise<AdminStats> {
    assertAdmin(user);
    return this.store.getStats();
  }
}

export const profileService = new ProfileService();
