export const ANOS_LETIVOS = [
  "Creche", "Pré-Escola",
  "1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano",
  "6º Ano", "7º Ano", "8º Ano", "9º Ano",
];

export const TURNOS = ["Manhã", "Tarde", "Noite"];

export const DISCIPLINAS = [
  "Português", "Matemática", "Ciências", "História",
  "Geografia", "Educação Física", "Artes", "Inglês",
  "Ensino Religioso",
];

export const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const STATUS_ALUNO = ["Ativo", "Transferido", "Inativo", "Concluído"];

export const ANO_LETIVO_ATUAL = 2026;

export const GENEROS = ["Masculino", "Feminino"];

export const CORES_RACAS = ["Branca", "Preta", "Parda", "Amarela", "Indígena", "Não Declarada"];

export const ZONAS = ["Urbana", "Rural"];

export const DEFICIENCIAS = [
  "Nenhuma",
  "Visuais",
  "Auditivas",
  "Autismo",
  "Cadeirante",
  "Dislexia",
  "Físicas",
  "Paralisia",
  "Retardo Mental",
  "Síndrome de Down",
  "Superdotação",
  "TDAH",
  "TEA"
];

export const PROGRAMAS_SOCIAIS = [
  "Nenhum",
  "Programa Bolsa Família",
  "BPC | Benefício de Prestação Continuada",
  "Pé-de-Meia",
  "Outros"
];

export const SITUACOES_MATRICULA = [
  "Regular",
  "Matricula Nova",
  "Renovação",
  "Pendente"
];

