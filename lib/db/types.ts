import { AdminStats, ProfileListQuery, ProfileListResult, ProfileRecord } from "@/types/profile";

export interface IProfileStore {
  saveProfile(profile: ProfileRecord): Promise<void>;
  getProfileById(profileId: string): Promise<ProfileRecord | null>;
  getActiveProfileByUserId(userId: string): Promise<ProfileRecord | null>;
  checkProfileIdExists(profileId: string): Promise<boolean>;
  listProfiles(query: ProfileListQuery): Promise<ProfileListResult>;
  getStats(): Promise<AdminStats>;
  clearAll?(): Promise<void>;
}
