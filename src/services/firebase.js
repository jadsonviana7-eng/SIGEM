// =====================================================
//  CONFIGURAÇÃO DO FIREBASE
//  Substitua os valores abaixo pelos do seu projeto
//  no Firebase Console: https://console.firebase.google.com
// =====================================================

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDnjruVXPzcKHqEwhfLA_lYORKRvcQzFp8",
  authDomain: "app-escola-6da78.firebaseapp.com",
  projectId: "app-escola-6da78",
  storageBucket: "app-escola-6da78.firebasestorage.app",
  messagingSenderId: "832827439469",
  appId: "1:832827439469:web:2b46522dcab4da72a18264",
  measurementId: "G-M7S0R7L124"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
