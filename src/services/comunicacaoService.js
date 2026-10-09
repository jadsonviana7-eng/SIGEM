import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase";

const COL_AVISOS = "comunicados_avisos";
const COL_REUNIOES = "comunicados_reunioes";
const COL_EVENTOS = "comunicados_eventos";
const COL_MENSAGENS = "comunicados_mensagens";

// ==========================================
// 1. AVISOS E COMUNICADOS GERAIS
// ==========================================
export async function getAvisos(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_AVISOS), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.dataPublicacao || "").localeCompare(a.dataPublicacao || ""));
}

export async function addAviso(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_AVISOS), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString(),
    confirmacoesLeitura: []
  });
  return ref.id;
}

export async function updateAviso(id, dados) {
  await updateDoc(doc(db, COL_AVISOS, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteAviso(id) {
  await deleteDoc(doc(db, COL_AVISOS, id));
}

// ==========================================
// 2. REUNIÕES DE PAIS & MESTRES
// ==========================================
export async function getReunioes(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_REUNIOES), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.dataReuniao || "").localeCompare(a.dataReuniao || ""));
}

export async function addReuniao(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_REUNIOES), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString(),
    confirmados: [],
    justificados: []
  });
  return ref.id;
}

export async function updateReuniao(id, dados) {
  await updateDoc(doc(db, COL_REUNIOES, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteReuniao(id) {
  await deleteDoc(doc(db, COL_REUNIOES, id));
}

// ==========================================
// 3. EVENTOS E CALENDÁRIO ESCOLAR
// ==========================================
export async function getEventos(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_EVENTOS), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.dataEvento || "").localeCompare(b.dataEvento || ""));
}

export async function addEvento(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_EVENTOS), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updateEvento(id, dados) {
  await updateDoc(doc(db, COL_EVENTOS, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteEvento(id) {
  await deleteDoc(doc(db, COL_EVENTOS, id));
}

// ==========================================
// 4. MENSAGENS DIRETAS & NOTIFICAÇÕES (BOLETIM / FREQUÊNCIA)
// ==========================================
export async function getMensagens(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_MENSAGENS), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.enviadoEm || "").localeCompare(a.enviadoEm || ""));
}

export async function addMensagem(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_MENSAGENS), {
    ...dados,
    escolaId,
    enviadoEm: new Date().toISOString(),
    status: "Enviada"
  });
  return ref.id;
}

export async function deleteMensagem(id) {
  await deleteDoc(doc(db, COL_MENSAGENS, id));
}

