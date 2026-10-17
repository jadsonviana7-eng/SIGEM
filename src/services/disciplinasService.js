import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";

const COL = "disciplinas";

// ═══════════════════════════════════════════════════════════════
// MATRIZ CURRICULAR NACIONAL PADRÃO (BNCC & BASE DIVERSIFICADA)
// ═══════════════════════════════════════════════════════════════
export const DISCIPLINAS_PADRAO_BNCC = [
  {
    nome: "Língua Portuguesa",
    codigo: "PORT",
    areaConhecimento: "Linguagens",
    tipo: "Base Nacional Comum Curricular (BNCC)",
    cargaHorariaSemanal: 4,
    cargaHorariaAnual: 160,
    anos: ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano", "6º Ano", "7º Ano", "8º Ano", "9º Ano"],
    obrigatoria: true,
    reprova: true,
    cor: "#3b82f6",
    icone: "ti-book",
    status: "Ativa",
    ordem: 1,
    descricao: "Desenvolvimento das competências leitoras, escritas, orais e de análise linguística conforme a BNCC."
  },
  {
    nome: "Matemática",
    codigo: "MAT",
    areaConhecimento: "Matemática",
    tipo: "Base Nacional Comum Curricular (BNCC)",
    cargaHorariaSemanal: 4,
    cargaHorariaAnual: 160,
    anos: ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano", "6º Ano", "7º Ano", "8º Ano", "9º Ano"],
    obrigatoria: true,
    reprova: true,
    cor: "#10b981",
    icone: "ti-calculator",
    status: "Ativa",
    ordem: 2,
    descricao: "Raciocínio lógico, álgebra, geometria, grandezas e medidas, estatística e probabilidade."
  },
  {
    nome: "Ciências da Natureza",
    codigo: "CIE",
    areaConhecimento: "Ciências da Natureza",
    tipo: "Base Nacional Comum Curricular (BNCC)",
    cargaHorariaSemanal: 3,
    cargaHorariaAnual: 120,
    anos: ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano", "6º Ano", "7º Ano", "8º Ano", "9º Ano"],
    obrigatoria: true,
    reprova: true,
    cor: "#06b6d4",
    icone: "ti-atom-2",
    status: "Ativa",
    ordem: 3,
    descricao: "Investigação científica, matéria e energia, vida e evolução, terra e universo no ensino fundamental."
  },
  {
    nome: "História",
    codigo: "HIST",
    areaConhecimento: "Ciências Humanas",
    tipo: "Base Nacional Comum Curricular (BNCC)",
    cargaHorariaSemanal: 2,
    cargaHorariaAnual: 80,
    anos: ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano", "6º Ano", "7º Ano", "8º Ano", "9º Ano"],
    obrigatoria: true,
    reprova: true,
    cor: "#f59e0b",
    icone: "ti-hourglass",
    status: "Ativa",
    ordem: 4,
    descricao: "Processos históricos, cidadania, memórias locais, história de Alagoas, nacionais e mundiais."
  },
  {
    nome: "Geografia",
    codigo: "GEO",
    areaConhecimento: "Ciências Humanas",
    tipo: "Base Nacional Comum Curricular (BNCC)",
    cargaHorariaSemanal: 2,
    cargaHorariaAnual: 80,
    anos: ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano", "6º Ano", "7º Ano", "8º Ano", "9º Ano"],
    obrigatoria: true,
    reprova: true,
    cor: "#84cc16",
    icone: "ti-world",
    status: "Ativa",
    ordem: 5,
    descricao: "Espaço geográfico, território, paisagem, sociedade e natureza, cartografia e geopolítica."
  },
  {
    nome: "Arte",
    codigo: "ART",
    areaConhecimento: "Linguagens",
    tipo: "Base Nacional Comum Curricular (BNCC)",
    cargaHorariaSemanal: 2,
    cargaHorariaAnual: 80,
    anos: ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano", "6º Ano", "7º Ano", "8º Ano", "9º Ano"],
    obrigatoria: true,
    reprova: false,
    cor: "#ec4899",
    icone: "ti-palette",
    status: "Ativa",
    ordem: 6,
    descricao: "Artes visuais, dança, música e teatro articuladas às expressões socioculturais."
  },
  {
    nome: "Educação Física",
    codigo: "EDF",
    areaConhecimento: "Linguagens",
    tipo: "Base Nacional Comum Curricular (BNCC)",
    cargaHorariaSemanal: 2,
    cargaHorariaAnual: 80,
    anos: ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano", "6º Ano", "7º Ano", "8º Ano", "9º Ano"],
    obrigatoria: true,
    reprova: false,
    cor: "#8b5cf6",
    icone: "ti-ball-football",
    status: "Ativa",
    ordem: 7,
    descricao: "Cultura corporal de movimento, práticas esportivas, jogos motores, saúde e corporeidade."
  },
  {
    nome: "Língua Inglesa",
    codigo: "ING",
    areaConhecimento: "Linguagens",
    tipo: "Base Nacional Comum Curricular (BNCC)",
    cargaHorariaSemanal: 2,
    cargaHorariaAnual: 80,
    anos: ["6º Ano", "7º Ano", "8º Ano", "9º Ano"],
    obrigatoria: true,
    reprova: true,
    cor: "#6366f1",
    icone: "ti-language",
    status: "Ativa",
    ordem: 8,
    descricao: "Língua inglesa como língua franca global, práticas de leitura, interculturalidade e comunicação."
  },
  {
    nome: "Ensino Religioso",
    codigo: "REL",
    areaConhecimento: "Ensino Religioso",
    tipo: "Base Nacional Comum Curricular (BNCC)",
    cargaHorariaSemanal: 1,
    cargaHorariaAnual: 40,
    anos: ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano", "6º Ano", "7º Ano", "8º Ano", "9º Ano"],
    obrigatoria: false,
    reprova: false,
    cor: "#f97316",
    icone: "ti-peace",
    status: "Ativa",
    ordem: 9,
    descricao: "Conhecimento sobre o fenômeno religioso, ética, diversidade cultural e respeito à pluralidade."
  }
];

