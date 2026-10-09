import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, query, orderBy, where, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

const COL = "conteudos";

export async function getConteudos(escolaId, turmaNome, disciplina, bimestre) {
  if (!escolaId) return [];
  try {
    let q = query(collection(db, COL), where("escolaId", "==", escolaId));
    if (turmaNome) {
      q = query(collection(db, COL), where("escolaId", "==", escolaId), where("turma", "==", turmaNome));
    }
    const snap = await getDocs(q);
    let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (disciplina) {
      list = list.filter(item => item.disciplina === disciplina);
    }
    if (bimestre) {
      list = list.filter(item => item.bimestre === bimestre);
    }

    return list.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
  } catch (err) {
    console.error("Erro ao buscar conteúdos ministrados:", err);
    return [];
  }
}

export async function getConteudosByTurma(escolaId, turmaNome) {
  if (!escolaId || !turmaNome) return [];
  try {
    const q = query(
      collection(db, COL),
      where("escolaId", "==", escolaId),
      where("turma", "==", turmaNome)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return list.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
  } catch (err) {
    console.error("Erro ao buscar conteúdos da turma:", err);
    return [];
  }
}

export async function addConteudo(dados, escolaId) {
  return addDoc(collection(db, COL), {
    ...dados,
    escolaId,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp()
  });
}

export async function updateConteudo(id, dados) {
  return updateDoc(doc(db, COL, id), {
    ...dados,
    atualizadoEm: serverTimestamp()
  });
}

export async function deleteConteudo(id) {
  return deleteDoc(doc(db, COL, id));
}
