import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, query, orderBy, where, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

const COL = "professores";

export async function getProfessores(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
}

export async function getAllProfessores() {
  const snap = await getDocs(collection(db, COL));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
}

export async function addProfessor(dados, escolaId) {
  return addDoc(collection(db, COL), { ...dados, escolaId, criadoEm: serverTimestamp() });
}

export async function updateProfessor(id, dados) {
  return updateDoc(doc(db, COL, id), { ...dados, atualizadoEm: serverTimestamp() });
}

export async function deleteProfessor(id) {
  return deleteDoc(doc(db, COL, id));
}