export const AREAS_CONHECIMENTO = [
  "Linguagens",
  "Matemática",
  "Ciências da Natureza",
  "Ciências Humanas",
  "Ensino Religioso",
  "Parte Diversificada / Eletiva",
  "Formação Técnica & Tecnológica"
];

export const TIPOS_COMPONENTE = [
  "Base Nacional Comum Curricular (BNCC)",
  "Parte Diversificada",
  "Eletiva / Itinerário Formativo",
  "Atendimento Educacional Especializado (AEE)",
  "Projeto Interdisciplinar"
];

export const CORES_DISCIPLINA = [
  { nome: "Azul Real", valor: "#3b82f6" },
  { nome: "Verde Esmeralda", valor: "#10b981" },
  { nome: "Ciano Oceano", valor: "#06b6d4" },
  { nome: "Âmbar Solar", valor: "#f59e0b" },
  { nome: "Lima Vigor", valor: "#84cc16" },
  { nome: "Rosa Magenta", valor: "#ec4899" },
  { nome: "Roxo Ametista", valor: "#8b5cf6" },
  { nome: "Índigo Profundo", valor: "#6366f1" },
  { nome: "Laranja Coral", valor: "#f97316" },
  { nome: "Vermelho Rubi", valor: "#ef4444" },
  { nome: "Ardósia Neutro", valor: "#64748b" }
];

export const ICONES_DISCIPLINA = [
  { label: "Livro / Leitura", icon: "ti-book" },
  { label: "Cálculo / Lógica", icon: "ti-calculator" },
  { label: "Átomo / Ciências", icon: "ti-atom-2" },
  { label: "Globo / Mapa", icon: "ti-world" },
  { label: "Ampulheta / História", icon: "ti-hourglass" },
  { label: "Paleta / Arte", icon: "ti-palette" },
  { label: "Esporte / Bola", icon: "ti-ball-football" },
  { label: "Idiomas / Global", icon: "ti-language" },
  { label: "Paz / Ética", icon: "ti-peace" },
  { label: "Tecnologia / Código", icon: "ti-cpu" },
  { label: "Música / Notas", icon: "ti-music" },
  { label: "Microscópio / Bio", icon: "ti-microscope" },
  { label: "Lâmpada / Ideias", icon: "ti-bulb" }
];

