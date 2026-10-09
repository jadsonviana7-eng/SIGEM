import {
  collection, addDoc, getDocs, query, where, limit, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

export const COL_AUDITORIA = "auditoria_logs";

export const MODULOS_AUDITORIA = [
  "Notas",
  "Alunos",
  "Frequência",
  "Matrículas",
  "Transferências",
  "Fechamento",
  "Histórico",
  "Ocorrências",
  "Servidores",
  "Turmas",
  "Financeiro",
  "Sistema"
];

export const ACOES_AUDITORIA = {
  ALTERACAO_NOTA: "Alteração de Nota",
  CADASTRO_ALUNO: "Cadastro de Aluno",
  EDICAO_ALUNO: "Edição Cadastral de Aluno",
  EXCLUSAO_ALUNO: "Exclusão de Aluno",
  REMANEJAMENTO_TURMA: "Remanejamento de Turma",
  LANCAMENTO_FREQUENCIA: "Lançamento de Frequência",
  ALTERACAO_FREQUENCIA: "Alteração de Frequência",
  TRANSFERENCIA_EMITIDA: "Emissão de Transferência",
  FECHAMENTO_SOLICITADO: "Solicitação de Fechamento",
  FECHAMENTO_HOMOLOGADO: "Homologação de Fechamento",
  FECHAMENTO_REABERTO: "Reabertura de Período",
  FECHAMENTO_DEVOLVIDO: "Devolução de Fechamento",
  CRIACAO_TURMA: "Criação de Turma",
  EDICAO_TURMA: "Edição de Turma",
  EXCLUSAO_TURMA: "Exclusão de Turma",
  CADASTRO_SERVIDOR: "Cadastro de Servidor",
  EDICAO_SERVIDOR: "Edição de Servidor",
  NOVA_OCORRENCIA: "Registro de Ocorrência",
  EXCLUSAO_OCORRENCIA: "Exclusão de Ocorrência",
  OUTRA: "Outra Ação"
};

/**
 * Formata data e hora no padrão brasileiro: DD/MM/AAAA – HH:mm
 */
export function formatarDataHoraLog(data = new Date()) {
  const d = new Date(data);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return {
    data: `${dia}/${mes}/${ano}`,
    hora: `${hora}:${min}`,
    completo: `${dia}/${mes}/${ano} – ${hora}:${min}`
  };
}

/**
 * Registra um evento de auditoria transversal no Firestore.
 */
export async function registrarAuditoria({
  usuario,
  escolaId = "",
  escolaNome = "",
  modulo = "Sistema",
  acao = "ALTERACAO",
  entidade = "Registro",
  entidadeId = "",
  entidadeNome = "",
  registroAnterior = "—",
  registroNovo = "—",
  detalhes = null,
  diff = null,
  descricao = "",
  ip = "Portal Web Municipal"
}) {
  try {
    const agora = new Date();
    const dataHoraFmt = formatarDataHoraLog(agora);

    const usuarioNome = usuario?.displayName || usuario?.nome || usuario?.email || "Usuário do Sistema";
    const usuarioEmail = usuario?.email || "";
    const usuarioRole = usuario?.role || usuario?.perfil || "Operador";
    const usuarioId = usuario?.uid || usuario?.id || "";

    let descFinal = descricao;
    if (!descFinal) {
      if (registroAnterior && registroNovo && registroAnterior !== "—") {
        descFinal = `${usuarioNome} alterou ${entidadeNome || entidade} de "${registroAnterior}" para "${registroNovo}"`;
      } else if (registroNovo && registroNovo !== "—") {
        descFinal = `${usuarioNome} registrou ${entidadeNome || entidade}: "${registroNovo}"`;
      } else {
        descFinal = `${usuarioNome} realizou ação em ${entidadeNome || entidade}`;
      }
    }

    const payload = {
      escolaId: escolaId || "",
      escolaNome: escolaNome || "Rede Municipal de Ensino",
      usuarioId,
      usuarioNome,
      usuarioEmail,
      usuarioRole,
      modulo,
      acao,
      entidade,
      entidadeId: String(entidadeId || ""),
      entidadeNome: String(entidadeNome || ""),
      registroAnterior: typeof registroAnterior === "object" ? JSON.stringify(registroAnterior) : String(registroAnterior ?? "—"),
      registroNovo: typeof registroNovo === "object" ? JSON.stringify(registroNovo) : String(registroNovo ?? "—"),
      detalhes: detalhes || null,
      diff: diff || null,
      descricao: descFinal,
      data: dataHoraFmt.data,
      hora: dataHoraFmt.hora,
      dataHoraFormatada: dataHoraFmt.completo,
      origem: ip,
      criadoEm: agora.toISOString(),
      timestamp: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, COL_AUDITORIA), payload);
    return { id: docRef.id, ...payload };
  } catch (error) {
    console.error("Erro ao registrar auditoria:", error);
    return null;
  }
}

