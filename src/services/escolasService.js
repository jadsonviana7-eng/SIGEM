import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, query, orderBy, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

const COL = "escolas";

export async function getEscolas() {
  const q = query(collection(db, COL), orderBy("nome"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addEscola(dados) {
  return addDoc(collection(db, COL), { ...dados, criadoEm: serverTimestamp() });
}

export async function updateEscola(id, dados) {
  return updateDoc(doc(db, COL, id), { ...dados, atualizadoEm: serverTimestamp() });
}

export async function deleteEscola(id) {
  return deleteDoc(doc(db, COL, id));
}
