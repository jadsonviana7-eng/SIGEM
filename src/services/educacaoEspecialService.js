import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

// ==========================================
// 1. ALUNOS DA EDUCAÇÃO ESPECIAL / LAUDOS
// ==========================================
const COL_ALUNOS = "ee_alunos";

export async function getAlunosEspecial(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_ALUNOS), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.nomeAluno || "").localeCompare(b.nomeAluno || ""));
}

export async function addAlunoEspecial(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_ALUNOS), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updateAlunoEspecial(id, dados) {
  await updateDoc(doc(db, COL_ALUNOS, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteAlunoEspecial(id) {
  await deleteDoc(doc(db, COL_ALUNOS, id));
}

// ==========================================
// 2. NECESSIDADES EDUCACIONAIS & ACESSIBILIDADE
// ==========================================
const COL_NECESSIDADES = "ee_necessidades";

export async function getNecessidadesEducacionais(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_NECESSIDADES), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.alunoNome || "").localeCompare(b.alunoNome || ""));
}

export async function addNecessidadeEducacional(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_NECESSIDADES), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updateNecessidadeEducacional(id, dados) {
  await updateDoc(doc(db, COL_NECESSIDADES, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteNecessidadeEducacional(id) {
  await deleteDoc(doc(db, COL_NECESSIDADES, id));
}

// ==========================================
// 3. AEE (ATENDIMENTO EDUCACIONAL ESPECIALIZADO)
// ==========================================
const COL_AEE = "ee_atendimentos";

export async function getAtendimentosAEE(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_AEE), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.diaSemana || "").localeCompare(b.diaSemana || ""));
}

