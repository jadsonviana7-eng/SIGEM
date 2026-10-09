// ── Professores ──────────────────────────────────────
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, where, serverTimestamp, setDoc, getDoc
} from 'firebase/firestore';
import { db } from './firebase';

// PROFESSORES
export async function getProfessores() {
  const q = query(collection(db, 'professores'), orderBy('nome'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function addProfessor(data) {
  return addDoc(collection(db, 'professores'), {
    ...data, criadoEm: serverTimestamp()
  });
}
export async function updateProfessor(id, data) {
  return updateDoc(doc(db, 'professores', id), {
    ...data, atualizadoEm: serverTimestamp()
  });
}
export async function deleteProfessor(id) {
  return deleteDoc(doc(db, 'professores', id));
}

// TURMAS
export async function getTurmas() {
  const q = query(collection(db, 'turmas'), orderBy('nome'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function addTurma(data) {
  return addDoc(collection(db, 'turmas'), {
    ...data, criadoEm: serverTimestamp()
  });
}
export async function updateTurma(id, data) {
  return updateDoc(doc(db, 'turmas', id), data);
}
export async function deleteTurma(id) {
  return deleteDoc(doc(db, 'turmas', id));
}

// FREQUÊNCIA
// docId: "{alunoId}_{ano}_{mes}"  ex: "abc123_2026_4"
export async function getFrequencia(alunoId, ano, mes) {
  const id = `${alunoId}_${ano}_${mes}`;
  const snap = await getDoc(doc(db, 'frequencias', id));
  return snap.exists() ? snap.data() : { dias: {} };
}

export async function getFrequenciasTurma(turma, ano, mes) {
  const q = query(
    collection(db, 'frequencias'),
    where('turma', '==', turma),
    where('ano', '==', ano),
    where('mes', '==', mes)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function setFrequencia(alunoId, turma, ano, mes, dias) {
  const id = `${alunoId}_${ano}_${mes}`;
  return setDoc(doc(db, 'frequencias', id), {
    alunoId, turma, ano, mes, dias,
    atualizadoEm: serverTimestamp()
  }, { merge: true });
}

// NOTAS
// docId: "{alunoId}_{ano}_{disciplina}"  ex: "abc123_2026_Matematica"
export async function getNotasTurma(turma, ano, disciplina) {
  const q = query(
    collection(db, 'notas'),
    where('turma', '==', turma),
    where('ano', '==', String(ano)),
    where('disciplina', '==', disciplina)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function setNota(alunoId, turma, ano, disciplina, bimestres) {
  const id = `${alunoId}_${ano}_${disciplina.replace(/\s/g, '_')}`;
  return setDoc(doc(db, 'notas', id), {
    alunoId, turma, ano: String(ano), disciplina, bimestres,
    atualizadoEm: serverTimestamp()
  }, { merge: true });
}

export * from './alunosService';
export * from './auditoriaService';
