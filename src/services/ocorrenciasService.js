import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

const COL = "ocorrencias";

/**
 * Retorna todas as ocorrências de uma escola com ordenação por data/hora
 */
export async function getOcorrenciasEscola(escolaId) {
  if (!escolaId) return [];
  const q = query(
    collection(db, COL),
    where("escolaId", "==", escolaId)
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Ordena por data decrescente e hora decrescente
  docs.sort((a, b) => {
    const dataHoraA = new Date(`${a.data || "1970-01-01"}T${a.hora || "00:00"}:00`).getTime();
    const dataHoraB = new Date(`${b.data || "1970-01-01"}T${b.hora || "00:00"}:00`).getTime();
    if (!isNaN(dataHoraA) && !isNaN(dataHoraB) && dataHoraA !== dataHoraB) {
      return dataHoraB - dataHoraA;
    }
    const criadoA = a.criadoEm?.toMillis ? a.criadoEm.toMillis() : 0;
    const criadoB = b.criadoEm?.toMillis ? b.criadoEm.toMillis() : 0;
    return criadoB - criadoA;
  });

  return docs;
}

/**
 * Retorna as ocorrências de um aluno específico
 */
export async function getOcorrenciasAluno(alunoId, escolaId) {
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

  docs.sort((a, b) => {
    const dataHoraA = new Date(`${a.data || "1970-01-01"}T${a.hora || "00:00"}:00`).getTime();
    const dataHoraB = new Date(`${b.data || "1970-01-01"}T${b.hora || "00:00"}:00`).getTime();
    if (!isNaN(dataHoraA) && !isNaN(dataHoraB) && dataHoraA !== dataHoraB) {
      return dataHoraB - dataHoraA;
    }
    const criadoA = a.criadoEm?.toMillis ? a.criadoEm.toMillis() : 0;
    const criadoB = b.criadoEm?.toMillis ? b.criadoEm.toMillis() : 0;
    return criadoB - criadoA;
  });

  return docs;
}

/**
 * Registra uma nova ocorrência escolar com acompanhamento estruturado
 */
export async function addOcorrencia(ocorrencia, escolaId) {
  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const codigoUnico = `OCO-${anoAtual}-${Math.floor(1000 + Math.random() * 9000)}`;

  const despachoInicial = {
    id: "desp_" + Date.now(),
    dataHora: agora.toISOString(),
    autor: ocorrencia.responsavelRegistro || "Equipe Escolar",
    cargo: ocorrencia.cargoResponsavel || "Responsável pelo Registro",
    tipoAcao: "Abertura de Ocorrência",
    descricao: "Ocorrência registrada no sistema e aguardando encaminhamento.",
    statusResultante: ocorrencia.status || "Aberta"
  };

  const novaOcorrencia = {
    ...ocorrencia,
    codigo: ocorrencia.codigo || codigoUnico,
    escolaId,
    status: ocorrencia.status || "Aberta",
    gravidade: ocorrencia.gravidade || "media",
    anexos: Array.isArray(ocorrencia.anexos) ? ocorrencia.anexos : [],
    envolvidos: ocorrencia.envolvidos || "",
    historicoAcompanhamento: [
      despachoInicial,
      ...(Array.isArray(ocorrencia.historicoAcompanhamento) ? ocorrencia.historicoAcompanhamento : [])
    ],
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, COL), novaOcorrencia);
  return docRef.id;
}

/**
 * Atualiza os dados principais de uma ocorrência
 */
export async function updateOcorrencia(id, dados) {
  const ref = doc(db, COL, id);
  await updateDoc(ref, {
    ...dados,
    atualizadoEm: serverTimestamp()
  });
}

/**
 * Adiciona um novo despacho / acompanhamento à ocorrência
 */
export async function adicionarDespachoAcompanhamento(id, ocorrenciaAtual, novoDespacho) {
  const ref = doc(db, COL, id);
  const agora = new Date();

  const despachoFormatado = {
    id: "desp_" + Date.now(),
    dataHora: agora.toISOString(),
    autor: novoDespacho.autor || "Coordenação Pedagógica",
    cargo: novoDespacho.cargo || "Gestão Escolar",
    tipoAcao: novoDespacho.tipoAcao || "Registro de Acompanhamento",
    descricao: novoDespacho.descricao || "",
    statusResultante: novoDespacho.novoStatus || ocorrenciaAtual.status,
    anexoUrl: novoDespacho.anexoUrl || null
  };

  const listaAtualizada = [
    ...(ocorrenciaAtual.historicoAcompanhamento || []),
    despachoFormatado
  ];

  await updateDoc(ref, {
    status: novoDespacho.novoStatus || ocorrenciaAtual.status,
    historicoAcompanhamento: listaAtualizada,
    atualizadoEm: serverTimestamp()
  });

  return despachoFormatado;
}

/**
 * Exclui uma ocorrência do sistema
 */
export async function deleteOcorrencia(id) {
  await deleteDoc(doc(db, COL, id));
}
