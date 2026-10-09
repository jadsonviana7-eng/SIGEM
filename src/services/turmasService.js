import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, query, orderBy, where, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

const COL = "turmas";

export async function getTurmas(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
}

export async function getAllTurmas() {
  const snap = await getDocs(collection(db, COL));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
}

export async function addTurma(dados, escolaId) {
  return addDoc(collection(db, COL), { ...dados, escolaId, criadoEm: serverTimestamp() });
}

export async function updateTurma(id, dados) {
  return updateDoc(doc(db, COL, id), { ...dados, atualizadoEm: serverTimestamp() });
}

export async function deleteTurma(id) {
  return deleteDoc(doc(db, COL, id));
}
