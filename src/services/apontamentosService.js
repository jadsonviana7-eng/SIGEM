import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

const COL = "apontamentos";

export async function getApontamentosAluno(alunoId, escolaId) {
  if (!alunoId) return [];
  let q;
  if (escolaId) {
    q = query(
      collection(db, COL),
      where("escolaId", "==", escolaId),
      where("alunoId", "==", alunoId)
    );
  } else {
    q = query(
      collection(db, COL),
      where("alunoId", "==", alunoId)
    );
  }
  const snap = await getDocs(q);
  const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Ordena por data decrescente
  docs.sort((a, b) => {
    const dataA = new Date(a.data || 0).getTime();
    const dataB = new Date(b.data || 0).getTime();
    if (dataA !== dataB) return dataB - dataA;
    const criadoA = a.criadoEm?.toMillis ? a.criadoEm.toMillis() : 0;
    const criadoB = b.criadoEm?.toMillis ? b.criadoEm.toMillis() : 0;
    return criadoB - criadoA;
  });
  
  return docs;
}

export async function addApontamento(apontamento, escolaId) {
  const docRef = await addDoc(collection(db, COL), {
    ...apontamento,
    escolaId,
    criadoEm: serverTimestamp()
  });
  return docRef.id;
}

export async function updateApontamento(id, dados) {
  return updateDoc(doc(db, COL, id), {
    ...dados,
    atualizadoEm: serverTimestamp()
  });
}

export async function deleteApontamento(id) {
  await deleteDoc(doc(db, COL, id));
}
