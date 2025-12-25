import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Poi } from '../types/poi';

const COLLECTION_NAME = 'pois';

export const PoiService = {
  // Subscribe to real-time updates
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
    try {
      await addDoc(collection(db, COLLECTION_NAME), poi);
    } catch (e) {
      console.error("Error adding POI: ", e);
    }
  },

  deletePoi: async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (e) {
      console.error("Error deleting POI: ", e);
    }
  }
};
