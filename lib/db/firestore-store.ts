import { AdminStats, ProfileListQuery, ProfileListResult, ProfileRecord } from "@/types/profile";
import { IProfileStore } from "./types";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export class FirestoreProfileStore implements IProfileStore {
  private db: FirebaseFirestore.Firestore;
  private collectionName = "profiles";

  constructor() {
    if (!getApps().length) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

      if (projectId && clientEmail && privateKey) {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      } else {
        initializeApp();
      }
    }
    this.db = getFirestore();
  }

  async saveProfile(profile: ProfileRecord): Promise<void> {
    const docRef = this.db.collection(this.collectionName).doc(profile.profileId);
    await docRef.set(profile);
  }

  async getProfileById(profileId: string): Promise<ProfileRecord | null> {
    const docRef = this.db.collection(this.collectionName).doc(profileId);
    const snap = await docRef.get();
    if (!snap.exists) return null;
    const data = snap.data() as ProfileRecord;
    if (data.isDeleted) return null;
    return data;
  }

  async getActiveProfileByUserId(userId: string): Promise<ProfileRecord | null> {
    const snap = await this.db
      .collection(this.collectionName)
      .where("createdByUserId", "==", userId)
      .where("isDeleted", "==", false)
      .limit(1)
      .get();

    if (snap.empty) return null;
    return snap.docs[0].data() as ProfileRecord;
  }

  async checkProfileIdExists(profileId: string): Promise<boolean> {
    const docRef = this.db.collection(this.collectionName).doc(profileId);
    const snap = await docRef.get();
    return snap.exists;
  }

  async listProfiles(query: ProfileListQuery): Promise<ProfileListResult> {
    let q: FirebaseFirestore.Query = this.db.collection(this.collectionName).where("isDeleted", "==", false);

    if (query.status) {
      q = q.where("status", "==", query.status);
    }

    if (query.creationSource) {
      q = q.where("creationSource", "==", query.creationSource);
    }

    q = q.orderBy("createdAt", "desc");

    const snap = await q.get();
    let all = snap.docs.map((d) => d.data() as ProfileRecord);

    if (query.search && query.search.trim()) {
      const term = query.search.trim().toLowerCase();
      all = all.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.profileId.toLowerCase().includes(term) ||
          p.details.some((d) => d.value.toLowerCase().includes(term) || d.label.toLowerCase().includes(term))
      );
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const total = all.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = all.slice(startIndex, startIndex + limit);

    return {
      profiles: paginated,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getStats(): Promise<AdminStats> {
    const snap = await this.db.collection(this.collectionName).where("isDeleted", "==", false).get();
    const active = snap.docs.map((d) => d.data() as ProfileRecord);

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
}
