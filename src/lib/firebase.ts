
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

// Enable Firestore persistence and network management
if (typeof window !== 'undefined') {
    const setupPersistence = async () => {
        try {
            await enableIndexedDbPersistence(db);
            console.log('📦 Firestore persistence enabled');
        } catch (err) {
            if ((err as any).code === 'failed-precondition') {
                console.warn('⚠️ Firestore persistence failed: multiple tabs open or other issue.');
            } else if ((err as any).code === 'unimplemented') {
                console.warn('⚠️ Firestore persistence not supported in this browser.');
            } else {
                console.error("⚠️ Firestore persistence error:", err);
            }
        }
    };

    setupPersistence();
    
    // Manage network status based on browser connectivity
    window.addEventListener("online", () => {
        console.log("Browser is online, enabling Firestore network.");
        enableNetwork(db);
    });
    
    window.addEventListener("offline", () => {
        console.log("Browser is offline, disabling Firestore network.");
        disableNetwork(db);
    });
}


export { firebaseApp, db, storage };
