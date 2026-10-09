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

const COL_PLANOS = "planos_aula";
const COL_ATENDIMENTOS = "atendimentos_pedagogicos";
const COL_REFORCO = "grupos_reforco";
const COL_CONSELHOS = "conselhos_classe";

// ==========================================
// 1. GESTÃO DE PLANOS DE AULA & DIÁRIOS
// ==========================================

export async function getPlanosAula(escolaId, mes = null, ano = null) {
  if (!escolaId) return [];
  try {
    const q = query(collection(db, COL_PLANOS), where("escolaId", "==", escolaId));
    const snap = await getDocs(q);
    let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (mes) list = list.filter(p => Number(p.mes) === Number(mes));
    if (ano) list = list.filter(p => Number(p.ano) === Number(ano));

    return list.sort((a, b) => {
      const dataA = new Date(a.dataEntrega || a.criadoEm || 0).getTime();
      const dataB = new Date(b.dataEntrega || b.criadoEm || 0).getTime();
      return dataB - dataA;
    });
  } catch (error) {
    console.error("Erro ao buscar planos de aula:", error);
    return [];
  }
}

export async function salvarPlanoAula(plano, escolaId) {
  if (plano.id) {
    const { id, ...resto } = plano;
    await updateDoc(doc(db, COL_PLANOS, id), {
      ...resto,
      atualizadoEm: serverTimestamp()
    });
    return id;
  } else {
    const docRef = await addDoc(collection(db, COL_PLANOS), {
      ...plano,
      escolaId,
      status: plano.status || "Pendente",
      criadoEm: serverTimestamp()
    });
    return docRef.id;
  }
}

export async function atualizarStatusPlanoAula(id, status, parecerCoordenador = "") {
  await updateDoc(doc(db, COL_PLANOS, id), {
    status,
    parecerCoordenador,
    validadoEm: serverTimestamp()
  });
}

// ==========================================
// 2. ATENDIMENTOS E INTERVENÇÕES PEDAGÓGICAS
// ==========================================

export async function getAtendimentosPedagogicos(escolaId) {
  if (!escolaId) return [];
  try {
    const q = query(collection(db, COL_ATENDIMENTOS), where("escolaId", "==", escolaId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return list.sort((a, b) => {
      const dataA = new Date(a.dataAtendimento || a.criadoEm || 0).getTime();
      const dataB = new Date(b.dataAtendimento || b.criadoEm || 0).getTime();
      return dataB - dataA;
    });
  } catch (error) {
    console.error("Erro ao buscar atendimentos pedagógicos:", error);
    return [];
  }
}

export async function salvarAtendimentoPedagogico(atendimento, escolaId) {
  if (atendimento.id) {
    const { id, ...resto } = atendimento;
    await updateDoc(doc(db, COL_ATENDIMENTOS, id), {
      ...resto,
      atualizadoEm: serverTimestamp()
    });
    return id;
  } else {
    const docRef = await addDoc(collection(db, COL_ATENDIMENTOS), {
      ...atendimento,
      escolaId,
      criadoEm: serverTimestamp()
    });
    return docRef.id;
  }
}

export async function deleteAtendimentoPedagogico(id) {
  await deleteDoc(doc(db, COL_ATENDIMENTOS, id));
}

// ==========================================
// 3. GRUPOS DE REFORÇO ESCOLAR & RECOMPOSIÇÃO
// ==========================================

export async function getGruposReforco(escolaId) {
  if (!escolaId) return [];
  try {
    const q = query(collection(db, COL_REFORCO), where("escolaId", "==", escolaId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return list.sort((a, b) => (a.disciplina || "").localeCompare(b.disciplina || ""));
  } catch (error) {
    console.error("Erro ao buscar grupos de reforço:", error);
    return [];
  }
}

export async function salvarGrupoReforco(grupo, escolaId) {
  if (grupo.id) {
    const { id, ...resto } = grupo;
    await updateDoc(doc(db, COL_REFORCO, id), {
      ...resto,
      atualizadoEm: serverTimestamp()
    });
    return id;
  } else {
    const docRef = await addDoc(collection(db, COL_REFORCO), {
      ...grupo,
      escolaId,
      status: grupo.status || "Ativo",
      criadoEm: serverTimestamp()
    });
    return docRef.id;
  }
}

export async function deleteGrupoReforco(id) {
  await deleteDoc(doc(db, COL_REFORCO, id));
}

// ==========================================
// 4. CONSELHOS DE CLASSE & REUNIÕES PEDAGÓGICAS
// ==========================================

export async function getConselhosClasse(escolaId) {
  if (!escolaId) return [];
  try {
    const q = query(collection(db, COL_CONSELHOS), where("escolaId", "==", escolaId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return list.sort((a, b) => {
      const dataA = new Date(a.data || 0).getTime();
      const dataB = new Date(b.data || 0).getTime();
      return dataB - dataA;
    });
  } catch (error) {
    console.error("Erro ao buscar conselhos de classe:", error);
    return [];
  }
}

export async function salvarAtaConselho(ata, escolaId) {
  if (ata.id) {
    const { id, ...resto } = ata;
    await updateDoc(doc(db, COL_CONSELHOS, id), {
      ...resto,
      atualizadoEm: serverTimestamp()
    });
    return id;
  } else {
    const docRef = await addDoc(collection(db, COL_CONSELHOS), {
      ...ata,
      escolaId,
      criadoEm: serverTimestamp()
    });
    return docRef.id;
  }
}
