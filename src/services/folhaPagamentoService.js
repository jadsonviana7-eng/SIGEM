import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";
import { getProfessores, getAllProfessores } from "./professoresService";
import { getPontosCompetencia } from "./pontoService";
import { getEscolas } from "./escolasService";

const COL_FOLHA = "folha_lancamentos";
const COL_CONFIG = "folha_config";

export const PARAMETROS_PADRAO_FOLHA = {
  pisoNacional40h: 4580.57,
  pisoNacional30h: 3435.43,
  pisoNacional20h: 2290.28,
  salarioBaseSecretario: 2640.00,
  salarioBaseCoordenador: 3850.00,
  salarioBaseApoio: 1618.00, // Merendeira, ASG
  salarioBaseVigia: 1720.00,
  percentualRegencia: 15, // 15% de Regência de Classe
  percentualEspecializacao: 10,
  percentualMestrado: 20,
  percentualDoutorado: 30,
  percentualAdicionalRural: 10,
  aliquotaRppsEfetivo: 14, // 14% RPPS
  deducaoPorDependente: 189.59
};

/**
 * Retorna os parâmetros salariais e de alíquotas configurados para a SEMED
 */
export async function getParametrosFolha() {
  try {
    const docSnap = await getDoc(doc(db, COL_CONFIG, "parametros_semed"));
    if (docSnap.exists()) {
      return { ...PARAMETROS_PADRAO_FOLHA, ...docSnap.data() };
    }
  } catch (e) {
    console.warn("Usando parâmetros padrão de folha:", e);
  }
  return PARAMETROS_PADRAO_FOLHA;
}

/**
 * Salva os parâmetros salariais da SEMED
 */
export async function salvarParametrosFolha(novosParametros) {
  const docRef = doc(db, COL_CONFIG, "parametros_semed");
  await setDoc(docRef, { ...novosParametros, atualizadoEm: serverTimestamp() }, { merge: true });
  return true;
}

/**
 * Cálculo de Previdência INSS (Tabela Progressiva)
 */
export function calcularInssProgressivo(salarioBruto) {
  if (salarioBruto <= 0) return 0;
  const TETO_INSS = 7786.02;
  const val = Math.min(salarioBruto, TETO_INSS);

  let inss = 0;
  if (val <= 1412.00) {
    inss = val * 0.075;
  } else if (val <= 2666.68) {
    inss = (val * 0.09) - 21.18;
  } else if (val <= 4000.03) {
    inss = (val * 0.12) - 101.18;
  } else {
    inss = (val * 0.14) - 181.18;
  }

  return Number(Math.max(inss, 0).toFixed(2));
}

/**
 * Cálculo de IRRF (Imposto de Renda Retido na Fonte com Dedução)
 */
export function calcularIrrf(baseCalculo) {
  if (baseCalculo <= 2259.20) return 0;
  let irrf = 0;
  if (baseCalculo <= 2826.65) {
    irrf = (baseCalculo * 0.075) - 169.44;
  } else if (baseCalculo <= 3751.05) {
    irrf = (baseCalculo * 0.15) - 381.44;
  } else if (baseCalculo <= 4664.68) {
    irrf = (baseCalculo * 0.225) - 662.77;
  } else {
    irrf = (baseCalculo * 0.275) - 896.00;
  }
  return Number(Math.max(irrf, 0).toFixed(2));
}

/**
 * Calcula individualmente o holerite de um servidor com base no ponto e parâmetros
 */