let seedEmAndamento = false;

/**
 * Busca a lista de disciplinas cadastradas no Firestore.
 * Garante que a matriz oficial BNCC seja semeada/mantida no banco de dados,
 * evitando que componentes padrão desapareçam quando novos componentes forem adicionados,
 * e garantindo unicidade sem duplicatas.
 */
export async function getDisciplinas(escolaId = null) {
  try {
    const snap = await getDocs(collection(db, COL));
    
    // Filtra documentos reais ignorando metadados de sistema
    let rawDocs = snap.docs
      .filter(d => d.id !== "_seed_bncc")
      .map(d => ({ id: d.id, ...d.data() }));

    const seedDoc = snap.docs.find(d => d.id === "_seed_bncc");

    // Se o seed da BNCC ainda não foi registrado no banco e não há seed em andamento:
    if (!seedDoc && !seedEmAndamento) {
      seedEmAndamento = true;
      try {
        const nomesExistentes = new Set(
          rawDocs.map(d => (d.nome || "").toLowerCase().trim())
        );
        const codigosExistentes = new Set(
          rawDocs.map(d => (d.codigo || "").toUpperCase().trim())
        );

        // Descobre quais disciplinas da BNCC ainda não existem no banco
        const faltantes = DISCIPLINAS_PADRAO_BNCC.filter(
          d =>
            !nomesExistentes.has(d.nome.toLowerCase().trim()) &&
            !codigosExistentes.has(d.codigo.toUpperCase().trim())
        );

        if (faltantes.length > 0) {
          try {
            const batch = writeBatch(db);
            const novosDocs = [];
            for (const f of faltantes) {
              const docRef = doc(collection(db, COL));
              const novoItem = {
                ...f,
                escolaId: "rede",
                criadoEm: serverTimestamp(),
                atualizadoEm: serverTimestamp()
              };
              batch.set(docRef, novoItem);
              novosDocs.push({ id: docRef.id, ...novoItem });
            }
            batch.set(doc(db, COL, "_seed_bncc"), {
              semeadoEm: serverTimestamp(),
              versao: "1.0"
            });
            await batch.commit();
            rawDocs = [...rawDocs, ...novosDocs];
          } catch (seedErr) {
            console.warn("Aviso ao persistir seed BNCC no Firestore:", seedErr);
            // Fallback gracioso em memória se gravação falhar
            const faltantesVirtuais = faltantes.map((f, idx) => ({
              ...f,
              id: `padrao_${f.codigo.toLowerCase()}_${idx}`,
              isPadraoInicial: true
            }));
            rawDocs = [...rawDocs, ...faltantesVirtuais];
          }
        } else {
          // Todas já existem, apenas salva a marcação do seed
          try {
            const batch = writeBatch(db);
            batch.set(doc(db, COL, "_seed_bncc"), {
              semeadoEm: serverTimestamp(),
              versao: "1.0"
            });
            await batch.commit();
          } catch (e) {
            // ignore
          }
        }
      } finally {
        seedEmAndamento = false;
      }
    }

    // Deduplica por nome para garantir unicidade absoluta e limpa duplicatas do banco
    const mapaUnicos = new Map();
    const idsDuplicados = [];

    for (const docItem of rawDocs) {
      const chave = (docItem.nome || "").toLowerCase().trim();
      if (!chave) continue;
      if (!mapaUnicos.has(chave)) {
        mapaUnicos.set(chave, docItem);
      } else {
        // Encontrou duplicata no Firestore (ex: corrida de concorrência ou seed paralelo)
        if (docItem.id && !docItem.id.startsWith("padrao_")) {
          idsDuplicados.push(docItem.id);
        }
      }
    }

    // Se houver duplicatas no banco, remove-as assincronamente
    if (idsDuplicados.length > 0) {
      try {
        const batchClean = writeBatch(db);
        idsDuplicados.forEach(dupId => {
          batchClean.delete(doc(db, COL, dupId));
        });
        batchClean.commit().catch(err => console.warn("Erro ao limpar duplicatas no Firestore:", err));
      } catch (cleanErr) {
        // ignore
      }
    }

    rawDocs = Array.from(mapaUnicos.values());

    // Se tiver escolaId, filtra disciplinas da escola ou gerais (da rede sem escolaId ou escolaId='rede')
    let resultado = rawDocs;
    if (escolaId) {
      resultado = rawDocs.filter(d => !d.escolaId || d.escolaId === "rede" || d.escolaId === escolaId);
    }

    return resultado.sort((a, b) => (a.ordem || 99) - (b.ordem || 99) || (a.nome || "").localeCompare(b.nome || ""));
  } catch (error) {
    console.error("Erro ao buscar disciplinas:", error);
    return DISCIPLINAS_PADRAO_BNCC.map((d, index) => ({
      ...d,
      id: `padrao_${d.codigo.toLowerCase()}_${index}`,
      isPadraoInicial: true
    }));
  }
}