export async function addAtendimentoAEE(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_AEE), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updateAtendimentoAEE(id, dados) {
  await updateDoc(doc(db, COL_AEE, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteAtendimentoAEE(id) {
  await deleteDoc(doc(db, COL_AEE, id));
}

// ==========================================
// 4. SALA DE RECURSOS MULTIFUNCIONAIS (SRM)
// ==========================================
const COL_SALAS = "ee_salas_recursos";

export async function getSalasRecursos(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_SALAS), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
}

export async function addSalaRecursos(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_SALAS), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updateSalaRecursos(id, dados) {
  await updateDoc(doc(db, COL_SALAS, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteSalaRecursos(id) {
  await deleteDoc(doc(db, COL_SALAS, id));
}

// ==========================================
// 5. PROFISSIONAIS ESPECIALIZADOS (AEE / Mediadores / TILS)
// ==========================================
const COL_PROFISSIONAIS = "ee_profissionais";

export async function getProfissionaisEspecializados(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_PROFISSIONAIS), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
}

export async function addProfissionalEspecializado(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_PROFISSIONAIS), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updateProfissionalEspecializado(id, dados) {
  await updateDoc(doc(db, COL_PROFISSIONAIS, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteProfissionalEspecializado(id) {
  await deleteDoc(doc(db, COL_PROFISSIONAIS, id));
}

// ==========================================
// 6. PLANO DE ATENDIMENTO INDIVIDUALIZADO (PAI / PEI)
// ==========================================
const COL_PLANOS = "ee_planos_desenvolvimento";

export async function getPlanosAtendimento(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_PLANOS), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.anoLetivo || "").localeCompare(a.anoLetivo || ""));
}

export async function addPlanoAtendimento(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_PLANOS), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updatePlanoAtendimento(id, dados) {
  await updateDoc(doc(db, COL_PLANOS, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deletePlanoAtendimento(id) {
  await deleteDoc(doc(db, COL_PLANOS, id));
}

// ==========================================
// 7. ACOMPANHAMENTO & PARECERES DESCRITIVOS
// ==========================================
const COL_ACOMPANHAMENTOS = "ee_acompanhamentos";

export async function getAcompanhamentosEvolucao(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_ACOMPANHAMENTOS), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.dataRegistro || "").localeCompare(a.dataRegistro || ""));
}

export async function addAcompanhamentoEvolucao(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_ACOMPANHAMENTOS), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updateAcompanhamentoEvolucao(id, dados) {
  await updateDoc(doc(db, COL_ACOMPANHAMENTOS, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteAcompanhamentoEvolucao(id) {
  await deleteDoc(doc(db, COL_ACOMPANHAMENTOS, id));
}

// ==========================================
// 8. LOGS DE ACESSO A DADOS SIGILOSOS (LGPD)
// ==========================================
const COL_LOGS_SIGILO = "ee_logs_sigilo";

export async function registrarAcessoSigiloso(dados, escolaId) {
  try {
    await addDoc(collection(db, COL_LOGS_SIGILO), {
      ...dados,
      escolaId,
      dataHora: new Date().toISOString()
    });
  } catch (e) {
    console.error("Erro ao registrar log de acesso sigiloso:", e);
  }
}

export async function getLogsAcessoSigiloso(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_LOGS_SIGILO), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.dataHora || "").localeCompare(a.dataHora || ""));
}

export const getLogsAcessoSigilo = getLogsAcessoSigiloso;
export const popularDadosIniciaisEspecial = injectEducacaoEspecialMockData;

// ==========================================
// 9. INJEÇÃO DE DADOS MOCK / DEMONSTRAÇÃO
// ==========================================
export async function injectEducacaoEspecialMockData(escolaId, alunosDisponiveis = []) {
  if (!escolaId) return;

  // 1. Salas de Recursos Multifuncionais
  const salasData = [
    {
      nome: "Sala de Recursos Multifuncionais (SRM 01) — Polo Inclusivo",
      tipo: "Tipo I (Mobiliário, Informática e Materiais Pedagógicos)",
      capacidadeAtendimento: 15,
      turnoFuncionamento: "Manhã e Tarde (Contraturno)",
      equipamentos: "2 Computadores adaptados com softwares leitores de tela (NVDA/Dosvox), lupa eletrônica, teclado com colmeia, pranchas de CAA, jogos pedagógicos em madeira e material dourado.",
      status: "Em Atividade",
      responsavelSala: "Profª Helena Ramos da Silva"
    },
    {
      nome: "Espaço de Integração Sensorial e Estimulação",
      tipo: "Tipo II (Estimulação Sensorial e Psicomotricidade)",
      capacidadeAtendimento: 8,
      turnoFuncionamento: "Manhã e Tarde",
      equipamentos: "Tatame em EVA de alta densidade, almofadas sensoriais de equilíbrio, bola suíça, túnel lúdico e fones de abafamento de ruído para acolhimento de alunos autistas (TEA).",
      status: "Em Atividade",
      responsavelSala: "Psicopedagoga Cláudia Valença"
    }
  ];

  const salasCriadas = [];
  for (const s of salasData) {
    const id = await addSalaRecursos(s, escolaId);
    salasCriadas.push({ id, ...s });
  }

  // 2. Profissionais Especializados
  const profissionaisData = [
    {
      nome: "Profª Helena Ramos da Silva",
      cargo: "Professora de AEE (Especialista em Educação Inclusiva)",
      registroProfissional: "MEC/UFAL 48192-AL",
      formacao: "Pedagogia com Pós-Graduação em Atendimento Educacional Especializado (AEE) e TEA",
      telefone: "(82) 99812-4411",
      email: "helena.aee@escola.gov.br",
      cargaHorariaSemanal: "30 horas",
      salaVinculada: salasCriadas[0]?.nome || "SRM 01",
      status: "Ativo"
    },
    {
      nome: "Marcos Vinícius de Andrade",
      cargo: "Tradutor e Intérprete de Libras (TILS)",
      registroProfissional: "PROLIBRAS / MEC 11094",
      formacao: "Letras Libras e Certificação Nacional de Proficiência em Tradução e Interpretação",
      telefone: "(82) 98722-3399",
      email: "marcos.tils@escola.gov.br",
      cargaHorariaSemanal: "25 horas",
      status: "Ativo"
    },
    {
      nome: "Dra. Cláudia Valença de Lima",
      cargo: "Psicopedagoga Institucional / Equipe Multidisciplinar",
      registroProfissional: "ABPp-AL 3421",
      formacao: "Psicologia com Especialização em Neuropsicopedagogia Clínica e Inclusiva",
      telefone: "(82) 99144-8822",
      email: "claudia.psico@escola.gov.br",
      cargaHorariaSemanal: "20 horas",
      status: "Ativo"
    },
    {
      nome: "Rosângela Maria dos Santos",
      cargo: "Profissional de Apoio Escolar / Mediadora",
      registroProfissional: "Contrato Monitoria Escolar",
      formacao: "Magistério e Curso de Capacitação em Manejo de Comportamento no TEA",
      telefone: "(82) 99311-7700",
      email: "rosangela.apoio@escola.gov.br",
      cargaHorariaSemanal: "40 horas",
      status: "Ativo"
    }
  ];

  const profsCriados = [];
  for (const p of profissionaisData) {
    const id = await addProfissionalEspecializado(p, escolaId);
    profsCriados.push({ id, ...p });
  }

  // 3. Alunos da Educação Especial
  const alunosEspecialData = [
    {
      alunoId: alunosDisponiveis[0]?.id || "aluno_mock_1",
      nomeAluno: alunosDisponiveis[0]?.nome || "Lucas Gabriel dos Santos",
      turmaRegular: alunosDisponiveis[0]?.turma || "4º Ano A (Manhã)",
      dataNascimento: "2016-04-12",
      diagnosticoPrincipal: "Transtorno do Espectro Autista (TEA) - Nível 2 de Suporte",
      cid10: "CID-10: F84.0 / CID-11: 6A02.1",
      temLaudoMedico: "Sim (Laudo Homologado)",
      medicoLaudo: "Dr. Roberto Antunes (Neuropediatra - CRM 8940-AL)",
      dataLaudo: "2025-08-15",
      frequenciaAEE: "2x por semana (Terça e Quinta - 14h às 14h50)",
      professorAEEResponsavel: profsCriados[0]?.nome || "Profª Helena Ramos da Silva",
      necessitaMediadorApoio: "Sim (Acompanhamento em tempo integral na sala regular)",
      profissionalApoio: profsCriados[3]?.nome || "Rosângela Maria dos Santos",
      recursosTecnologiaAssistiva: "Prancha de Comunicação Alternativa (PECS), fones abafadores de som para momentos de hipersensibilidade e rotina visual plastificada.",
      responsavelNome: "Carla Patrícia dos Santos",
      responsavelTelefone: "(82) 99876-1234",
      status: "Ativo no AEE",
      observacoesConfidenciais: "Apresenta excelente memória visual. Em momentos de sobrecarga sensorial, acolher no Espaço Sensorial para autorregulação."
    },
    {
      alunoId: alunosDisponiveis[1]?.id || "aluno_mock_2",
      nomeAluno: alunosDisponiveis[1]?.nome || "Ana Clara de Oliveira",
      turmaRegular: alunosDisponiveis[1]?.turma || "6º Ano B (Tarde)",
      dataNascimento: "2014-09-22",
      diagnosticoPrincipal: "Deficiência Auditiva Bilateral Severa (Usuária de Libras)",
      cid10: "CID-10: H90.3",
      temLaudoMedico: "Sim (Audiometria e Laudo Homologado)",
      medicoLaudo: "Dra. Silvana Paiva (Otorrinolaringologista - CRM 7120-AL)",
      dataLaudo: "2025-02-10",
      frequenciaAEE: "3x por semana (Segunda, Quarta e Sexta - 09h às 10h)",
      professorAEEResponsavel: profsCriados[0]?.nome || "Profª Helena Ramos da Silva",
      necessitaMediadorApoio: "Sim (Intérprete de Libras na sala de aula)",
      profissionalApoio: profsCriados[1]?.nome || "Marcos Vinícius de Andrade (TILS)",
      recursosTecnologiaAssistiva: "Intérprete de Libras presencial, recursos imagéticos, vídeos legendados e materiais didáticos bilingues (Libras/Português escrito).",
      responsavelNome: "Márcia Regina de Oliveira",
      responsavelTelefone: "(82) 99123-4567",
      status: "Ativo no AEE",
      observacoesConfidenciais: "A aluna tem excelente proficiência em Libras e está em fase de alfabetização na Língua Portuguesa como L2."
    },
    {
      alunoId: alunosDisponiveis[2]?.id || "aluno_mock_3",
      nomeAluno: alunosDisponiveis[2]?.nome || "Matheus Henrique Ferreira",
      turmaRegular: alunosDisponiveis[2]?.turma || "3º Ano B (Manhã)",
      dataNascimento: "2017-01-08",
      diagnosticoPrincipal: "Síndrome de Down com Atraso Global do Desenvolvimento",
      cid10: "CID-10: Q90.9",
      temLaudoMedico: "Sim (Genético e Pediatria)",
      medicoLaudo: "Dr. Fernando Siqueira (Pediatra / Geneticista - CRM 6430-AL)",
      dataLaudo: "2024-11-20",
      frequenciaAEE: "2x por semana (Quarta e Sexta - 13h30 às 14h20)",
      professorAEEResponsavel: profsCriados[0]?.nome || "Profª Helena Ramos da Silva",
      necessitaMediadorApoio: "Sim (Apoio na locomoção, alimentação e atividades pedagógicas)",
      profissionalApoio: profsCriados[3]?.nome || "Rosângela Maria dos Santos",
      recursosTecnologiaAssistiva: "Engrossadores de lápis, tesoura adaptada com mola, teclado expandido e material pedagógico estruturado.",
      responsavelNome: "Juliana Ferreira de Albuquerque",
      responsavelTelefone: "(82) 98844-9911",
      status: "Ativo no AEE",
      observacoesConfidenciais: "Muito sociável e participativo. Trabalhar reforço da coordenação motora fina e autonomia nas tarefas diárias."
    }
  ];

  const alunosCriados = [];
  for (const a of alunosEspecialData) {
    const id = await addAlunoEspecial(a, escolaId);
    alunosCriados.push({ id, ...a });
  }

  // 4. Cronograma de Atendimentos AEE
  const atendimentosData = [
    {
      alunoId: alunosCriados[0]?.id || "",
      alunoNome: alunosCriados[0]?.nomeAluno || "Lucas Gabriel",
      diaSemana: "Terça-feira",
      horarioInicio: "14:00",
      horarioFim: "14:50",
      modalidade: "Individual",
      objetivoSessao: "Desenvolvimento da comunicação aumentativa (CAA), funções executivas e flexibilidade cognitiva.",
      salaRecursos: salasCriadas[0]?.nome || "SRM 01",
      professorAEE: profsCriados[0]?.nome || "Profª Helena Ramos"
    },
    {
      alunoId: alunosCriados[0]?.id || "",
      alunoNome: alunosCriados[0]?.nomeAluno || "Lucas Gabriel",
      diaSemana: "Quinta-feira",
      horarioInicio: "14:00",
      horarioFim: "14:50",
      modalidade: "Pequeno Grupo (Habilidades Sociais)",
      objetivoSessao: "Interação social estruturada, turnos de fala e jogos cooperativos.",
      salaRecursos: salasCriadas[0]?.nome || "SRM 01",
      professorAEE: profsCriados[0]?.nome || "Profª Helena Ramos"
    },
    {
      alunoId: alunosCriados[1]?.id || "",
      alunoNome: alunosCriados[1]?.nomeAluno || "Ana Clara",
      diaSemana: "Segunda-feira",
      horarioInicio: "09:00",
      horarioFim: "10:00",
      modalidade: "Individual (Libras L1 e Português L2)",
      objetivoSessao: "Ampliação de vocabulário acadêmico em Libras e escrita da Língua Portuguesa como segunda língua.",
      salaRecursos: salasCriadas[0]?.nome || "SRM 01",
      professorAEE: profsCriados[0]?.nome || "Profª Helena Ramos"
    }
  ];

  for (const at of atendimentosData) {
    await addAtendimentoAEE(at, escolaId);
  }

  // 5. Plano de Atendimento Individualizado (PEI / PAI)
  const peiData = [
    {
      alunoId: alunosCriados[0]?.id || "",
      alunoNome: alunosCriados[0]?.nomeAluno || "Lucas Gabriel dos Santos",
      anoLetivo: "2026",
      periodoVigencia: "Anual (Revisão Semestral)",
      professorAEEResponsavel: profsCriados[0]?.nome || "Profª Helena Ramos da Silva",
      professoresRegulares: "Profª Marília (4º Ano A)",
      equipeMultidisciplinar: "Dra. Cláudia Valença (Psicopedagoga)",
      
      habilidadesAtuais: "Identifica letras, números e cores. Apresenta boa compreensão de comandos diretos. Comunica-se por palavras isoladas e gestos direcionados.",
      habilidadesADesenvolver: "Construção de frases com o auxílio da prancha de comunicação, tempo de permanência em atividades em sala de aula e autonomia na organização do material.",
      metasPedagogicasCurtoPrazo: "Aumentar para 20 minutos o engajamento contínuo em atividades com apoio visual. Utilizar a prancha PECS para solicitar água e banheiro.",
      metasPedagogicasMedioPrazo: "Início do processo de leitura de palavras simples com apoio pictográfico e realização de cálculos de adição até 10 com material concreto.",
      
      adaptacoesCurriculares: "Enunciados curtos e ilustrados; fracionamento de provas e avaliações em etapas; tempo adicional de 30% em avaliações escolares; permissão para pausas sensoriais.",
      recursosNecessarios: "Pranchas de CAA em alta resolução, rotina visual de mesa, fones abafadores acústicos e caderno com pauta ampliada.",
      
      dataElaboracao: "2026-02-15",
      dataProximaRevisao: "2026-07-15",
      reunioesFamiliaRealizadas: "02 reuniões com a mãe em 18/02 e 14/04 com alinhamento das metas terapêuticas e escolares.",
      statusPlano: "Em Andamento (Evolução Positiva)"
    }
  ];

  for (const p of peiData) {
    await addPlanoAtendimento(p, escolaId);
  }

  // 6. Acompanhamentos e Registros de Evolução
  const acompanhamentosData = [
    {
      alunoId: alunosCriados[0]?.id || "",
      alunoNome: alunosCriados[0]?.nomeAluno || "Lucas Gabriel dos Santos",
      dataRegistro: "2026-09-20",
      tipoRegistro: "Parecer de Evolução Trimestral",
      autor: profsCriados[0]?.nome || "Profª Helena Ramos da Silva",
      cargoAutor: "Professora de AEE",
      parecerDescritivo: "O estudante apresentou um avanço notável na utilização da prancha de comunicação alternativa para expressar necessidades e vontades. A interação com os colegas na sala regular melhorou significativamente com a mediação da monitora Rosângela. Redução de 80% nos episódios de sobrecarga sensorial.",
      encaminhamentos: "Manter o cronograma de 2 sessões semanais e introduzir novas categorias lexicais na prancha de CAA (animais, sentimentos e ações)."
    },
    {
      alunoId: alunosCriados[1]?.id || "",
      alunoNome: alunosCriados[1]?.nomeAluno || "Ana Clara de Oliveira",
      dataRegistro: "2026-09-28",
      tipoRegistro: "Parecer Interdisciplinar AEE & Sala Regular",
      autor: profsCriados[1]?.nome || "Marcos Vinícius (TILS)",
      cargoAutor: "Tradutor e Intérprete de Libras",
      parecerDescritivo: "A estudante participa ativamente das aulas de Ciências e História com a mediação do intérprete. Teve nota 8.5 na avaliação adaptada de Geografia. Recomenda-se continuar com a produção de glossários visuais prévios antes dos conteúdos novos.",
      encaminhamentos: "Alinhamento com o professor de Língua Portuguesa para foco na estrutura sintática da escrita."
    }
  ];

  for (const ac of acompanhamentosData) {
    await addAcompanhamentoEvolucao(ac, escolaId);
  }

  return true;
}
