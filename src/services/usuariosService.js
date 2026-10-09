import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import {
  doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

const COL = "usuarios";

// Configuração do Firebase necessária para inicializar o app secundário de registro
const firebaseConfig = {
  apiKey: "AIzaSyDnjruVXPzcKHqEwhfLA_lYORKRvcQzFp8",
  authDomain: "app-escola-6da78.firebaseapp.com",
  projectId: "app-escola-6da78",
  storageBucket: "app-escola-6da78.firebasestorage.app",
  messagingSenderId: "832827439469",
  appId: "1:832827439469:web:2b46522dcab4da72a18264",
};

/**
 * Registra um novo usuário no Firebase Auth sem deslogar o administrador logado atualmente.
 * @param {string} email 
 * @param {string} senha 
 * @returns {Promise<string>} O UID do usuário criado no Auth
 */
export async function criarUsuarioNoAuth(email, senha) {
  const appName = "SecondaryRegistrationApp_" + Date.now();
  const tempApp = initializeApp(firebaseConfig, appName);
  const tempAuth = getAuth(tempApp);
  try {
    const cred = await createUserWithEmailAndPassword(tempAuth, email, senha);
    await signOut(tempAuth);
    return cred.user.uid;
  } finally {
    try {
      await deleteApp(tempApp);
    } catch (e) {
      console.warn("Erro ao finalizar app secundário:", e);
    }
  }
}

export async function getUsuarios(escolaId) {
  let snap;
  if (escolaId) {
    const q = query(collection(db, COL), where("escolaId", "==", escolaId));
    snap = await getDocs(q);
  } else {
    snap = await getDocs(collection(db, COL));
  }
  const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return lista.sort((a, b) => (a.nome || a.email || "").localeCompare(b.nome || b.email || ""));
}

export async function getAllUsuarios() {
  const snap = await getDocs(collection(db, COL));
  const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return lista.sort((a, b) => (a.nome || a.email || "").localeCompare(b.nome || b.email || ""));
}

export async function getUsuario(uid) {
  const d = await getDoc(doc(db, COL, uid));
  if (d.exists()) {
    return { id: d.id, ...d.data() };
  }
  return null;
}

export async function addUsuario(uid, dados) {
  return setDoc(doc(db, COL, uid), {
    ...dados,
    criadoEm: serverTimestamp()
  });
}

export async function updateUsuario(uid, dados) {
  return updateDoc(doc(db, COL, uid), {
    ...dados,
    atualizadoEm: serverTimestamp()
  });
}

export async function deleteUsuario(uid) {
  return deleteDoc(doc(db, COL, uid));
}
export { firebaseConfig };
