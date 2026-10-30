import type { FirebaseOptions } from 'firebase/app';

// Public web config of the Firebase project that stores blog views and
// thumbs-ups (Firebase console → Project settings → Your apps → Web app).
// These values are not secrets: access is governed by firestore.rules.
// Set this to null to hide the counters.
export const firebaseConfig: FirebaseOptions | null = {
    apiKey: 'AIzaSyAl-REpY_K4KTwf0mrAWx1BcTVrcaBvm7I',
    authDomain: 'zahinblog.firebaseapp.com',
    projectId: 'zahinblog',
    storageBucket: 'zahinblog.firebasestorage.app',
    messagingSenderId: '602191382093',
    appId: '1:602191382093:web:e24dd45c4d1a7c200ffe04',
};
