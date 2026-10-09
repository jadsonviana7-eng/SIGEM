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
  orderBy
} from "firebase/firestore";
import { db } from "../firebase";

// ==========================================
// 1. ITENS DO ESTOQUE / ALIMENTOS
// ==========================================
const COL_ESTOQUE = "alim_estoque";

export async function getItensEstoque(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_ESTOQUE), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
}

export async function addItemEstoque(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_ESTOQUE), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updateItemEstoque(id, dados) {
  await updateDoc(doc(db, COL_ESTOQUE, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteItemEstoque(id) {
  await deleteDoc(doc(db, COL_ESTOQUE, id));
}

// ==========================================
// 2. ENTRADAS DE ALIMENTOS (Compras / Doações)
// ==========================================
const COL_ENTRADAS = "alim_entradas";

export async function getEntradas(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_ENTRADAS), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
}

export async function addEntrada(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_ENTRADAS), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });

  // Atualiza a quantidade do item correspondente no estoque
  if (dados.itemId && Number(dados.quantidade) > 0) {
    const itemRef = doc(db, COL_ESTOQUE, dados.itemId);
    const itemSnap = await getDoc(itemRef);
    if (itemSnap.exists()) {
      const atual = Number(itemSnap.data().quantidadeAtual) || 0;
      await updateDoc(itemRef, {
        quantidadeAtual: atual + Number(dados.quantidade),
        dataValidade: dados.dataValidade || itemSnap.data().dataValidade || "",
        lote: dados.lote || itemSnap.data().lote || "",
        ultimoPreco: Number(dados.valorUnitario) || itemSnap.data().ultimoPreco || 0,
        atualizadoEm: new Date().toISOString()
      });
    }
  }

  return ref.id;
}

export async function deleteEntrada(id, dados) {
  // Reverte estoque se necessário
  if (dados && dados.itemId && Number(dados.quantidade) > 0) {
    const itemRef = doc(db, COL_ESTOQUE, dados.itemId);
    const itemSnap = await getDoc(itemRef);
    if (itemSnap.exists()) {
      const atual = Number(itemSnap.data().quantidadeAtual) || 0;
      await updateDoc(itemRef, {
        quantidadeAtual: Math.max(0, atual - Number(dados.quantidade)),
        atualizadoEm: new Date().toISOString()
      });
    }
  }
  await deleteDoc(doc(db, COL_ENTRADAS, id));
}

// ==========================================
// 3. SAÍDAS DE ALIMENTOS (Cozinha / Refeições)
// ==========================================
const COL_SAIDAS = "alim_saidas";

export async function getSaidas(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_SAIDAS), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
}

export async function addSaida(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_SAIDAS), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });

  // Baixa a quantidade do item no estoque
  if (dados.itemId && Number(dados.quantidade) > 0) {
    const itemRef = doc(db, COL_ESTOQUE, dados.itemId);
    const itemSnap = await getDoc(itemRef);
    if (itemSnap.exists()) {
      const atual = Number(itemSnap.data().quantidadeAtual) || 0;
      await updateDoc(itemRef, {
        quantidadeAtual: Math.max(0, atual - Number(dados.quantidade)),
        atualizadoEm: new Date().toISOString()
      });
    }
  }

  return ref.id;
}

export async function deleteSaida(id, dados) {
  // Estorna saída para o estoque
  if (dados && dados.itemId && Number(dados.quantidade) > 0) {
    const itemRef = doc(db, COL_ESTOQUE, dados.itemId);
    const itemSnap = await getDoc(itemRef);
    if (itemSnap.exists()) {
      const atual = Number(itemSnap.data().quantidadeAtual) || 0;
      await updateDoc(itemRef, {
        quantidadeAtual: atual + Number(dados.quantidade),
        atualizadoEm: new Date().toISOString()
      });
    }
  }
  await deleteDoc(doc(db, COL_SAIDAS, id));
}

// ==========================================
// 4. CARDÁPIOS ESCOLARES
// ==========================================
const COL_CARDAPIOS = "alim_cardapios";

export async function getCardapios(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_CARDAPIOS), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.titulo || "").localeCompare(b.titulo || ""));
}