// ==========================================
// 5. INJEÇÃO DE DADOS DE DEMONSTRAÇÃO
// ==========================================
export async function injectComunicacaoMockData(escolaId, turmas = [], alunos = []) {
  if (!escolaId) return;

  const turmaNome1 = turmas[0]?.nome || "1º Ano A";
  const turmaNome2 = turmas[1]?.nome || "3º Ano B";

  // 1. Avisos e Comunicados
  const mockAvisos = [
    {
      titulo: "Início do 2º Bimestre e Calendário de Provas",
      categoria: "Pedagógico",
      prioridade: "Importante", // Normal, Importante, Urgente
      publicoAlvo: "Toda a Escola", // Toda a Escola, Turma Específica, Ensino Fundamental I
      turmaAlvo: "",
      conteudo: "Prezados pais e responsáveis, informamos que o 2º bimestre letivo terá início na próxima segunda-feira. O cronograma das avaliações formativas e os conteúdos programáticos já estão disponíveis no mural digital.",
      dataPublicacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      autor: "Coordenação Pedagógica",
      exigeConfirmacaoLeitura: true,
      confirmacoesLeitura: [
        { responsavelNome: "Maria da Silva", data: new Date().toISOString() },
        { responsavelNome: "João Pereira", data: new Date().toISOString() }
      ],
      anexoNome: "calendario_avaliacoes_2bim.pdf",
      status: "Ativo"
    },
    {
      titulo: "Campanha de Vacinação Infantil na Escola Municipal",
      categoria: "Saúde & Prevenção",
      prioridade: "Urgente",
      publicoAlvo: "Toda a Escola",
      turmaAlvo: "",
      conteudo: "Na próxima quarta-feira, a equipe da Unidade Básica de Saúde estará em nossa escola para atualização da caderneta de vacinação dos estudantes (Gripe, Tríplice Viral e HPV). Solicitamos o envio da carteira de vacinação original e termo de autorização assinado.",
      dataPublicacao: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      autor: "Direção Escolar",
      exigeConfirmacaoLeitura: true,
      confirmacoesLeitura: [
        { responsavelNome: "Ana Lúcia Santos", data: new Date().toISOString() }
      ],
      anexoNome: "termo_autorizacao_vacinacao.pdf",
      status: "Ativo"
    },
    {
      titulo: `Projeto Leitura em Família — ${turmaNome1}`,
      categoria: "Projetos Escolares",
      prioridade: "Normal",
      publicoAlvo: "Turma Específica",
      turmaAlvo: turmaNome1,
      conteudo: `Os alunos do ${turmaNome1} levarão semanalmente a 'Sacola Viajante da Leitura' para casa. Convidamos os pais a dedicarem 20 minutos de leitura compartilhada com seus filhos.`,
      dataPublicacao: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      autor: "Profª Helena Ribeiro",
      exigeConfirmacaoLeitura: false,
      confirmacoesLeitura: [],
      anexoNome: "",
      status: "Ativo"
    }
  ];

  for (const a of mockAvisos) {
    await addDoc(collection(db, COL_AVISOS), { ...a, escolaId, criadoEm: new Date().toISOString() });
  }

  // 2. Reuniões de Pais & Mestres
  const mockReunioes = [
    {
      titulo: "1ª Reunião de Pais e Mestres — Alinhamento Pedagógico",
      turmaAlvo: "Toda a Escola",
      dataReuniao: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      horarioInicio: "18:30",
      horarioFim: "20:00",
      local: "Quadra Poliesportiva Coberta",
      modalidade: "Presencial",
      pauta: "Apresentação da equipe docente, metas do ano letivo, sistema de avaliação contínua, frequência escolar e uso da caderneta digital.",
      organizador: "Direção & Coordenação Pedagógica",
      totalConvidados: 120,
      confirmados: [
        { nomeResponsavel: "Marcos Antônio Lima", alunoNome: "Enzo Lima", status: "Confirmado" },
        { nomeResponsavel: "Carla Soares", alunoNome: "Vitória Soares", status: "Confirmado" }
      ],
      justificados: [
        { nomeResponsavel: "Roberto Alves", alunoNome: "Caio Alves", motivo: "Compromisso de trabalho" }
      ],
      status: "Agendada"
    },
    {
      titulo: `Plantão Pedagógico Individual — ${turmaNome2}`,
      turmaAlvo: turmaNome2,
      dataReuniao: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      horarioInicio: "13:30",
      horarioFim: "17:00",
      local: "Sala de Professores / Bloco B",
      modalidade: "Presencial",
      pauta: "Entrega de pareceres descritivos e atendimento individualizado aos pais dos educandos.",
      organizador: "Professores do 3º Ano",
      totalConvidados: 30,
      confirmados: [],
      justificados: [],
      status: "Agendada"
    }
  ];

  for (const r of mockReunioes) {
    await addDoc(collection(db, COL_REUNIOES), { ...r, escolaId, criadoEm: new Date().toISOString() });
  }

  // 3. Eventos Escolares
  const mockEventos = [
    {
      titulo: "Feira de Ciências & Meio Ambiente Municipal",
      categoria: "Acadêmico / Cultural",
      dataEvento: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      horario: "08:30 às 16:00",
      local: "Pátio Central e Laboratório Integrado",
      descricao: "Apresentação dos projetos científicos desenvolvidos pelos estudantes com foco em sustentabilidade e preservação do Rio Ipanema.",
      publicoPermitido: "Aberto a toda a Comunidade e Famílias",
      responsavel: "Prof. Carlos Mendonça",
      status: "Confirmado"
    },
    {
      titulo: "Festa da Família na Escola & Mostra Artística",
      categoria: "Comunitário / Festivo",
      dataEvento: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      horario: "09:00 às 13:00",
      local: "Escola Municipal de Ensino Fundamental",
      descricao: "Dia de convivência familiar com apresentações musicais dos alunos, jogos cooperativos e lanche comunitário.",
      publicoPermitido: "Estudantes, Pais, Mães e Familiares",
      responsavel: "Grêmio Estudantil & Direção",
      status: "Confirmado"
    }
  ];

  for (const e of mockEventos) {
    await addDoc(collection(db, COL_EVENTOS), { ...e, escolaId, criadoEm: new Date().toISOString() });
  }

  // 4. Mensagens e Alertas Automáticos
  const aluno1 = alunos[0] || { nome: "Lucas Albuquerque", turma: turmaNome1, responsavel: "Mariana Albuquerque", telefone: "(82) 99876-5432" };
  const aluno2 = alunos[1] || { nome: "Beatriz Costa Santos", turma: turmaNome2, responsavel: "Carlos Eduardo Santos", telefone: "(82) 99123-4567" };

  const mockMensagens = [
    {
      tipo: "Boletim Disponível",
      alunoNome: aluno1.nome,
      alunoTurma: aluno1.turma,
      responsavelNome: aluno1.responsavel || "Mariana Albuquerque",
      telefoneResponsavel: aluno1.telefone || "(82) 99876-5432",
      canalEnvio: "WhatsApp & Mural Digital",
      assunto: "Boletim Escolar do 1º Bimestre Disponível",
      conteudo: `Olá, ${aluno1.responsavel || "Responsável"}! As notas e o boletim escolar do(a) estudante ${aluno1.nome} referentes ao 1º Bimestre já estão disponíveis para consulta no portal digital SIGEM.`,
      enviadoEm: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: "Entregue"
    },
    {
      tipo: "Alerta de Frequência",
      alunoNome: aluno2.nome,
      alunoTurma: aluno2.turma,
      responsavelNome: aluno2.responsavel || "Carlos Eduardo Santos",
      telefoneResponsavel: aluno2.telefone || "(82) 99123-4567",
      canalEnvio: "WhatsApp & SMS",
      assunto: "Aviso de Ausência Escolar",
      conteudo: `Prezado(a) ${aluno2.responsavel || "Responsável"}, notamos que o(a) aluno(a) ${aluno2.nome} esteve ausente nas últimas 3 aulas sem justificativa prévia. Solicitamos contato com a secretaria para alinhamento.`,
      enviadoEm: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      status: "Entregue"
    },
    {
      tipo: "Recado Pedagógico",
      alunoNome: aluno1.nome,
      alunoTurma: aluno1.turma,
      responsavelNome: aluno1.responsavel || "Mariana Albuquerque",
      telefoneResponsavel: aluno1.telefone || "(82) 99876-5432",
      canalEnvio: "Mural Digital",
      assunto: "Parabéns pelo destaque na Feira Literária",
      conteudo: `Gostaríamos de parabenizar ${aluno1.nome} pela excelente dedicação e participação no concurso de redação desta semana!`,
      enviadoEm: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: "Lido"
    }
  ];

  for (const m of mockMensagens) {
    await addDoc(collection(db, COL_MENSAGENS), { ...m, escolaId });
  }
}
