import { FirestoreProfileStore } from "./firestore-store";
import { InMemoryProfileStore } from "./in-memory-store";
import { IProfileStore } from "./types";

let currentStore: IProfileStore | null = null;

export function getProfileStore(): IProfileStore {
  if (currentStore) {
    return currentStore;
  }

  const hasFirebaseConfig =
    Boolean(process.env.FIREBASE_PROJECT_ID) &&
    (Boolean(process.env.FIREBASE_CLIENT_EMAIL) || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS));

  if (hasFirebaseConfig && process.env.NODE_ENV === "production") {
    try {
      currentStore = new FirestoreProfileStore();
      return currentStore;
    } catch (err) {
      console.warn("Failed to initialize FirestoreProfileStore, falling back to in-memory store:", err);
    }
  }

  currentStore = new InMemoryProfileStore();
  return currentStore;
}

export function setProfileStoreForTesting(store: IProfileStore | null) {
  currentStore = store;
}