export async function addCardapio(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_CARDAPIOS), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updateCardapio(id, dados) {
  await updateDoc(doc(db, COL_CARDAPIOS, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteCardapio(id) {
  await deleteDoc(doc(db, COL_CARDAPIOS, id));
}

// ==========================================
// 5. REGISTRO DIÁRIO DA MERENDA SERVIDA
// ==========================================
const COL_MERENDA_SERVIDA = "alim_merenda_servida";

export async function getMerendaServida(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_MERENDA_SERVIDA), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
}

export async function addMerendaServida(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_MERENDA_SERVIDA), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updateMerendaServida(id, dados) {
  await updateDoc(doc(db, COL_MERENDA_SERVIDA, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteMerendaServida(id) {
  await deleteDoc(doc(db, COL_MERENDA_SERVIDA, id));
}

// ==========================================
// 6. FORNECEDORES DE ALIMENTAÇÃO (PNAE / Convencional)
// ==========================================
const COL_FORNECEDORES = "alim_fornecedores";

export async function getFornecedores(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_FORNECEDORES), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.razaoSocial || a.nome || "").localeCompare(b.razaoSocial || b.nome || ""));
}

export async function addFornecedor(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_FORNECEDORES), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

export async function updateFornecedor(id, dados) {
  await updateDoc(doc(db, COL_FORNECEDORES, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

export async function deleteFornecedor(id) {
  await deleteDoc(doc(db, COL_FORNECEDORES, id));
}

// ==========================================
// 7. BALANÇOS / AUDITORIAS DE ESTOQUE
// ==========================================
const COL_AUDITORIA_ESTOQUE = "alim_auditorias";

export async function getAuditoriasEstoque(escolaId) {
  if (!escolaId) return [];
  const q = query(collection(db, COL_AUDITORIA_ESTOQUE), where("escolaId", "==", escolaId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
}

export async function addAuditoriaEstoque(dados, escolaId) {
  const ref = await addDoc(collection(db, COL_AUDITORIA_ESTOQUE), {
    ...dados,
    escolaId,
    criadoEm: new Date().toISOString()
  });
  return ref.id;
}

// ==========================================
// INJEÇÃO DE DADOS MOCK / DEMONSTRAÇÃO ALIMENTAÇÃO
// ==========================================
export async function injectAlimentacaoMockData(escolaId) {
  if (!escolaId) return;

  // 1. Fornecedores
  const fornecedoresData = [
    {
      nome: "Cooperativa Agropecuária Regional de Produtores Familiares (COOPAF)",
      tipo: "Agricultura Familiar (PNAE 30%)",
      cnpj: "14.281.902/0001-45",
      responsavel: "Manoel Messias da Silva",
      telefone: "(82) 99871-3322",
      email: "contato@coopafamiliar.com.br",
      produtosFornecidos: "Hortaliças frescas, frutas da época, tubérculos e polpa de frutas",
      status: "Ativo",
      contratoNumero: "Contrato PNAE 04/2026"
    },
    {
      nome: "Distribuidora Aliança de Gêneros Alimentícios Ltda",
      tipo: "Comércio Atacadista Convencional",
      cnpj: "08.419.633/0001-19",
      responsavel: "Patrícia Albuquerque",
      telefone: "(82) 3321-9988",
      email: "vendas@aliancaalimentos.com.br",
      produtosFornecidos: "Arroz, feijão, macarrão, óleo, leite em pó, biscoitos e carnes",
      status: "Ativo",
      contratoNumero: "Pregão Eletrônico 12/2026"
    },
    {
      nome: "Laticínios Vale Verde Ltda",
      tipo: "Indústria de Laticínios",
      cnpj: "19.340.551/0001-88",
      responsavel: "Rodrigo Mendonça",
      telefone: "(82) 98124-7711",
      email: "pedidos@valeverdelaticinios.com.br",
      produtosFornecidos: "Leite pasteurizado, queijo minas, iogurte natural e manteiga",
      status: "Ativo",
      contratoNumero: "Contrato 08/2026"
    }
  ];

  const fornsCriados = [];
  for (const f of fornecedoresData) {
    const id = await addFornecedor(f, escolaId);
    fornsCriados.push({ id, ...f });
  }

  // 2. Itens no Estoque / Despensa
  const itensData = [
    {
      nome: "Arroz Polido Tipo 1 (Pacote 5kg)",
      categoria: "Não Perecíveis",
      unidade: "Pacotes (5kg)",
      quantidadeAtual: 28,
      estoqueMinimo: 10,
      localArmazenamento: "Despensa Seca - Prateleira A1",
      dataValidade: "2027-02-15",
      lote: "LT-2026/089",
      ultimoPreco: 24.50,
      perecivel: false
    },
    {
      nome: "Feijão Carioca Tipo 1 (Pacote 1kg)",
      categoria: "Não Perecíveis",
      unidade: "Quilos (kg)",
      quantidadeAtual: 45,
      estoqueMinimo: 15,
      localArmazenamento: "Despensa Seca - Prateleira A2",
      dataValidade: "2026-12-10",
      lote: "LT-2026/102",
      ultimoPreco: 7.80,
      perecivel: false
    },
    {
      nome: "Peito de Frango Congelado (Pacote 1kg)",
      categoria: "Carnes & Frios",
      unidade: "Quilos (kg)",
      quantidadeAtual: 35,
      estoqueMinimo: 12,
      localArmazenamento: "Freezer 01 - Carnes",
      dataValidade: "2026-11-25",
      lote: "LT-FR-441",
      ultimoPreco: 16.90,
      perecivel: true
    },
    {
      nome: "Banana Prata Fresca (Agricultura Familiar)",
      categoria: "Hortifrúti & Frutas",
      unidade: "Dúzias",
      quantidadeAtual: 20,
      estoqueMinimo: 8,
      localArmazenamento: "Bancada Ventilada - Frutaria",
      dataValidade: "2026-10-18",
      lote: "COLHEITA-OUT",
      ultimoPreco: 6.50,
      perecivel: true
    },
    {
      nome: "Leite Integral Pasteurizado (Saco 1L)",
      categoria: "Laticínios",
      unidade: "Litros (L)",
      quantidadeAtual: 50,
      estoqueMinimo: 20,
      localArmazenamento: "Geladeira 02 - Laticínios",
      dataValidade: "2026-10-24",
      lote: "LT-LEITE-990",
      ultimoPreco: 4.80,
      perecivel: true
    },
    {
      nome: "Macarrão Espaguete com Ovos (Pacote 500g)",
      categoria: "Não Perecíveis",
      unidade: "Pacotes (500g)",
      quantidadeAtual: 30,
      estoqueMinimo: 10,
      localArmazenamento: "Despensa Seca - Prateleira B1",
      dataValidade: "2027-05-20",
      lote: "MAC-2026/03",
      ultimoPreco: 3.90,
      perecivel: false
    },
    {
      nome: "Polpa de Fruta Congelada (Goiaba / Manga 1kg)",
      categoria: "Hortifrúti & Frutas",
      unidade: "Quilos (kg)",
      quantidadeAtual: 18,
      estoqueMinimo: 6,
      localArmazenamento: "Freezer 02 - Polpas",
      dataValidade: "2027-01-30",
      lote: "POLPA-OUT26",
      ultimoPreco: 11.50,
      perecivel: true
    }
  ];

  const itensCriados = [];
  for (const item of itensData) {
    const id = await addItemEstoque(item, escolaId);
    itensCriados.push({ id, ...item });
  }

  // 3. Entradas de Estoque
  const entradasData = [
    {
      data: "2026-10-02",
      itemId: itensCriados[0]?.id || "",
      itemNome: itensCriados[0]?.nome || "Arroz",
      unidade: itensCriados[0]?.unidade || "Pacotes",
      quantidade: 30,
      valorUnitario: 24.50,
      valorTotal: 735.00,
      fornecedorNome: fornsCriados[1]?.nome || "Distribuidora Aliança",
      numeroNotaFiscal: "NF-e 048910",
      dataValidade: "2027-02-15",
      lote: "LT-2026/089",
      responsavelRecebimento: "Merendeira Chefe Maria do Socorro",
      observacoes: "Alimentos entregues em perfeito estado e com laudo de conferência."
    },
    {
      data: "2026-10-05",
      itemId: itensCriados[3]?.id || "",
      itemNome: itensCriados[3]?.nome || "Banana Prata",
      unidade: itensCriados[3]?.unidade || "Dúzias",
      quantidade: 25,
      valorUnitario: 6.50,
      valorTotal: 162.50,
      fornecedorNome: fornsCriados[0]?.nome || "Cooperativa Familiar COOPAF",
      numeroNotaFiscal: "Recibo PNAE 118",
      dataValidade: "2026-10-18",
      lote: "COLHEITA-OUT",
      responsavelRecebimento: "Nutricionista Escolar Ana Paula",
      observacoes: "Frutas frescas da colheita do dia dos cooperados locais."
    }
  ];

  for (const ent of entradasData) {
    await addDoc(collection(db, COL_ENTRADAS), {
      ...ent,
      escolaId,
      criadoEm: new Date().toISOString()
    });
  }

  // 4. Saídas de Estoque
  const saidasData = [
    {
      data: "2026-10-06",
      itemId: itensCriados[0]?.id || "",
      itemNome: itensCriados[0]?.nome || "Arroz",
      unidade: itensCriados[0]?.unidade || "Pacotes",
      quantidade: 2,
      destino: "Preparo Almoço Escolar (Fundamental I e II)",
      responsavelRetirada: "Merendeira Josefa Maria",
      motivo: "Consumo Regular - Cardápio Semanal",
      refeicoesEstimadas: 180
    },
    {
      data: "2026-10-06",
      itemId: itensCriados[3]?.id || "",
      itemNome: itensCriados[3]?.nome || "Banana Prata",
      unidade: itensCriados[3]?.unidade || "Dúzias",
      quantidade: 5,
      destino: "Lanche da Manhã e da Tarde",
      responsavelRetirada: "Merendeira Josefa Maria",
      motivo: "Sobremesa / Fruta da Época",
      refeicoesEstimadas: 180
    }
  ];

  for (const s of saidasData) {
    await addDoc(collection(db, COL_SAIDAS), {
      ...s,
      escolaId,
      criadoEm: new Date().toISOString()
    });
  }

  // 5. Cardápios Escolares
  const cardapiosData = [
    {
      titulo: "Cardápio Padrão Ensino Fundamental (Outubro / 2026)",
      periodo: "Mensal - 01/10/2026 a 31/10/2026",
      faixaEtaria: "6 a 14 anos (Ensino Fundamental I e II)",
      nutricionistaResponsavel: "Dra. Ana Paula Cavalcante (CRN-6 12845)",
      diasSemana: {
        segunda: {
          lancheManha: "Leite com cacau 100% e biscoito integral",
          almoco: "Arroz enriquecido, feijão carioca, peito de frango em cubos ao molho suave e salada de alface com cenoura ralada",
          sobremesa: "Banana Prata",
          lancheTarde: "Suco natural de goiaba e bolo caseiro de cenoura"
        },
        terca: {
          lancheManha: "Iogurte natural batido com frutas e aveia",
          almoco: "Macarronada nutritiva com carne moída magra, legumes picados e feijão",
          sobremesa: "Melancia em fatias",
          lancheTarde: "Vitamina de banana com leite e torrada integral"
        },
        quarta: {
          lancheManha: "Mingau de aveia com canela e maçã picada",
          almoco: "Arroz com cenoura, feijão verde, ensopado de carne com batata e abóbora",
          sobremesa: "Laranja fatiada",
          lancheTarde: "Suco de manga e biscoito de polvilho artesanal"
        },
        quinta: {
          lancheManha: "Leite integral com pão francês e queijo branco",
          almoco: "Arroz, feijão tropeiro leve, filé de frango grelhado e vinagrete sem excesso de acidez",
          sobremesa: "Mamão fatiado",
          lancheTarde: "Salada de frutas da estação com hortelã"
        },
        sexta: {
          lancheManha: "Cuscuz de milho tradicional com leite e manteiga",
          almoco: "Risoto de legumes com frango desfiado, feijão carioca e salada de beterraba cozida",
          sobremesa: "Abacaxi doce",
          lancheTarde: "Suco de maracujá e biscoito caseiro de aveia"
        }
      },
      restricoesAlimentares: "Opção sem lactose (leite vegetal) para 2 alunos e sem glúten (arroz e tubérculos) para 1 aluna com doença celíaca.",
      status: "Ativo"
    }
  ];

  for (const c of cardapiosData) {
    await addCardapio(c, escolaId);
  }

  // 6. Registro de Merenda Servida
  const hoje = new Date().toISOString().split("T")[0];
  const merendaData = [
    {
      data: hoje,
      turno: "Manhã",
      cardapioRef: "Arroz, feijão, frango em cubos com legumes e banana",
      refeicoesPrevistas: 190,
      refeicoesServidas: 182,
      alunosAtendidos: 182,
      aceitabilidade: "Excelente (96% de aprovação pelos alunos)",
      sobrasLimpasKg: 1.2,
      restoIngestaKg: 0.8,
      merendeiras: "Josefa Maria e Maria do Socorro",
      observacoes: "Refeição servida no horário pontual das 09:30. Excelente adesão dos estudantes."
    },
    {
      data: hoje,
      turno: "Tarde",
      cardapioRef: "Suco de frutas e bolo de cenoura nutritivo com cobertura leve",
      refeicoesPrevistas: 175,
      refeicoesServidas: 168,
      alunosAtendidos: 168,
      aceitabilidade: "Ótima (94%)",
      sobrasLimpasKg: 0.5,
      restoIngestaKg: 0.3,
      merendeiras: "Josefa Maria e Francisca Lima",
      observacoes: "Distribuição organizada por turmas do 1º ao 5º ano."
    }
  ];

  for (const m of merendaData) {
    await addMerendaServida(m, escolaId);
  }

  return true;
}
