import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, query, orderBy, where, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";
import { updateAluno } from "./alunosService";

const COL = "transferencias";

export async function getTransferencias(escolaId) {
  if (!escolaId) return [];
  try {
    const q = query(
      collection(db, COL),
      where("escolaId", "==", escolaId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return list.sort((a, b) => new Date(b.data || b.criadoEm?.toDate?.() || 0) - new Date(a.data || a.criadoEm?.toDate?.() || 0));
  } catch (err) {
    console.error("Erro ao buscar transferências:", err);
    return [];
  }
}

export async function getTransferenciasAluno(alunoId) {
  if (!alunoId) return [];
  try {
    const q = query(collection(db, COL), where("alunoId", "==", alunoId));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return list.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
  } catch (err) {
    console.error("Erro ao buscar transferências do aluno:", err);
    return [];
  }
}

export async function addTransferencia(dados, escolaId) {
  const docRef = await addDoc(collection(db, COL), {
    ...dados,
    escolaId,
    criadoEm: serverTimestamp()
  });

  // Atualiza automaticamente a situação e trajetória do aluno no cadastro
  if (dados.alunoId) {
    try {
      const alunoRef = doc(db, "alunos", dados.alunoId);
      const alunoSnap = await getDoc(alunoRef);
      if (alunoSnap.exists()) {
        const alunoData = alunoSnap.data();
        const historicoTransfAntigo = Array.isArray(alunoData.historicoTransferencias) ? alunoData.historicoTransferencias : [];
        const trajetoriaAntiga = Array.isArray(alunoData.trajetoriaEscolar) ? alunoData.trajetoriaEscolar : [];

        const novoRegistroTransf = {
          id: docRef.id,
          tipo: dados.tipo || "Saída (Expedida)",
          escolaOrigem: dados.escolaOrigem || "Esta Unidade Escolar",
          escolaDestino: dados.escolaDestino || "—",
          data: dados.data || new Date().toISOString().split("T")[0],
          motivo: dados.motivo || "Transferência Escolar",
          responsavel: dados.responsavel || alunoData.mae || alunoData.responsavel || "—",
          documentacao: dados.documentacao || "Declaração Provisória Emitida",
          situacao: dados.situacao || "Concluída",
          observacoes: dados.observacoes || "",
          usuarioNome: dados.usuarioNome || "Secretaria Escolar",
          registradoEm: new Date().toISOString()
        };

        const anoAtual = dados.data ? new Date(dados.data).getFullYear().toString() : new Date().getFullYear().toString();
        
        // Se for transferência de saída, atualiza status do aluno para Transferido e anexa no histórico
        if (dados.tipo === "Saída (Expedida)") {
          // Atualiza ou insere marco na trajetória escolar
          const trajetoriaAtualizada = [
            ...trajetoriaAntiga.filter(t => t.anoLetivo !== anoAtual),
            {
              id: "traj_" + Date.now(),
              anoLetivo: anoAtual,
              serieAno: alunoData.ano || "—",
              escola: dados.escolaOrigem || alunoData.escolaNome || "Escola Municipal",
              cidadeUf: dados.escolaOrigemCidadeUf || "Maceió - AL",
              situacaoFinal: "Transferido",
              observacoes: `Transferido para: ${dados.escolaDestino || "Outra unidade"} em ${dados.data ? new Date(dados.data + "T12:00:00").toLocaleDateString("pt-BR") : ""}. Motivo: ${dados.motivo || "—"}`
            }
          ];

          await updateDoc(alunoRef, {
            status: "Transferido",
            situacaoMatricula: "Transferido",
            dataTransferencia: dados.data,
            escolaDestino: dados.escolaDestino,
            historicoTransferencias: [novoRegistroTransf, ...historicoTransfAntigo],
            trajetoriaEscolar: trajetoriaAtualizada,
            atualizadoEm: serverTimestamp()
          });
        } else {
          // Transferência de Entrada
          const anoAnteriorNum = (Number(anoAtual) - 1).toString();
          const trajetoriaAtualizada = [
            ...trajetoriaAntiga,
            {
              id: "traj_orig_" + Date.now(),
              anoLetivo: anoAnteriorNum,
              serieAno: dados.serieOrigem || "Ano Anterior",
              escola: dados.escolaOrigem || "Escola de Origem",
              cidadeUf: dados.escolaOrigemCidadeUf || "—",
              situacaoFinal: "Aprovado",
              observacoes: `Transferido para esta unidade em ${dados.data ? new Date(dados.data + "T12:00:00").toLocaleDateString("pt-BR") : ""}`
            }
          ];

          await updateDoc(alunoRef, {
            status: "Ativo",
            escolaOrigem: dados.escolaOrigem,
            historicoTransferencias: [novoRegistroTransf, ...historicoTransfAntigo],
            trajetoriaEscolar: trajetoriaAtualizada,
            atualizadoEm: serverTimestamp()
          });
        }
      }
    } catch (errAluno) {
      console.error("Erro ao sincronizar dados do aluno na transferência:", errAluno);
    }
  }

  return docRef.id;
}

export async function updateTransferencia(id, dados) {
  return updateDoc(doc(db, COL, id), {
    ...dados,
    atualizadoEm: serverTimestamp()
  });
}

export async function deleteTransferencia(id) {
  return deleteDoc(doc(db, COL, id));
}