/**
 * Busca logs de auditoria com filtros flexíveis
 */
export async function getAuditoriaLogs({
  escolaId,
  modulo,
  usuarioId,
  termoBusca,
  limite = 300
} = {}) {
  try {
    let q = query(collection(db, COL_AUDITORIA), limit(limite));

    if (escolaId) {
      q = query(collection(db, COL_AUDITORIA), where("escolaId", "==", escolaId), limit(limite));
    }

    const snap = await getDocs(q);
    let logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Ordenação decrescente (mais recentes primeiro)
    logs.sort((a, b) => {
      const dataA = new Date(a.criadoEm || 0).getTime();
      const dataB = new Date(b.criadoEm || 0).getTime();
      return dataB - dataA;
    });

    if (modulo && modulo !== "Todos") {
      logs = logs.filter(l => l.modulo?.toLowerCase() === modulo.toLowerCase());
    }

    if (usuarioId && usuarioId !== "Todos") {
      logs = logs.filter(l => l.usuarioId === usuarioId || l.usuarioEmail === usuarioId);
    }

    if (termoBusca && termoBusca.trim()) {
      const termo = termoBusca.toLowerCase().trim();
      logs = logs.filter(l =>
        l.usuarioNome?.toLowerCase().includes(termo) ||
        l.usuarioEmail?.toLowerCase().includes(termo) ||
        l.entidadeNome?.toLowerCase().includes(termo) ||
        l.descricao?.toLowerCase().includes(termo) ||
        l.modulo?.toLowerCase().includes(termo) ||
        l.registroAnterior?.toLowerCase().includes(termo) ||
        l.registroNovo?.toLowerCase().includes(termo) ||
        l.dataHoraFormatada?.toLowerCase().includes(termo)
      );
    }

    return logs;
  } catch (error) {
    console.error("Erro ao carregar logs de auditoria:", error);
    return [];
  }
}

/**
 * Gera registros de auditoria demonstrativos caso a coleção esteja vazia,
 * incluindo fielmente o caso de uso e exemplos fornecidos pelo usuário.
 */