/**
 * Cria uma nova disciplina no Firestore
 */
export async function addDisciplina(dados, escolaId = null) {
  const payload = {
    nome: dados.nome?.trim() || "",
    codigo: (dados.codigo || "").toUpperCase().trim(),
    areaConhecimento: dados.areaConhecimento || "Linguagens",
    tipo: dados.tipo || "Base Nacional Comum Curricular (BNCC)",
    cargaHorariaSemanal: Number(dados.cargaHorariaSemanal) || 2,
    cargaHorariaAnual: Number(dados.cargaHorariaAnual) || 80,
    anos: Array.isArray(dados.anos) && dados.anos.length ? dados.anos : ["1º Ano"],
    obrigatoria: dados.obrigatoria !== false,
    reprova: dados.reprova !== false,
    cor: dados.cor || "#3b82f6",
    icone: dados.icone || "ti-book",
    status: dados.status || "Ativa",
    ordem: Number(dados.ordem) || 50,
    descricao: dados.descricao?.trim() || "",
    escolaId: escolaId || "rede",
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp()
  };

  return addDoc(collection(db, COL), payload);
}

/**
 * Atualiza os dados de uma disciplina existente
 */
export async function updateDisciplina(id, dados) {
  const payload = {
    ...dados,
    codigo: (dados.codigo || "").toUpperCase().trim(),
    cargaHorariaSemanal: Number(dados.cargaHorariaSemanal) || 2,
    cargaHorariaAnual: Number(dados.cargaHorariaAnual) || 80,
    atualizadoEm: serverTimestamp()
  };
  delete payload.id;
  delete payload.isPadraoInicial;

  return updateDoc(doc(db, COL, id), payload);
}

/**
 * Remove uma disciplina do Firestore
 */
export async function deleteDisciplina(id) {
  return deleteDoc(doc(db, COL, id));
}

/**
 * Persiste toda a matriz padrão BNCC no Firestore para a rede / escola,
 * inserindo qualquer componente padrão que não esteja presente.
 */
export async function seedDisciplinasPadrao(escolaId = "rede") {
  const snap = await getDocs(collection(db, COL));
  const docs = snap.docs.filter(d => d.id !== "_seed_bncc").map(d => d.data());
  const nomesExistentes = new Set(docs.map(d => (d.nome || "").toLowerCase().trim()));
  const codigosExistentes = new Set(docs.map(d => (d.codigo || "").toUpperCase().trim()));

  const faltantes = DISCIPLINAS_PADRAO_BNCC.filter(d => 
    !nomesExistentes.has(d.nome.toLowerCase().trim()) &&
    !codigosExistentes.has(d.codigo.toUpperCase().trim())
  );

  const batch = writeBatch(db);
  if (faltantes.length > 0) {
    faltantes.forEach((d) => {
      const docRef = doc(collection(db, COL));
      batch.set(docRef, {
        ...d,
        escolaId,
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp()
      });
    });
  }
  batch.set(doc(db, COL, "_seed_bncc"), {
    semeadoEm: serverTimestamp(),
    versao: "1.0",
    atualizadoEm: serverTimestamp()
  });
  return batch.commit();
}
