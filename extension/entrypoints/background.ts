import { auth, db } from '../utils/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default defineBackground(() => {
  console.log('Background service started');

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'SAVE_POI') {
      return handleSavePoi(message.data).then(() => true).catch(err => {
          console.error(err);
          throw err;
      });
    }
  });
});

async function handleSavePoi(data: any) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User not logged in");
    }

    await addDoc(collection(db, 'pois'), {
        ...data,
        userId: user.uid,
        userEmail: user.email,
        createdAt: Date.now()
    });
}
