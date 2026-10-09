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
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

// ==========================================
// 1. ROTAS DE TRANSPORTE
// ==========================================
const COL_ROTAS = "transporte_rotas";

export async function getRotas(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_ROTAS), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
}

export async function addRota(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_ROTAS), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updateRota(id, dados) {
  await updateDoc(doc(db, COL_ROTAS, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteRota(id) {
  await deleteDoc(doc(db, COL_ROTAS, id));
}

// ==========================================
// 2. VEÍCULOS
// ==========================================
const COL_VEICULOS = "transporte_veiculos";

export async function getVeiculos(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_VEICULOS), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.placa || "").localeCompare(b.placa || ""));
}

export async function addVeiculo(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_VEICULOS), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updateVeiculo(id, dados) {
  await updateDoc(doc(db, COL_VEICULOS, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteVeiculo(id) {
  await deleteDoc(doc(db, COL_VEICULOS, id));
}

// ==========================================
// 3. MOTORISTAS E MONITORES
// ==========================================
const COL_MOTORISTAS = "transporte_motoristas";

export async function getMotoristas(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_MOTORISTAS), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
}

export async function addMotorista(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_MOTORISTAS), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updateMotorista(id, dados) {
  await updateDoc(doc(db, COL_MOTORISTAS, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteMotorista(id) {
  await deleteDoc(doc(db, COL_MOTORISTAS, id));
}

// ==========================================
// 4. ALUNOS TRANSPORTADOS
// ==========================================
const COL_ALUNOS_TRANSPORTE = "transporte_alunos";

export async function getAlunosTransporte(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_ALUNOS_TRANSPORTE), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.nomeAluno || "").localeCompare(b.nomeAluno || ""));
}

export async function addAlunoTransporte(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_ALUNOS_TRANSPORTE), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updateAlunoTransporte(id, dados) {
  await updateDoc(doc(db, COL_ALUNOS_TRANSPORTE, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteAlunoTransporte(id) {
  await deleteDoc(doc(db, COL_ALUNOS_TRANSPORTE, id));
}

// ==========================================
// 5. PONTOS DE EMBARQUE
// ==========================================
const COL_PONTOS = "transporte_pontos";

export async function getPontosEmbarque(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_PONTOS), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
}

export async function addPontoEmbarque(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_PONTOS), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updatePontoEmbarque(id, dados) {
  await updateDoc(doc(db, COL_PONTOS, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deletePontoEmbarque(id) {
  await deleteDoc(doc(db, COL_PONTOS, id));
}

// ==========================================
// 6. FREQUÊNCIA E DIÁRIO DE BORDO
// ==========================================
const COL_FREQUENCIA = "transporte_frequencias";
const COL_VIAGENS = "transporte_viagens";

export async function getFrequenciasTransporte(escolaId, rotaId = null, data = null) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_FREQUENCIA), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (rotaId) list = list.filter(item => item.rotaId === rotaId);
  if (data) list = list.filter(item => item.data === data);
  return list.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
}

export async function saveFrequenciaTransporte(registro, escolaId) {
  // Se já existe registro para a mesma rota, data e turno, atualiza; senão cria
  const q = query(
    collection(db, COL_FREQUENCIA),
    where("escolaId", "==", escolaId),
    where("rotaId", "==", registro.rotaId),
    where("data", "==", registro.data),
    where("turno", "==", registro.turno)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    const docId = snap.docs[0].id;
    await updateDoc(doc(db, COL_FREQUENCIA, docId), {
      ...registro,
      atualizadoEm: new Date().toISOString()
    });
    return docId;
  } else {
    const ref = await addDoc(collection(db, COL_FREQUENCIA), {
      ...registro,
      escolaId,
      criadoEm: new Date().toISOString()
    });
    return ref.id;
  }
}

export async function getViagensDiario(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_VIAGENS), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
}

export async function addViagemDiario(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_VIAGENS), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updateViagemDiario(id, dados) {
  await updateDoc(doc(db, COL_VIAGENS, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteViagemDiario(id) {
  await deleteDoc(doc(db, COL_VIAGENS, id));
}

// ==========================================
// 7. MANUTENÇÃO DE VEÍCULOS
// ==========================================
const COL_MANUTENCAO = "transporte_manutencoes";

export async function getManutencoes(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_MANUTENCAO), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
}

export async function addManutencao(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_MANUTENCAO), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updateManutencao(id, dados) {
  await updateDoc(doc(db, COL_MANUTENCAO, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteManutencao(id) {
  await deleteDoc(doc(db, COL_MANUTENCAO, id));
}

// ==========================================
// 8. CUSTOS E ABASTECIMENTO
// ==========================================
const COL_CUSTOS = "transporte_custos";

export async function getCustosTransporte(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_CUSTOS), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
}

export async function addCustoTransporte(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_CUSTOS), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updateCustoTransporte(id, dados) {
  await updateDoc(doc(db, COL_CUSTOS, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteCustoTransporte(id) {
  await deleteDoc(doc(db, COL_CUSTOS, id));
}

// ==========================================
// INJEÇÃO DE DADOS MOCK / DEMONSTRAÇÃO
// ==========================================
export async function injectTransporteMockData(escolaId, alunosDisponiveis = []) {
  if (!escolaId) return;

  // 1. Motoristas
  const motoristasData = [
    {
      nome: "Carlos Eduardo da Silva",
      cpf: "123.456.789-01",
      telefone: "(82) 99821-4433",
      cnh: "04829103940",
      categoriaCnh: "D",
      validadeCnh: "2027-11-20",
      cursoTransporte: "Válido até 2026-08-15",
      tipo: "Motorista",
      status: "Ativo",
      experiencia: "8 anos em transporte de escolares"
    },
    {
      nome: "José Roberto de Oliveira",
      cpf: "234.567.890-12",
      telefone: "(82) 98712-9900",
      cnh: "09918237411",
      categoriaCnh: "D",
      validadeCnh: "2026-05-10",
      cursoTransporte: "Válido até 2026-12-10",
      tipo: "Motorista",
      status: "Ativo",
      experiencia: "12 anos em linhas rurais"
    },
    {
      nome: "Maria Helena de Barros",
      cpf: "345.678.901-23",
      telefone: "(82) 99134-5588",
      cnh: "-",
      categoriaCnh: "-",
      validadeCnh: "-",
      cursoTransporte: "Capacitação de Primeiros Socorros / Monitoria",
      tipo: "Monitor(a)",
      status: "Ativo",
      experiencia: "Acompanhamento de alunos especiais e ensino infantil"
    }
  ];

  const motoristaIds = [];
  for (const m of motoristasData) {
    const id = await addMotorista(m, escolaId);
    motoristaIds.push({ id, ...m });
  }

  // 2. Veículos
  const veiculosData = [
    {
      placa: "QLD-4820",
      modelo: "Mercedes-Benz Marcopolo Senior (Micro-ônibus)",
      tipo: "Micro-ônibus",
      ano: "2022",
      capacidade: 28,
      kmAtual: 42350,
      combustivel: "Diesel S10",
      status: "Operacional",
      acessibilidade: true,
      seguroVencimento: "2026-12-31",
      vistoriaVencimento: "2026-07-20",
      observacoes: "Equipado com cinto em todos os assentos e plataforma elevatória PCD."
    },
    {
      placa: "RGN-9132",
      modelo: "Volkswagen 15.190 Ônibus Escolar Rural (ORE 2)",
      tipo: "Ônibus",
      ano: "2021",
      capacidade: 44,
      kmAtual: 68100,
      combustivel: "Diesel S10",
      status: "Operacional",
      acessibilidade: true,
      seguroVencimento: "2026-10-15",
      vistoriaVencimento: "2026-08-05",
      observacoes: "Veículo reforçado com tração apropriada para estradas vicinais de terra."
    },
    {
      placa: "MUH-3391",
      modelo: "Renault Master Executiva Van",
      tipo: "Van",
      ano: "2023",
      capacidade: 16,
      kmAtual: 21400,
      combustivel: "Diesel S10",
      status: "Operacional",
      acessibilidade: false,
      seguroVencimento: "2027-02-28",
      vistoriaVencimento: "2026-09-30",
      observacoes: "Utilizado em rotas rápidas e transporte de apoio a alunos da sede."
    }
  ];

  const veiculoIds = [];
  for (const v of veiculosData) {
    const id = await addVeiculo(v, escolaId);
    veiculoIds.push({ id, ...v });
  }

  // 3. Pontos de Embarque
  const pontosData = [
    {
      nome: "Entrada do Sítio Barra",
      endereco: "Estrada Principal do Sítio Barra, KM 4",
      referencia: "Em frente ao Armazém do Zé",
      horarioIda: "06:20",
      horarioVolta: "12:40",
      tipoParada: "Abrigo Coberto"
    },
    {
      nome: "Povoado Boa Vista",
      endereco: "Praça Central de Boa Vista, s/n",
      referencia: "Ao lado da Capela de Santo Antônio",
      horarioIda: "06:35",
      horarioVolta: "12:25",
      tipoParada: "Praça Pública"
    },
    {
      nome: "Assentamento Nova Esperança",
      endereco: "Vicinal 02, Bifurcação do Açude",
      referencia: "Posto de Saúde Comunitário",
      horarioIda: "06:50",
      horarioVolta: "12:10",
      tipoParada: "Ponto Sinalizado"
    },
    {
      nome: "Trevo do Povoado Cantinho",
      endereco: "Rodovia Municipal KM 12",
      referencia: "Posto de Combustível Cantinho",
      horarioIda: "07:05",
      horarioVolta: "11:55",
      tipoParada: "Abrigo Coberto"
    }
  ];

  const pontoIds = [];
  for (const p of pontosData) {
    const id = await addPontoEmbarque(p, escolaId);
    pontoIds.push({ id, ...p });
  }

  // 4. Rotas
  const rotasData = [
    {
      nome: "Linha 01 — Zona Rural / Sítio Barra & Boa Vista",
      tipo: "Ida e Volta",
      turnos: ["Manhã", "Tarde"],
      extensaoKm: 34,
      tempoEstimadoMin: 45,
      veiculoId: veiculoIds[1]?.id || "",
      veiculoPlaca: veiculoIds[1]?.placa || "",
      motoristaId: motoristaIds[1]?.id || "",
      motoristaNome: motoristaIds[1]?.nome || "",
      monitorId: motoristaIds[2]?.id || "",
      monitorNome: motoristaIds[2]?.nome || "",
      status: "Ativa",
      diasSemana: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
      pontosIds: [pontoIds[0]?.id, pontoIds[1]?.id],
      pontosNomes: [pontoIds[0]?.nome, pontoIds[1]?.nome],
      observacoes: "Rota prioritária rural atendendo alunos do ensino fundamental I e II."
    },
    {
      nome: "Linha 02 — Assentamento Nova Esperança & Cantinho",
      tipo: "Ida e Volta",
      turnos: ["Manhã"],
      extensaoKm: 22,
      tempoEstimadoMin: 30,
      veiculoId: veiculoIds[0]?.id || "",
      veiculoPlaca: veiculoIds[0]?.placa || "",
      motoristaId: motoristaIds[0]?.id || "",
      motoristaNome: motoristaIds[0]?.nome || "",
      status: "Ativa",
      diasSemana: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
      pontosIds: [pontoIds[2]?.id, pontoIds[3]?.id],
      pontosNomes: [pontoIds[2]?.nome, pontoIds[3]?.nome],
      observacoes: "Rota com suporte a alunos cadeirantes no micro-ônibus adaptado."
    }
  ];

  const rotaIds = [];
  for (const r of rotasData) {
    const id = await addRota(r, escolaId);
    rotaIds.push({ id, ...r });
  }

  // 5. Alunos Transportados
  const nomesPadrao = [
    "Lucas Gabriel dos Santos",
    "Ana Clara de Oliveira",
    "Matheus Henrique Ferreira",
    "Beatriz Souza Lima",
    "Enzo Gabriel da Silva",
    "Júlia Maria de Carvalho",
    "Pedro Ryan Pereira",
    "Mariana Alcantara Duarte",
    "Samuel Victor Nogueira",
    "Larissa Costa Moreira"
  ];

  for (let i = 0; i < 10; i++) {
    const alunoNome = alunosDisponiveis[i]?.nome || nomesPadrao[i];
    const alunoTurma = alunosDisponiveis[i]?.turma || `${(i % 5) + 1}º Ano ${(i % 2 === 0 ? 'A' : 'B')}`;
    const rotaIndex = i % 2;
    const pontoIndex = i % 4;

    await addAlunoTransporte({
      alunoId: alunosDisponiveis[i]?.id || `aluno_mock_${i+1}`,
      nomeAluno: alunoNome,
      turma: alunoTurma,
      rotaId: rotaIds[rotaIndex]?.id || "",
      rotaNome: rotaIds[rotaIndex]?.nome || "",
      pontoId: pontoIds[pontoIndex]?.id || "",
      pontoNome: pontoIds[pontoIndex]?.nome || "",
      turno: (i % 3 === 0) ? "Tarde" : "Manhã",
      responsavel: `Responsável de ${alunoNome.split(' ')[0]}`,
      telefoneContato: `(82) 9${Math.floor(10000000 + Math.random() * 90000000)}`,
      necessidadeEspecial: i === 1 ? "Cadeirante (Mobilidade Reduzida)" : "Nenhuma",
      status: "Ativo",
      dataVinculo: "2026-02-05"
    }, escolaId);
  }

  // 6. Manutenções
  const manutencoesData = [
    {
      veiculoId: veiculoIds[0]?.id || "",
      veiculoPlaca: veiculoIds[0]?.placa || "",
      veiculoModelo: veiculoIds[0]?.modelo || "",
      tipo: "Preventiva",
      descricao: "Revisão periódica de 40.000 KM — Troca de óleo do motor, filtro de combustível, filtro de ar e pastilhas de freio.",
      fornecedor: "Auto Mecânica & Peças Mundaú Ltda",
      data: "2026-09-18",
      kmMomento: 41900,
      proximaRevisaoKm: 51900,
      proximaRevisaoData: "2027-03-18",
      custoPecas: 1250.00,
      custoMaoDeObra: 450.00,
      custoTotal: 1700.00,
      status: "Concluída",
      numeroNota: "NF-e 004812"
    },
    {
      veiculoId: veiculoIds[1]?.id || "",
      veiculoPlaca: veiculoIds[1]?.placa || "",
      veiculoModelo: veiculoIds[1]?.modelo || "",
      tipo: "Corretiva",
      descricao: "Substituição de 2 amortecedores dianteiros e alinhamento/balanceamento após danos em estrada rural.",
      fornecedor: "Centro Automotivo São José",
      data: "2026-09-28",
      kmMomento: 67800,
      proximaRevisaoKm: 75000,
      proximaRevisaoData: "2027-01-10",
      custoPecas: 2180.00,
      custoMaoDeObra: 600.00,
      custoTotal: 2780.00,
      status: "Concluída",
      numeroNota: "NF-e 005190"
    },
    {
      veiculoId: veiculoIds[2]?.id || "",
      veiculoPlaca: veiculoIds[2]?.placa || "",
      veiculoModelo: veiculoIds[2]?.modelo || "",
      tipo: "Vistoria / Inspeção",
      descricao: "Inspeção semestral do tacógrafo e laudo de segurança veicular para transporte escolar pelo DETRAN.",
      fornecedor: "Posto de Vistorias Certificadas",
      data: "2026-10-02",
      kmMomento: 21200,
      proximaRevisaoKm: 30000,
      proximaRevisaoData: "2027-04-02",
      custoPecas: 0.00,
      custoMaoDeObra: 380.00,
      custoTotal: 380.00,
      status: "Concluída",
      numeroNota: "Recibo 1198/26"
    }
  ];

  for (const man of manutencoesData) {
    await addManutencao(man, escolaId);
  }

  // 7. Custos e Abastecimentos
  const custosData = [
    {
      tipo: "Abastecimento",
      categoria: "Combustível",
      veiculoId: veiculoIds[1]?.id || "",
      veiculoPlaca: veiculoIds[1]?.placa || "",
      data: "2026-10-02",
      posto: "Posto Aliança de Combustíveis",
      combustivel: "Diesel S10",
      litros: 110.0,
      valorUnitario: 5.99,
      valorTotal: 658.90,
      kmAbastecimento: 67900,
      kmRodadosDesdeUltimo: 410,
      consumoKmL: 3.73,
      motoristaNome: motoristaIds[1]?.nome || "",
      formaPagamento: "Faturamento Prefeitura"
    },
    {
      tipo: "Abastecimento",
      categoria: "Combustível",
      veiculoId: veiculoIds[0]?.id || "",
      veiculoPlaca: veiculoIds[0]?.placa || "",
      data: "2026-10-05",
      posto: "Posto Aliança de Combustíveis",
      combustivel: "Diesel S10",
      litros: 75.0,
      valorUnitario: 5.99,
      valorTotal: 449.25,
      kmAbastecimento: 42200,
      kmRodadosDesdeUltimo: 480,
      consumoKmL: 6.40,
      motoristaNome: motoristaIds[0]?.nome || "",
      formaPagamento: "Faturamento Prefeitura"
    },
    {
      tipo: "Outros Custos",
      categoria: "Seguro Obrigatório & Frota",
      veiculoId: veiculoIds[1]?.id || "",
      veiculoPlaca: veiculoIds[1]?.placa || "",
      data: "2026-10-01",
      descricao: "Parcela mensal do seguro de responsabilidade civil e cobertura de passageiros da frota escolar",
      valorTotal: 890.00,
      formaPagamento: "Boleto Bancário"
    },
    {
      tipo: "Outros Custos",
      categoria: "Higienização & Lavagem",
      veiculoId: veiculoIds[0]?.id || "",
      veiculoPlaca: veiculoIds[0]?.placa || "",
      data: "2026-10-06",
      descricao: "Lavagem completa do chassi e higienização interna dos assentos",
      valorTotal: 120.00,
      formaPagamento: "Dinheiro / Caixa Escolar"
    }
  ];

  for (const c of custosData) {
    await addCustoTransporte(c, escolaId);
  }

  // 8. Diário de Viagens
  const hoje = new Date().toISOString().split("T")[0];
  const viagensData = [
    {
      data: hoje,
      turno: "Manhã",
      rotaId: rotaIds[0]?.id || "",
      rotaNome: rotaIds[0]?.nome || "",
      veiculoId: veiculoIds[1]?.id || "",
      veiculoPlaca: veiculoIds[1]?.placa || "",
      motoristaNome: motoristaIds[1]?.nome || "",
      monitorNome: motoristaIds[2]?.nome || "",
      horarioSaida: "06:15",
      horarioChegada: "07:25",
      kmInicial: 68060,
      kmFinal: 68100,
      kmPercorrido: 40,
      alunosEmbarcados: 6,
      statusViagem: "Concluída",
      ocorrencias: "Viagem realizada sem atrasos. Tempo chuvoso no trecho do Sítio Barra com trânsito lento."
    },
    {
      data: hoje,
      turno: "Manhã",
      rotaId: rotaIds[1]?.id || "",
      rotaNome: rotaIds[1]?.nome || "",
      veiculoId: veiculoIds[0]?.id || "",
      veiculoPlaca: veiculoIds[0]?.placa || "",
      motoristaNome: motoristaIds[0]?.nome || "",
      horarioSaida: "06:40",
      horarioChegada: "07:30",
      kmInicial: 42325,
      kmFinal: 42350,
      kmPercorrido: 25,
      alunosEmbarcados: 4,
      statusViagem: "Concluída",
      ocorrencias: "Tudo normal. Embarque com plataforma de acessibilidade operando perfeitamente."
    }
  ];

  for (const vg of viagensData) {
    await addViagemDiario(vg, escolaId);
  }

  return true;
}