export async function inicializarLogsExemploSeVazio(escolaId, escolaNome = "E.M. Monsenhor Clóvis Duarte de Barros") {
  try {
    const existentes = await getAuditoriaLogs({ escolaId, limite: 10 });
    if (existentes.length > 0) return existentes;

    const agora = new Date();
    const dataHoje = formatarDataHoraLog(agora).data;

    const logsExemplo = [
      {
        usuarioNome: "João Silva",
        usuarioEmail: "joao.silva@educacao.gov.br",
        usuarioRole: "Professor",
        modulo: "Notas",
        acao: "ALTERACAO_NOTA",
        entidade: "Nota",
        entidadeNome: "Maria Santos (Matemática - 1º Bimestre)",
        registroAnterior: "7,0",
        registroNovo: "8,0",
        descricao: "João Silva alterou a nota de Maria Santos de 7,0 para 8,0",
        data: dataHoje,
        hora: "10:32",
        dataHoraFormatada: `${dataHoje} – 10:32`,
        escolaId,
        escolaNome,
        criadoEm: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        usuarioNome: "Ana Paula Mendonça",
        usuarioEmail: "ana.mendonca@educacao.gov.br",
        usuarioRole: "Secretaria Escolar",
        modulo: "Alunos",
        acao: "REMANEJAMENTO_TURMA",
        entidade: "Aluno",
        entidadeNome: "Carlos Eduardo Souza",
        registroAnterior: "Turma 4º Ano A (Matutino)",
        registroNovo: "Turma 4º Ano B (Vespertino)",
        descricao: "Ana Paula Mendonça remanejou o aluno Carlos Eduardo Souza da Turma 4º Ano A para 4º Ano B",
        data: dataHoje,
        hora: "09:15",
        dataHoraFormatada: `${dataHoje} – 09:15`,
        escolaId,
        escolaNome,
        criadoEm: new Date(Date.now() - 1000 * 60 * 120).toISOString()
      },
      {
        usuarioNome: "Marta Helena Rocha",
        usuarioEmail: "marta.rocha@educacao.gov.br",
        usuarioRole: "Coordenação Pedagógica",
        modulo: "Fechamento",
        acao: "FECHAMENTO_HOMOLOGADO",
        entidade: "Diário de Classe",
        entidadeNome: "5º Ano B - 1º Bimestre",
        registroAnterior: "Aguardando Validação",
        registroNovo: "Fechado 🔒",
        descricao: "Marta Helena Rocha homologou e trancou o fechamento pedagógico do 5º Ano B",
        data: dataHoje,
        hora: "08:40",
        dataHoraFormatada: `${dataHoje} – 08:40`,
        escolaId,
        escolaNome,
        criadoEm: new Date(Date.now() - 1000 * 60 * 180).toISOString()
      },
      {
        usuarioNome: "João Silva",
        usuarioEmail: "joao.silva@educacao.gov.br",
        usuarioRole: "Professor",
        modulo: "Frequência",
        acao: "LANCAMENTO_FREQUENCIA",
        entidade: "Diário de Classe",
        entidadeNome: "Chamada Diária - 5º Ano A (Matemática)",
        registroAnterior: "Não Lançado",
        registroNovo: "26 Presentes / 2 Faltas",
        descricao: "João Silva registrou o diário de classe e frequência do 5º Ano A com 2 faltas",
        data: dataHoje,
        hora: "08:00",
        dataHoraFormatada: `${dataHoje} – 08:00`,
        escolaId,
        escolaNome,
        criadoEm: new Date(Date.now() - 1000 * 60 * 240).toISOString()
      },
      {
        usuarioNome: "Carlos Alberto Santos",
        usuarioEmail: "carlos.santos@educacao.gov.br",
        usuarioRole: "Administrador Municipal",
        modulo: "Alunos",
        acao: "EDICAO_ALUNO",
        entidade: "Aluno",
        entidadeNome: "Lucas Gabriel Ferreira",
        registroAnterior: "Cartão SUS: 000.0000.0000.0000",
        registroNovo: "Cartão SUS: 754.8912.4301.8820",
        descricao: "Carlos Alberto Santos atualizou o número do Cartão SUS do aluno Lucas Gabriel Ferreira",
        data: dataHoje,
        hora: "07:45",
        dataHoraFormatada: `${dataHoje} – 07:45`,
        escolaId,
        escolaNome,
        criadoEm: new Date(Date.now() - 1000 * 60 * 300).toISOString()
      }
    ];

    for (const log of logsExemplo) {
      await addDoc(collection(db, COL_AUDITORIA), {
        ...log,
        origem: "Portal Web Municipal",
        timestamp: serverTimestamp()
      });
    }

    return await getAuditoriaLogs({ escolaId, limite: 10 });
  } catch (err) {
    console.error("Erro ao inicializar logs exemplo:", err);
    return [];
  }
}