export function calcularHoleriteServidor(servidor, pontoServidor, escola, params = PARAMETROS_PADRAO_FOLHA) {
  const cargaHoraria = servidor.cargaHoraria || (servidor.cargo === "Professor" ? "20h" : "40h");
  const vinculo = servidor.vinculo || "Efetivo";
  const cargo = servidor.cargo || "Professor";
  const titulacao = servidor.titulacao || "Graduação";
  const dependentes = Number(servidor.dependentesIrrf) || 0;

  // 1. Definição do Vencimento Base
  let vencimentoBase = Number(servidor.salarioBase) || 0;
  if (!vencimentoBase) {
    if (cargo === "Professor") {
      if (cargaHoraria === "40h") vencimentoBase = params.pisoNacional40h;
      else if (cargaHoraria === "30h") vencimentoBase = params.pisoNacional30h;
      else vencimentoBase = params.pisoNacional20h;
    } else if (cargo === "Coordenador" || cargo === "Diretor") {
      vencimentoBase = params.salarioBaseCoordenador;
    } else if (cargo === "Secretário") {
      vencimentoBase = params.salarioBaseSecretario;
    } else if (cargo === "Vigia") {
      vencimentoBase = params.salarioBaseVigia;
    } else {
      vencimentoBase = params.salarioBaseApoio;
    }
  }

  // 2. Proventos e Vantagens
  const proventos = [];
  proventos.push({ rubrica: "001", descricao: "Vencimento Básico", valor: Number(vencimentoBase.toFixed(2)) });

  // Regência de Classe para Professores
  let regencia = 0;
  if (cargo === "Professor") {
    regencia = vencimentoBase * (params.percentualRegencia / 100);
    proventos.push({ rubrica: "010", descricao: `Gratificação de Regência de Classe (${params.percentualRegencia}%)`, valor: Number(regencia.toFixed(2)) });
  }

  // Gratificação de Titulação
  let gratTitulacao = 0;
  if (titulacao === "Especialização" || titulacao === "Pós-Graduação") {
    gratTitulacao = vencimentoBase * (params.percentualEspecializacao / 100);
    proventos.push({ rubrica: "015", descricao: `Adicional de Titulação - Especialização (${params.percentualEspecializacao}%)`, valor: Number(gratTitulacao.toFixed(2)) });
  } else if (titulacao === "Mestrado") {
    gratTitulacao = vencimentoBase * (params.percentualMestrado / 100);
    proventos.push({ rubrica: "016", descricao: `Adicional de Titulação - Mestrado (${params.percentualMestrado}%)`, valor: Number(gratTitulacao.toFixed(2)) });
  } else if (titulacao === "Doutorado") {
    gratTitulacao = vencimentoBase * (params.percentualDoutorado / 100);
    proventos.push({ rubrica: "017", descricao: `Adicional de Titulação - Doutorado (${params.percentualDoutorado}%)`, valor: Number(gratTitulacao.toFixed(2)) });
  }

  // Adicional de Zona Rural / Difícil Acesso
  let adicionalRural = 0;
  if (escola?.zona === "Rural") {
    adicionalRural = vencimentoBase * (params.percentualAdicionalRural / 100);
    proventos.push({ rubrica: "020", descricao: `Adicional Difícil Acesso / Rural (${params.percentualAdicionalRural}%)`, valor: Number(adicionalRural.toFixed(2)) });
  }

  // Horas Complementares ou Aulas Extras informadas no ponto
  let horasExtras = 0;
  if (pontoServidor?.horasExtras && Number(pontoServidor.horasExtras) > 0) {
    const valorHora = (vencimentoBase / 100) * 1.5; // hora com 50%
    horasExtras = Number(pontoServidor.horasExtras) * valorHora;
    proventos.push({ rubrica: "025", descricao: `Horas / Aulas Complementares (${pontoServidor.horasExtras}h)`, valor: Number(horasExtras.toFixed(2)) });
  }

  const totalProventos = Number((vencimentoBase + regencia + gratTitulacao + adicionalRural + horasExtras).toFixed(2));

  // 3. Descontos
  const descontos = [];

  // Desconto de Faltas Injustificadas apuradas no ponto
  let valorDescontoFaltas = 0;
  const faltasInjustificadas = Number(pontoServidor?.faltasInjustificadas) || 0;
  if (faltasInjustificadas > 0) {
    const valorDia = vencimentoBase / 30;
    valorDescontoFaltas = Number((valorDia * faltasInjustificadas).toFixed(2));
    descontos.push({
      rubrica: "101",
      descricao: `Faltas Injustificadas no Mês (${faltasInjustificadas} dia${faltasInjustificadas > 1 ? "s" : ""})`,
      valor: valorDescontoFaltas
    });
  }

  // Base para Previdência
  const basePrevidencia = Math.max(totalProventos - valorDescontoFaltas, 0);

  // Previdência: RPPS para efetivo vs INSS para contratados
  let valorPrevidencia = 0;
  if (vinculo === "Efetivo") {
    valorPrevidencia = Number((basePrevidencia * (params.aliquotaRppsEfetivo / 100)).toFixed(2));
    descontos.push({ rubrica: "201", descricao: `Previdência Municipal - RPPS (${params.aliquotaRppsEfetivo}%)`, valor: valorPrevidencia });
  } else {
    valorPrevidencia = calcularInssProgressivo(basePrevidencia);
    descontos.push({ rubrica: "202", descricao: "Previdência Social - INSS", valor: valorPrevidencia });
  }

  // Base de Cálculo do IRRF
  const deducaoDependentes = dependentes * params.deducaoPorDependente;
  const baseIrrf = Math.max(basePrevidencia - valorPrevidencia - deducaoDependentes, 0);
  const valorIrrf = calcularIrrf(baseIrrf);

  if (valorIrrf > 0) {
    descontos.push({ rubrica: "301", descricao: "Imposto de Renda Retido na Fonte - IRRF", valor: valorIrrf });
  }

  const totalDescontos = Number(descontos.reduce((acc, d) => acc + d.valor, 0).toFixed(2));
  const valorLiquido = Number(Math.max(totalProventos - totalDescontos, 0).toFixed(2));

  // Enquadramento FUNDEB
  const enquadramentoFundeb = (cargo === "Professor" || cargo === "Coordenador") ? "FUNDEB 70%" : "FUNDEB 30%";

  return {
    servidorId: servidor.id,
    servidorNome: servidor.nome,
    cpf: servidor.cpf,
    matricula: servidor.matricula || `MAT-${servidor.id?.slice(0, 6)}`,
    cargo,
    vinculo,
    cargaHoraria,
    titulacao,
    escolaId: servidor.escolaId,
    escolaNome: escola?.nome || "Escola Municipal",
    municipio: escola?.municipio || "Maceió",
    proventos,
    descontos,
    totalProventos,
    totalDescontos,
    valorLiquido,
    basePrevidencia,
    baseIrrf,
    dependentes,
    enquadramentoFundeb,
    diasTrabalhados: pontoServidor?.diasTrabalhados ?? 22,
    faltasJustificadas: pontoServidor?.faltasJustificadas ?? 0,
    faltasInjustificadas
  };
}

