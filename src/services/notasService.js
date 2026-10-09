import {
  collection, setDoc, getDocs,
  doc, query, where, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

const COL = "notas";

// id: "{alunoId}_{turma}_{disciplina}_{ano}"
export async function getNotasTurma(turma, disciplina, ano, escolaId) {
  if (!escolaId) return [];
  const q = query(
    collection(db, COL),
    where("escolaId", "==", escolaId),
    where("turma", "==", turma),
    where("disciplina", "==", disciplina),
    where("anoLetivo", "==", ano)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getNotasAluno(alunoId, escolaId) {
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
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function salvarNota(alunoId, turma, disciplina, anoLetivo, bimestres, escolaId) {
  const docId = `${alunoId}_${turma}_${disciplina}_${anoLetivo}`.replace(/\s/g, "_");
  const vals = Object.values(bimestres).map(Number).filter((v) => !isNaN(v));
  const media = vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
  return setDoc(doc(db, COL, docId), {
    alunoId,
    turma,
    disciplina,
    anoLetivo,
    bimestres, // { b1: 7.5, b2: 8.0, b3: null, b4: null }
    media,
    escolaId,
    atualizadoEm: serverTimestamp(),
  });
}

