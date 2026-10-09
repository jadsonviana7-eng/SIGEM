import {
  collection, addDoc, getDocs, query, where, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

const COL = "documentos_autenticados";

/**
 * Gera um código alfanumérico seguro para validação
 */
export function gerarCodigoAutenticidade(tipo = "HIST") {
  const ano = new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart1 = "";
  let randomPart2 = "";
  for (let i = 0; i < 4; i++) {
    randomPart1 += chars.charAt(Math.floor(Math.random() * chars.length));
    randomPart2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SIGEM-${ano}-${tipo}-${randomPart1}-${randomPart2}`;
}

/**
 * Registra emissão oficial do documento com chave de autenticidade
 */
export async function registrarEmissaoDocumento(escolaId, aluno, escolaInfo, tipo = "HISTORICO_ESCOLAR", dadosExtras = {}) {
  const codigo = gerarCodigoAutenticidade(tipo === "HISTORICO_ESCOLAR" ? "HIST" : "DOC");
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://sigem-mundau.educacao.gov.br";
  const urlValidacao = `${baseUrl}/validar-documento?codigo=${codigo}`;

  const registro = {
    codigoValidacao: codigo,
    urlValidacao,
    tipo,
    tipoDescricao: tipo === "HISTORICO_ESCOLAR" ? "Histórico Escolar Oficial" : "Documento Escolar Autenticado",
    alunoId: aluno.id || "",
    alunoNome: aluno.nome || "",
    alunoMatricula: aluno.matricula || "",
    alunoCpf: aluno.cpf || "",
    nascimento: aluno.nascimento || "",
    mae: aluno.mae || aluno.responsavel || "",
    pai: aluno.pai || "",
    turma: aluno.turma || "",
    anoSerie: aluno.ano || "",
    escolaId: escolaId || "",
    escolaNome: escolaInfo?.nome || "Escola Municipal",
    escolaInep: escolaInfo?.inep || "27000000",
    escolaMunicipio: escolaInfo?.cidade || "Porto Calvo",
    escolaUf: escolaInfo?.uf || "AL",
    dataEmissao: new Date().toISOString(),
    valido: true,
    dadosSnapshot: dadosExtras,
    criadoEm: serverTimestamp()
  };

  try {
    const docRef = await addDoc(collection(db, COL), registro);
    return { id: docRef.id, ...registro };
  } catch (err) {
    console.error("Erro ao registrar autenticação de documento:", err);
    // Retorna o registro mesmo se offline para geração local do QR Code
    return registro;
  }
}

/**
 * Consulta e valida um documento pelo seu código de autenticidade
 */
export async function validarDocumentoPorCodigo(codigo) {
  if (!codigo) return null;
  const codigoLimpo = codigo.trim().toUpperCase();

  try {
    const q = query(collection(db, COL), where("codigoValidacao", "==", codigoLimpo));
    const snap = await getDocs(q);

    if (snap.empty) {
      // Se não achar por código exato, tenta encontrar ignorando hífen
      const allSnap = await getDocs(collection(db, COL));
      const match = allSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .find(d => (d.codigoValidacao || "").replace(/-/g, "") === codigoLimpo.replace(/-/g, ""));
      return match || null;
    }

    const docData = snap.docs[0];
    return { id: docData.id, ...docData.data() };
  } catch (err) {
    console.error("Erro ao validar documento:", err);
    return null;
  }
}
