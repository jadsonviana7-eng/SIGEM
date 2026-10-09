import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import { addAluno, getAlunos } from "./alunosService";

const COL = "solicitacoes_matricula";
const ANO_LETIVO_ATUAL = new Date().getFullYear();

// Gerador de protocolo único de solicitação
export function gerarNumeroProtocolo() {
  const aleatorio = Math.floor(10000 + Math.random() * 90000);
  return `SOL-${ANO_LETIVO_ATUAL}-${aleatorio}`;
}

// 1. Obter todas as solicitações de matrícula (por escola ou geral da rede)
export async function getSolicitacoesMatricula(escolaId) {
  try {
    let q;
    if (escolaId) {
      q = query(collection(db, COL), where("escolaId", "==", escolaId));
    } else {
      q = collection(db, COL);
    }
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return list.sort((a, b) => (b.criadoEm || "").localeCompare(a.criadoEm || ""));
  } catch (error) {
    console.error("Erro ao obter solicitações de matrícula:", error);
    return [];
  }
}

// 2. Consultar solicitação por protocolo ou CPF
export async function getSolicitacaoPorProtocolo(protocolo, cpf = "") {
  try {
    const q = query(collection(db, COL), where("protocolo", "==", protocolo.trim().toUpperCase()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docData = snap.docs[0];
      return { id: docData.id, ...docData.data() };
    }

    if (cpf) {
      const qCpf = query(collection(db, COL), where("responsavelCpf", "==", cpf.replace(/\D/g, "")));
      const snapCpf = await getDocs(qCpf);
      if (!snapCpf.empty) {
        return snapCpf.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar protocolo:", error);
    return null;
  }
}

// 3. Criar nova solicitação de matrícula (Pelo Responsável)
export async function addSolicitacaoMatricula(dados) {
  const protocolo = gerarNumeroProtocolo();
  const novaSolicitacao = {
    ...dados,
    protocolo,
    status: "Pendente", // "Pendente", "Em Análise", "Aprovada", "Indeferida", "Aguardando Correção"
    criadoEm: new Date().toISOString(),
    anoLetivo: ANO_LETIVO_ATUAL,
    historicoAnalise: [
      {
        dataHora: new Date().toISOString(),
        status: "Pendente",
        mensagem: "Solicitação de matrícula enviada pelo responsável com sucesso. Aguardando análise da secretaria escolar."
      }
    ]
  };

  const ref = await addDoc(collection(db, COL), novaSolicitacao);
  return { id: ref.id, protocolo, ...novaSolicitacao };
}

// 4. Atualizar dados de uma solicitação
export async function updateSolicitacaoMatricula(id, dados) {
  await updateDoc(doc(db, COL, id), {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });
}

// 5. Aprovar solicitação e efetivar como Aluno Oficial no SIGEM
export async function aprovarMatriculaOnline(solicitacaoId, dadosAprovacao, escolaId, usuario) {
  const snap = await getDoc(doc(db, COL, solicitacaoId));
  if (!snap.exists()) {
    throw new Error("Solicitação de matrícula não encontrada.");
  }
  const solicitacao = snap.data();

  // Gerar número oficial de matrícula do SIGEM
  const alunosEscola = await getAlunos(escolaId);
  const proximoNum = (alunosEscola.length || 0) + 1;
  const matriculaOficial = `${ANO_LETIVO_ATUAL}${String(proximoNum).padStart(4, "0")}`;

  // Criar o registro oficial do Aluno na coleção 'alunos'
  const novoAluno = {
    nome: solicitacao.alunoNome,
    cpf: solicitacao.alunoCpf || "",
    dataNasc: solicitacao.alunoDataNasc || "",
    sexo: solicitacao.alunoSexo || "Outro",
    corRaca: solicitacao.alunoCorRaca || "Não declarada",
    necessidadeEspecial: solicitacao.alunoPcd || false,
    tipoNecessidade: solicitacao.alunoTipoPcd || "",
    certidaoNascimento: solicitacao.alunoCertidao || "",
    
    // Filiação e Responsável
    responsavel: solicitacao.responsavelNome,
    responsavelCpf: solicitacao.responsavelCpf || "",
    responsavelParentesco: solicitacao.responsavelParentesco || "Mãe",
    telefone: solicitacao.responsavelTelefone || "",
    email: solicitacao.responsavelEmail || "",
    
    // Endereço
    endereco: solicitacao.enderecoRua || "",
    numero: solicitacao.enderecoNumero || "",
    bairro: solicitacao.enderecoBairro || "",
    cidade: solicitacao.enderecoCidade || "São José da Tapera",
    uf: solicitacao.enderecoUf || "AL",
    cep: solicitacao.enderecoCep || "",

    // Dados Escolares Oficiais
    matricula: matriculaOficial,
    turma: dadosAprovacao.turmaNome,
    turno: dadosAprovacao.turno || solicitacao.serieTurno || "Matutino",
    ano: dadosAprovacao.anoEscolar || solicitacao.serieAno || "1º Ano",
    status: "Ativo",
    situacaoMatricula: "Matrícula Nova (Online)",
    dataMatricula: new Date().toISOString().split("T")[0],
    observacoes: `Matrícula realizada online via Protocolo ${solicitacao.protocolo}. Aprovada por ${usuario?.nome || "Secretaria"}.`,
    
    documentosAnexados: solicitacao.documentos || []
  };

  const alunoRef = await addAluno(novoAluno, escolaId);

  // Atualizar a solicitação como "Aprovada"
  const historicoAtual = solicitacao.historicoAnalise || [];
  const novoHistorico = [
    ...historicoAtual,
    {
      dataHora: new Date().toISOString(),
      status: "Aprovada",
      responsavelAnalise: usuario?.nome || "Secretaria Escolar",
      mensagem: `Matrícula Aprovada e Efetivada na turma ${dadosAprovacao.turmaNome}. Matrícula nº ${matriculaOficial}.`
    }
  ];

  await updateDoc(doc(db, COL, solicitacaoId), {
    status: "Aprovada",
    alunoIdCriado: alunoRef.id,
    matriculaOficial,
    turmaAprovada: dadosAprovacao.turmaNome,
    aprovadoEm: new Date().toISOString(),
    aprovadoPor: usuario?.nome || "Secretaria Escolar",
    historicoAnalise: novoHistorico
  });

  return {
    alunoId: alunoRef.id,
    matriculaOficial,
    turma: dadosAprovacao.turmaNome
  };
}

// 6. Indeferir solicitação
export async function indeferirMatriculaOnline(solicitacaoId, motivo, usuario) {
  const snap = await getDoc(doc(db, COL, solicitacaoId));
  if (!snap.exists()) throw new Error("Solicitação não encontrada.");
  const solicitacao = snap.data();

  const historicoAtual = solicitacao.historicoAnalise || [];
  const novoHistorico = [
    ...historicoAtual,
    {
      dataHora: new Date().toISOString(),
      status: "Indeferida",
      responsavelAnalise: usuario?.nome || "Secretaria Escolar",
      mensagem: `Solicitação Indeferida. Motivo: ${motivo}`
    }
  ];

  await updateDoc(doc(db, COL, solicitacaoId), {
    status: "Indeferida",
    motivoIndeferimento: motivo,
    analisadoEm: new Date().toISOString(),
    analisadoPor: usuario?.nome || "Secretaria Escolar",
    historicoAnalise: novoHistorico
  });
}

// 7. Solicitar Correção de Documentos
export async function solicitarCorrecaoMatriculaOnline(solicitacaoId, orientacao, usuario) {
  const snap = await getDoc(doc(db, COL, solicitacaoId));
  if (!snap.exists()) throw new Error("Solicitação não encontrada.");
  const solicitacao = snap.data();

  const historicoAtual = solicitacao.historicoAnalise || [];
  const novoHistorico = [
    ...historicoAtual,
    {
      dataHora: new Date().toISOString(),
      status: "Aguardando Correção",
      responsavelAnalise: usuario?.nome || "Secretaria Escolar",
      mensagem: `Pendente de complementação/correção: ${orientacao}`
    }
  ];

  await updateDoc(doc(db, COL, solicitacaoId), {
    status: "Aguardando Correção",
    pendenciaDocumental: orientacao,
    analisadoEm: new Date().toISOString(),
    analisadoPor: usuario?.nome || "Secretaria Escolar",
    historicoAnalise: novoHistorico
  });
}

// 8. Injetar Solicitações de Demonstração
export async function injectSolicitacoesMockData(escolaId, escolaNome = "Escola Municipal de Ensino Fundamental") {
  if (!escolaId) return;

  const mockSolicitacoes = [
    {
      alunoNome: "Lucas Gabriel Albuquerque Silva",
      alunoCpf: "123.456.789-01",
      alunoDataNasc: "2018-05-14",
      alunoSexo: "Masculino",
      alunoCorRaca: "Parda",
      alunoPcd: false,
      alunoTipoPcd: "",
      alunoCertidao: "Termo 45892, Livro A-12, Folha 88 - Cartório Registro Civil",
      
      responsavelNome: "Mariana Albuquerque Silva",
      responsavelParentesco: "Mãe",
      responsavelCpf: "987.654.321-99",
      responsavelTelefone: "(82) 99876-5432",
      responsavelEmail: "mariana.albuquerque@email.com",
      responsavelProfissao: "Autônoma",
      
      enderecoRua: "Rua do Comércio",
      enderecoNumero: "142",
      enderecoBairro: "Centro",
      enderecoCidade: "São José da Tapera",
      enderecoUf: "AL",
      enderecoCep: "57445-000",
      
      escolaId,
      escolaNome,
      serieAno: "1º Ano",
      serieTurno: "Matutino",
      escolaOrigem: "Creche Municipal Criança Feliz",
      
      documentos: [
        { tipo: "Certidão de Nascimento", nomeArquivo: "certidao_lucas.pdf", status: "Anexado" },
        { tipo: "Comprovante de Residência", nomeArquivo: "conta_luz_residencia.pdf", status: "Anexado" },
        { tipo: "Cartão de Vacinação", nomeArquivo: "cartao_vacina.jpg", status: "Anexado" },
        { tipo: "Documento do Responsável", nomeArquivo: "rg_mae.pdf", status: "Anexado" }
      ],
      
      status: "Pendente",
      protocolo: `SOL-${ANO_LETIVO_ATUAL}-74812`,
      criadoEm: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      anoLetivo: ANO_LETIVO_ATUAL,
      historicoAnalise: [
        {
          dataHora: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: "Pendente",
          mensagem: "Solicitação de matrícula enviada pelo responsável. Aguardando conferência de vagas e documentos."
        }
      ]
    },
    {
      alunoNome: "Beatriz Helena Costa Santos",
      alunoCpf: "321.654.987-12",
      alunoDataNasc: "2016-09-22",
      alunoSexo: "Feminino",
      alunoCorRaca: "Branca",
      alunoPcd: true,
      alunoTipoPcd: "Transtorno do Espectro Autista (TEA - CID F84.0)",
      alunoCertidao: "Termo 12044, Livro B-04, Folha 12",
      
      responsavelNome: "Carlos Eduardo Santos",
      responsavelParentesco: "Pai",
      responsavelCpf: "456.789.123-00",
      responsavelTelefone: "(82) 99123-4567",
      responsavelEmail: "carlos.santos@email.com",
      responsavelProfissao: "Agricultor",
      
      enderecoRua: "Sítio Poço da Pedra",
      enderecoNumero: "S/N",
      enderecoBairro: "Zona Rural",
      enderecoCidade: "São José da Tapera",
      enderecoUf: "AL",
      enderecoCep: "57445-000",
      
      escolaId,
      escolaNome,
      serieAno: "3º Ano",
      serieTurno: "Vespertino",
      escolaOrigem: "Escola Estadual Manoel Pereira",
      
      documentos: [
        { tipo: "Certidão de Nascimento", nomeArquivo: "certidao_beatriz.pdf", status: "Anexado" },
        { tipo: "Laudo Médico / AEE", nomeArquivo: "laudo_neurologico_tea.pdf", status: "Anexado" },
        { tipo: "Comprovante de Residência", nomeArquivo: "declaracao_residencia.pdf", status: "Anexado" },
        { tipo: "Histórico Escolar Anterior", nomeArquivo: "historico_2ano.pdf", status: "Anexado" }
      ],
      
      status: "Pendente",
      protocolo: `SOL-${ANO_LETIVO_ATUAL}-91024`,
      criadoEm: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      anoLetivo: ANO_LETIVO_ATUAL,
      historicoAnalise: [
        {
          dataHora: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          status: "Pendente",
          mensagem: "Solicitação recebida com laudo médico anexo para encaminhamento ao AEE."
        }
      ]
    },
    {
      alunoNome: "Enzo Gabriel de Oliveira Melo",
      alunoCpf: "998.776.554-33",
      alunoDataNasc: "2014-03-10",
      alunoSexo: "Masculino",
      alunoCorRaca: "Parda",
      alunoPcd: false,
      alunoTipoPcd: "",
      alunoCertidao: "Termo 77312, Livro A-99, Folha 210",
      
      responsavelNome: "Patrícia de Oliveira Melo",
      responsavelParentesco: "Mãe",
      responsavelCpf: "112.233.445-66",
      responsavelTelefone: "(82) 98844-3322",
      responsavelEmail: "patricia.melo@email.com",
      responsavelProfissao: "Comerciante",
      
      enderecoRua: "Avenida Principal",
      enderecoNumero: "502",
      enderecoBairro: "Bela Vista",
      enderecoCidade: "São José da Tapera",
      enderecoUf: "AL",
      enderecoCep: "57445-000",
      
      escolaId,
      escolaNome,
      serieAno: "5º Ano",
      serieTurno: "Matutino",
      escolaOrigem: "Colégio Sagrada Família",
      
      documentos: [
        { tipo: "Certidão de Nascimento", nomeArquivo: "certidao_enzo.pdf", status: "Anexado" },
        { tipo: "Comprovante de Residência", nomeArquivo: "comprovante_endereco.pdf", status: "Anexado" }
      ],
      
      status: "Aguardando Correção",
      pendenciaDocumental: "Favor anexar o Histórico Escolar ou Declaração de Transferência da escola anterior.",
      protocolo: `SOL-${ANO_LETIVO_ATUAL}-55219`,
      criadoEm: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      anoLetivo: ANO_LETIVO_ATUAL,
      historicoAnalise: [
        {
          dataHora: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: "Pendente",
          mensagem: "Solicitação enviada."
        },
        {
          dataHora: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          status: "Aguardando Correção",
          responsavelAnalise: "Secretaria Escolar",
          mensagem: "Pendente de complementação: Favor anexar o Histórico Escolar ou Declaração de Transferência."
        }
      ]
    }
  ];

  for (const sol of mockSolicitacoes) {
    await addDoc(collection(db, COL), sol);
  }
}