/**
 * Busca a folha de pagamento da competência
 */
export async function getFolhaCompetencia(mes, ano, escolaId = null) {
  let q;
  if (escolaId) {
    q = query(
      collection(db, COL_FOLHA),
      where("mes", "==", Number(mes)),
      where("ano", "==", Number(ano)),
      where("escolaId", "==", escolaId)
    );
  } else {
    q = query(
      collection(db, COL_FOLHA),
      where("mes", "==", Number(mes)),
      where("ano", "==", Number(ano))
    );
  }

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Processa e recalcula a folha de pagamento da competência para uma escola ou para toda a rede
 */
export async function processarFolhaCompetencia(mes, ano, escolaId = null) {
  const [servidores, pontos, escolas, params] = await Promise.all([
    escolaId ? getProfessores(escolaId) : getAllProfessores(),
    getPontosCompetencia(mes, ano, escolaId),
    getEscolas(),
    getParametrosFolha()
  ]);

  const mapaEscolas = {};
  escolas.forEach(e => { mapaEscolas[e.id] = e; });

  const mapaPontos = {};
  pontos.forEach(p => { mapaPontos[p.servidorId] = p; });

  const lancamentosCalculados = [];

  for (const serv of servidores) {
    if (serv.status && serv.status !== "Ativo") continue; // Ignora inativos

    const escola = mapaEscolas[serv.escolaId] || {};
    const ponto = mapaPontos[serv.id] || null;

    const holerite = calcularHoleriteServidor(serv, ponto, escola, params);
    const docId = `${serv.id}_${ano}_${mes}`.replace(/\s+/g, "_");

    const dadosLancamento = {
      ...holerite,
      mes: Number(mes),
      ano: Number(ano),
      calculadoEm: new Date().toISOString()
    };

    await setDoc(doc(db, COL_FOLHA, docId), dadosLancamento, { merge: true });
    lancamentosCalculados.push({ id: docId, ...dadosLancamento });
  }

  return lancamentosCalculados;
}
