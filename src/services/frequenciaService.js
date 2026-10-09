import {
  collection, setDoc, getDocs,
  doc, query, where, serverTimestamp, addDoc
} from "firebase/firestore";
import { db } from "../firebase";

const COL = "frequencias";
const DIARIOS_COL = "diarios";

// id do documento: "{alunoId}_{ano}_{mes}" (ex: "abc123_2026_3")
export async function getFrequenciasTurma(turma, ano, mes, escolaId) {
  if (!escolaId) return [];
  const q = query(
    collection(db, COL),
    where("escolaId", "==", escolaId),
    where("turma", "==", turma),
    where("ano", "==", ano),
    where("mes", "==", mes)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getFrequenciasAluno(alunoId, escolaId) {
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


export async function salvarFrequencia(alunoId, turma, ano, mes, dias, escolaId) {
  const docId = `${alunoId}_${ano}_${mes}`;
  return setDoc(doc(db, COL, docId), {
    alunoId,
    turma,
    ano,
    mes,
    dias, // { 1: "P", 2: "F", 3: "P", ... }
    escolaId,
    atualizadoEm: serverTimestamp(),
  }, { merge: true });
}

export async function salvarDiarioDeClasse(diario, frequenciasDiarias, escolaId) {
  // 1. Salvar os metadados do diário
  const diarioDoc = await addDoc(collection(db, DIARIOS_COL), {
    ...diario,
    escolaId,
    criadoEm: serverTimestamp()
  });

  // 2. Atualizar o mapa mensal de frequência
  const { data, turma } = diario;
  const d = new Date(data + "T12:00:00");
  const ano = d.getFullYear();
  const mes = d.getMonth();
  const dia = d.getDate();

  const promessas = Object.entries(frequenciasDiarias).map(([alunoId, status]) => {
    const docId = `${alunoId}_${ano}_${mes}`;
    return setDoc(doc(db, COL, docId), {
      alunoId,
      turma,
      ano,
      mes,
      escolaId,
      [`dias.${dia}`]: status,
      atualizadoEm: serverTimestamp(),
    }, { merge: true });
  });

  await Promise.all(promessas);
  return diarioDoc.id;
}
