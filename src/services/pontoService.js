import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

const COL_PONTO = "folha_pontos";

/**
 * Retorna os registros de ponto dos servidores para uma competência (mês/ano) e escola específica.
 * Se escolaId for nulo/vazio, retorna de todas as escolas (visão SEMED).
 */
export async function getPontosCompetencia(mes, ano, escolaId = null) {
  let q;
  if (escolaId) {
    q = query(
      collection(db, COL_PONTO),
      where("mes", "==", Number(mes)),
      where("ano", "==", Number(ano)),
      where("escolaId", "==", escolaId)
    );
  } else {
    q = query(
      collection(db, COL_PONTO),
      where("mes", "==", Number(mes)),
      where("ano", "==", Number(ano))
    );
  }

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Salva ou atualiza o registro de ponto de um servidor em uma competência
 */
export async function salvarPontoServidor(dados) {
  const { servidorId, mes, ano, escolaId } = dados;
  const docId = `${servidorId}_${ano}_${mes}`.replace(/\s+/g, "_");
  const docRef = doc(db, COL_PONTO, docId);

  await setDoc(docRef, {
    ...dados,
    mes: Number(mes),
    ano: Number(ano),
    escolaId,
    atualizadoEm: serverTimestamp()
  }, { merge: true });

  return docId;
}

/**
 * Salva múltiplos registros de ponto em lote (ex: preenchimento em lote pela escola)
 */
export async function salvarPontosEmLote(listaPontos) {
  const promises = listaPontos.map(p => salvarPontoServidor(p));
  await Promise.all(promises);
  return true;
}

/**
 * Atualiza o status do espelho de ponto da escola (ex: "Em Aberto", "Enviado à Secretaria", "Homologado")
 */
export async function atualizarStatusPontoEscola(mes, ano, escolaId, novoStatus) {
  const pontos = await getPontosCompetencia(mes, ano, escolaId);
  const promises = pontos.map(p => {
    return updateDoc(doc(db, COL_PONTO, p.id), {
      statusEnvio: novoStatus,
      dataEnvio: new Date().toISOString()
    });
  });
  await Promise.all(promises);
  return true;
}
