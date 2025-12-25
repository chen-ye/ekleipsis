import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { Poi } from '../types/poi';

const COLLECTION_NAME = 'pois';

export const PoiService = {
  // Subscribe to real-time updates (Public read)
  subscribePois: (callback: (pois: Poi[]) => void) => {
    // If db is not initialized (api key missing), return empty logic or error handling
    if (!db) {
        console.warn("Firestore not initialized (missing config?)");
        return () => {};
    }

    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const pois = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poi));
      callback(pois);
    }, (error) => {
      console.error("Error getting POIs:", error);
    });
  },

  addPoi: async (poi: Omit<Poi, 'id'>) => {
    if (!db) {
        console.error("Cannot add POI: DB not initialized");
        return;
    }
    if (!auth.currentUser) {
        console.warn("Cannot add POI: User not authenticated");
        alert("Please login to add POIs");
        return;
    }
    try {
      // Add userId to POI? Maybe useful for rules later.
      // For now just enforce auth.
      await addDoc(collection(db, COLLECTION_NAME), {
          ...poi,
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email
      });
    } catch (e) {
      console.error("Error adding POI: ", e);
      alert("Error adding POI (Permission Denied?)");
    }
  },

  deletePoi: async (id: string) => {
    if (!db) return;
    if (!auth.currentUser) {
        console.warn("Cannot delete POI: User not authenticated");
        alert("Please login to delete POIs");
        return;
    }
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (e) {
      console.error("Error deleting POI: ", e);
      alert("Error deleting POI (Permission Denied?)");
    }
  }
};