export function calcularMedia(bimestres) {
  const vals = Object.values(bimestres)
    .map(Number)
    .filter((v) => !isNaN(v) && v !== null && v !== "");
  if (!vals.length) return null;
  return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

export function situacaoAluno(media) {
  if (media === null) return { label: "—", cor: "blue" };
  if (media >= 7) return { label: "Aprovado", cor: "green" };
  if (media >= 5) return { label: "Recuperação", cor: "amber" };
  return { label: "Reprovado", cor: "red" };
}

export function calcularFrequencia(dias) {
  const entradas = Object.values(dias || {});
  if (!entradas.length) return 100;
  const presentes = entradas.filter((v) => v === "P").length;
  return Math.round((presentes / entradas.length) * 100);
}

export const ETAPAS_ENSINO = [
  "Educação Infantil (Creche/Pré-Escola)",
  "Ensino Fundamental (Anos Iniciais / 1º ao 5º ano)",
  "Ensino Fundamental (Anos Finais / 6º ao 9º ano)"
];

export const TURNOS_MATRICULA = ["Matutino", "Vespertino", "Integral"];

export const NACIONALIDADES = ["Brasileira", "Estrangeira", "Naturalizado"];

export const SITUACOES_ANTERIOR = [
  "Aprovado",
  "Reprovado",
  "Abandono",
  "Nunca frequentou a escola"
];

export const VINCULOS_RESPONSAVEL = ["Mãe", "Pai", "Avô/Avó", "Tio/Tia", "Outro"];

export const DEFICIENCIAS_INEP_2026 = [
  "Cegueira / Baixa Visão",
  "Surdez / Deficiência Auditiva",
  "Deficiência Intelectual",
  "Deficiência Física",
  "Deficiência Múltipla",
  "Transtorno do Espectro Autista (TEA)",
  "Altas Habilidades / Superdotação"
];



export const TIPOS_DOCUMENTOS_ALUNO = [
  {
    id: "certidaoNascimento",
    label: "Certidão de Nascimento",
    obrigatorio: true,
    icone: "file-certificate",
    descricao: "Certidão de nascimento / Registro civil do aluno",
    dica: "Formato PDF ou Imagem (PNG/JPG)"
  },
  {
    id: "cpf",
    label: "CPF do Aluno",
    obrigatorio: true,
    icone: "id-badge-2",
    descricao: "Comprovante de CPF do aluno (Obrigatório Censo)",
    dica: "Formato PDF ou Imagem"
  },
  {
    id: "documentoResponsavel",
    label: "Documento do Responsável",
    obrigatorio: true,
    icone: "users",
    descricao: "RG, CNH ou CPF do pai, mãe ou responsável legal",
    dica: "Frente e verso ou arquivo único"
  },
  {
    id: "comprovanteResidencia",
    label: "Comprovante de Residência",
    obrigatorio: true,
    icone: "home-pin",
    descricao: "Conta de água, luz ou declaração de residência recente",
    dica: "Emitido nos últimos 90 dias"
  },
  {
    id: "cartaoVacinacao",
    label: "Cartão de Vacinação",
    obrigatorio: false,
    icone: "vaccine",
    descricao: "Cartão / Caderneta de vacinação atualizada",
    dica: "Quando aplicável (Educação Infantil e Fundamental)"
  },
  {
    id: "historicoEscolar",
    label: "Histórico Escolar",
    obrigatorio: false,
    icone: "file-text",
    descricao: "Histórico de anos/etapas anteriores",
    dica: "Documento oficial da escola de procedência"
  },
  {
    id: "declaracaoTransferencia",
    label: "Declaração de Transferência",
    obrigatorio: false,
    icone: "file-export",
    descricao: "Declaração provisória de transferência",
    dica: "Válida até a chegada do histórico"
  },
  {
    id: "outrosDocumentos",
    label: "Outros Documentos Exigidos",
    obrigatorio: false,
    icone: "folder-plus",
    descricao: "Laudo médico (AEE), declarações municipais, etc.",
    dica: "Documentos complementares exigidos pelo município"
  }
];

export const TIPOS_OCORRENCIA = [
  "Disciplinar / Indisciplina em Sala",
  "Comportamental / Conflito com Colegas",
  "Agressão Física ou Verbal / Bullying",
  "Atraso Recorrente / Saída Não Autorizada",
  "Descumprimento de Regras Escolares / Uniforme / Celular",
  "Dano ao Patrimônio Escolar",
  "Pedagógica / Recusa em Realizar Atividades",
  "Saúde / Mal-estar / Acidente Escolar",
  "Elogio / Destaque Positivo / Mérito",
  "Outro"
];

export const GRAVIDADES_OCORRENCIA = [
  { id: "leve", label: "Leve", cor: "blue", icone: "info-circle" },
  { id: "media", label: "Média", cor: "amber", icone: "alert-circle" },
  { id: "grave", label: "Grave", cor: "red", icone: "alert-triangle" },
  { id: "gravissima", label: "Gravíssima", cor: "purple", icone: "flame" },
  { id: "positiva", label: "Positiva / Elogio", cor: "green", icone: "star" }
];

export const STATUS_OCORRENCIA = [
  { id: "Aberta", label: "Em Aberto", cor: "amber" },
  { id: "Em Apuracao", label: "Em Apuração / Mediação", cor: "blue" },
  { id: "Responsaveis Notificados", label: "Família Notificada", cor: "purple" },
  { id: "Resolvida", label: "Resolvida / Concluída", cor: "green" },
  { id: "Encaminhada Externamente", label: "Encaminhada (Conselho/CREAS)", cor: "red" }
];

export const ACOES_ENCAMINHAMENTO_OCORRENCIA = [
  "Conversa de Orientação com Aluno",
  "Advertência Verbal",
  "Advertência Escrita no Prontuário",
  "Convocação Presencial dos Pais/Responsáveis",
  "Notificação por Escrito à Família",
  "Termo de Compromisso Disciplinar Assinado",
  "Encaminhamento à Coordenação Pedagógica",
  "Encaminhamento ao Apoio Psicológico / Psicopedagógico",
  "Encaminhamento ao Conselho Tutelar / CREAS",
  "Suspensão Temporária de Atividades",
  "Ressarcimento / Reparação de Danos",
  "Elogio Registrado em Ficha Cadastral"
];

