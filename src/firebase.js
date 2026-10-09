// =====================================================
//  firebase.js — Configure aqui suas credenciais
//  1. Acesse: https://console.firebase.google.com
//  2. Crie um projeto → Adicionar app (Web)
//  3. Copie o firebaseConfig gerado e cole abaixo
// =====================================================
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDnjruVXPzcKHqEwhfLA_lYORKRvcQzFp8",
  authDomain: "app-escola-6da78.firebaseapp.com",
  projectId: "app-escola-6da78",
  storageBucket: "app-escola-6da78.firebasestorage.app",
  messagingSenderId: "832827439469",
  appId: "1:832827439469:web:2b46522dcab4da72a18264",
  measurementId: "G-M7S0R7L124"
};

// Evita o erro "app already exists" no hot reload do React
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
