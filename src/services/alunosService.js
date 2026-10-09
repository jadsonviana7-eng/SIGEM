import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, query, orderBy, where, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

const COL = "alunos";

export async function getAlunos(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
}

export async function getAlunoById(id) {
  if (!id) return null;
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getAllAlunos() {
  const snap = await getDocs(collection(db, COL));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
}

export async function getAlunosByTurma(turma, escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL), where("escolaId", "==", escolaId), where("turma", "==", turma));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
}

export async function addAluno(dados, escolaId) {
  return addDoc(collection(db, COL), { ...dados, escolaId, criadoEm: serverTimestamp() });
}

export async function updateAluno(id, dados) {
  return updateDoc(doc(db, COL, id), { ...dados, atualizadoEm: serverTimestamp() });
}

export async function deleteAluno(id) {
  return deleteDoc(doc(db, COL, id));
}

export async function rematricularAlunosLote(alunoIds, novaTurma, novoAno, novoTurno) {
  if (!alunoIds || !alunoIds.length) return;
  const promessas = alunoIds.map(id => {
    return updateDoc(doc(db, COL, id), {
      turma: novaTurma,
      ...(novoAno ? { ano: novoAno } : {}),
      ...(novoTurno ? { turno: novoTurno } : {}),
      status: "Ativo",
      situacaoMatricula: "Renovação",
      anoLetivoMatricula: new Date().getFullYear(),
      dataRematricula: new Date().toISOString(),
      atualizadoEm: serverTimestamp()
    });
  });
  return Promise.all(promessas);
}

export async function rematricularAluno(id, dadosRematricula) {
  return updateDoc(doc(db, COL, id), {
    ...dadosRematricula,
    status: "Ativo",
    situacaoMatricula: "Renovação",
    dataRematricula: new Date().toISOString(),
    atualizadoEm: serverTimestamp()
  });
}

export async function remanejarAluno(id, dadosRemanejamento) {
  const {
    novaTurma,
    novoAno,
    novoTurno,
    turmaOrigem,
    motivo,
    observacoes,
    dataRemanejamento = new Date().toISOString(),
    usuarioNome = ""
  } = dadosRemanejamento;

  const snap = await getDoc(doc(db, COL, id));
  const alunoData = snap.exists() ? snap.data() : {};
  const historicoAntigo = Array.isArray(alunoData.historicoRemanejamento) ? alunoData.historicoRemanejamento : [];

  const novoRegistro = {
    id: "rem_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    data: dataRemanejamento,
    turmaOrigem: turmaOrigem || alunoData.turma || "Não informada",
    turmaDestino: novaTurma,
    ano: novoAno || alunoData.ano || "",
    turno: novoTurno || alunoData.turno || "",
    motivo: motivo || "Remanejamento Interno de Turma",
    observacoes: observacoes || "",
    usuarioNome: usuarioNome || "Secretaria Escolar",
    registradoEm: new Date().toISOString()
  };

  return updateDoc(doc(db, COL, id), {
    turma: novaTurma,
    ...(novoAno ? { ano: novoAno } : {}),
    ...(novoTurno ? { turno: novoTurno } : {}),
    historicoRemanejamento: [novoRegistro, ...historicoAntigo],
    atualizadoEm: serverTimestamp()
  });
}

export async function remanejarAlunosLote(alunoIds, dadosLote) {
  if (!alunoIds || !alunoIds.length) return;
  const promessas = alunoIds.map(id => remanejarAluno(id, dadosLote));
  return Promise.all(promessas);
}

export async function salvarTrajetoriaAluno(alunoId, listaTrajetoria) {
  return updateDoc(doc(db, COL, alunoId), {
    trajetoriaEscolar: listaTrajetoria,
    atualizadoEm: serverTimestamp()
  });
}

export async function adicionarMarcoTrajetoria(alunoId, novoMarco) {
  const snap = await getDoc(doc(db, COL, alunoId));
  const alunoData = snap.exists() ? snap.data() : {};
  const trajetoriaAntiga = Array.isArray(alunoData.trajetoriaEscolar) ? alunoData.trajetoriaEscolar : [];
  
  const itemFormatado = {
    id: "traj_" + Date.now(),
    anoLetivo: novoMarco.anoLetivo || new Date().getFullYear().toString(),
    serieAno: novoMarco.serieAno || "",
    escola: novoMarco.escola || "",
    cidadeUf: novoMarco.cidadeUf || "",
    situacaoFinal: novoMarco.situacaoFinal || "Aprovado",
    frequenciaPercentual: novoMarco.frequenciaPercentual || "",
    mediaFinal: novoMarco.mediaFinal || "",
    observacoes: novoMarco.observacoes || ""
  };

  const trajetoriaAtualizada = [...trajetoriaAntiga, itemFormatado].sort((a, b) => Number(a.anoLetivo || 0) - Number(b.anoLetivo || 0));

  return updateDoc(doc(db, COL, alunoId), {
    trajetoriaEscolar: trajetoriaAtualizada,
    atualizadoEm: serverTimestamp()
  });
}




