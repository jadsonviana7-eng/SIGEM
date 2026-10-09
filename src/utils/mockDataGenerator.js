import { collection, addDoc, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const nomesAlunos = [
  "João Pedro", "Maria Eduarda", "Ana Clara", "Pedro Henrique", "Lucas Gabriel",
  "Julia Beatriz", "Mateus Felipe", "Sofia Helena", "Enzo Gabriel", "Valentina",
  "Miguel Arthur", "Alice Maria", "Arthur Silva", "Laura Beatriz", "Bernardo",
  "Manuela", "Guilherme", "Isabella", "Rafael", "Luiza",
  "Gabriel Henrique", "Heloisa", "Samuel", "Lívia", "Caio",
  "Lorena", "Heitor", "Giovanna", "Felipe", "Sarah"
];

const sobrenomes = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes"];

const nomesProfessores = [
  "Prof. Roberto Carlos", "Profa. Angela Maria", "Prof. Carlos Eduardo", "Profa. Marcia Fernanda",
  "Prof. Fernando Pessoa", "Profa. Cecília Meireles", "Prof. Machado de Assis", "Profa. Clarice Lispector"
];

const disciplinasList = ["Português", "Matemática", "História", "Geografia", "Ciências", "Educação Física", "Artes"];

const gerarNomeAleatorio = () => {
  const nome = nomesAlunos[Math.floor(Math.random() * nomesAlunos.length)];
  const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
  return `${nome} ${sobrenome}`;
};

const gerarCpf = () => {
  return `${Math.floor(Math.random() * 900) + 100}.${Math.floor(Math.random() * 900) + 100}.${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}`;
};

const gerarDataNosUltimosMeses = (offsetMeses = 0) => {
  const hoje = new Date();
  const d = new Date(hoje.getFullYear(), hoje.getMonth() - offsetMeses, Math.floor(Math.random() * 25) + 1);
  return d.toISOString().split('T')[0];
};

export async function injectMockData(escolaId) {
  if (!escolaId) throw new Error("ID da escola é obrigatório");

  try {
    console.log("Iniciando injeção de dados falsos...");

    // 1. Criar Turmas
    const turmas = ["1º Ano A", "2º Ano A", "3º Ano A", "4º Ano A", "5º Ano A"];
    for (const t of turmas) {
      await addDoc(collection(db, "turmas"), {
        nome: t,
        turno: "Manhã",
        ano: new Date().getFullYear().toString(),
        status: "Ativa",
        escolaId,
        criadoEm: serverTimestamp()
      });
    }

    // 2. Criar Professores e Servidores de Apoio
    const titulacoes = ["Graduação", "Especialização", "Mestrado", "Pós-Graduação"];
    for (const p of nomesProfessores) {
      const disciplinas = [disciplinasList[Math.floor(Math.random() * disciplinasList.length)], disciplinasList[Math.floor(Math.random() * disciplinasList.length)]];
      await addDoc(collection(db, "professores"), {
        nome: p,
        cargo: "Professor",
        cpf: gerarCpf(),
        matricula: `MAT-${Math.floor(Math.random() * 90000) + 10000}`,
        email: `${p.replace(/[^a-zA-Z]/g, '').toLowerCase()}@escola.com`,
        telefone: "(82) 99999-9999",
        turno: "Manhã",
        cargaHoraria: Math.random() > 0.4 ? "40h" : "20h",
        titulacao: titulacoes[Math.floor(Math.random() * titulacoes.length)],
        disciplinas: [...new Set(disciplinas)],
        status: "Ativo",
        vinculo: Math.random() > 0.5 ? "Efetivo" : "Contratado",
        dependentesIrrf: Math.floor(Math.random() * 3),
        escolaId,
        criadoEm: serverTimestamp()
      });
    }

    // 2.1 Criar Servidores Administrativos e de Apoio
    const demaisServidoresMock = [
      { nome: "Mariana Costa e Silva", cargo: "Secretário", cargaHoraria: "40h", vinculo: "Efetivo" },
      { nome: "Carlos Alberto Menezes", cargo: "Coordenador", cargaHoraria: "40h", vinculo: "Efetivo" },
      { nome: "Severina dos Santos Lima", cargo: "Merendeira", cargaHoraria: "40h", vinculo: "Contratado" },
      { nome: "José Cláudio dos Anjos", cargo: "Vigia", cargaHoraria: "40h", vinculo: "Efetivo" },
      { nome: "Rosa Maria de Oliveira", cargo: "Serviços Gerais", cargaHoraria: "40h", vinculo: "Contratado" }
    ];

    for (const s of demaisServidoresMock) {
      await addDoc(collection(db, "professores"), {
        nome: s.nome,
        cargo: s.cargo,
        cpf: gerarCpf(),
        matricula: `MAT-${Math.floor(Math.random() * 90000) + 10000}`,
        email: `${s.nome.replace(/[^a-zA-Z]/g, '').toLowerCase()}@escola.com`,
        telefone: "(82) 99999-9999",
        turno: "Manhã",
        cargaHoraria: s.cargaHoraria,
        titulacao: "Ensino Médio",
        disciplinas: [],
        status: "Ativo",
        vinculo: s.vinculo,
        dependentesIrrf: Math.floor(Math.random() * 2),
        escolaId,
        criadoEm: serverTimestamp()
      });
    }

    // 3. Criar Alunos
    const alunosIdsComTurmas = [];
    for (let i = 0; i < 25; i++) {
      const turma = turmas[Math.floor(Math.random() * turmas.length)];
      const docRef = await addDoc(collection(db, "alunos"), {
        nome: gerarNomeAleatorio(),
        matricula: `2026${Math.floor(Math.random() * 9000) + 1000}`,
        turma,
        ano: turma.split(" ")[0] + " " + turma.split(" ")[1],
        turno: "Manhã",
        nascimento: "2016-05-15",
        sexo: Math.random() > 0.5 ? "Masculino" : "Feminino",
        corRaca: "Parda",
        nacionalidade: "Brasileira",
        ufNascimento: "AL",
        municipioNascimento: "Maceió",
        cpf: gerarCpf(),
        mae: `Mãe de ${gerarNomeAleatorio().split(" ")[0]}`,
        telefone: "(82) 98888-8888",
        status: "Ativo",
        escolaId,
        criadoEm: serverTimestamp()
      });
      alunosIdsComTurmas.push({ id: docRef.id, turma });
    }

    // 3.1. Gerar notas e frequências fictícias para os alunos criados
    const disciplinasMock = ["Português", "Matemática", "Ciências", "História", "Geografia"];
    const mesesMock = [2, 3, 4]; // Março, Abril, Maio

    for (const aluno of alunosIdsComTurmas) {
      // Notas
      for (const disc of disciplinasMock) {
        const bimestres = {
          b1: Number((Math.random() * 4 + 6).toFixed(1)),
          b2: Number((Math.random() * 4 + 6).toFixed(1)),
          b3: Number((Math.random() * 4 + 5.5).toFixed(1)),
          b4: Number((Math.random() * 3.5 + 6.5).toFixed(1))
        };
        const vals = Object.values(bimestres);
        const media = +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
        const notaDocId = `${aluno.id}_${aluno.turma}_${disc}_2026`.replace(/\s/g, "_");
        await setDoc(doc(db, "notas", notaDocId), {
          alunoId: aluno.id,
          turma: aluno.turma,
          disciplina: disc,
          anoLetivo: 2026,
          bimestres,
          media,
          escolaId,
          atualizadoEm: serverTimestamp()
        });
      }

      // Frequências
      for (const mes of mesesMock) {
        const diasNoMes = new Date(2026, mes + 1, 0).getDate();
        const diasMap = {};
        for (let dia = 1; dia <= diasNoMes; dia++) {
          const date = new Date(2026, mes, dia);
          const dayOfWeek = date.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            diasMap[dia] = Math.random() > 0.07 ? "P" : "F";
          }
        }
        const freqDocId = `${aluno.id}_2026_${mes}`;
        await setDoc(doc(db, "frequencias", freqDocId), {
          alunoId: aluno.id,
          turma: aluno.turma,
          ano: 2026,
          mes,
          dias: diasMap,
          escolaId,
          atualizadoEm: serverTimestamp()
        });
      }
    }

    // 4. Criar Caixas / Contas Financeiras
    const caixas = [
      { nome: "Caixa Escolar", banco: "Banco do Brasil", agencia: "1234-5", conta: "12345-6", saldoInicial: 2500 },
      { nome: "Conta PDDE", banco: "Caixa Econômica", agencia: "4321-0", conta: "98765-4", saldoInicial: 8000 }
    ];
    const caixasCriados = [];
    for (const c of caixas) {
      const docRef = await addDoc(collection(db, "fin_caixas"), {
        ...c,
        escolaId,
        criadoEm: serverTimestamp()
      });
      caixasCriados.push(docRef.id);
    }

    // 5. Criar Categorias Financeiras
    const categoriasReceita = ["Repasse FNDE / PNAE", "Verba PDDE", "Contribuição APM", "Doação Comunidade"];
    const categoriasDespesa = ["Merenda Escolar", "Material Didático e Papelaria", "Manutenção e Reparos", "Produtos de Limpeza", "Eventos e Festividades"];

    const catReceitasCriadas = [];
    for (const catNome of categoriasReceita) {
      const docRef = await addDoc(collection(db, "fin_categorias"), {
        nome: catNome,
        tipo: "Receita",
        escolaId,
        criadoEm: serverTimestamp()
      });
      catReceitasCriadas.push(docRef.id);
    }

    const catDespesasCriadas = [];
    for (const catNome of categoriasDespesa) {
      const docRef = await addDoc(collection(db, "fin_categorias"), {
        nome: catNome,
        tipo: "Despesa",
        escolaId,
        criadoEm: serverTimestamp()
      });
      catDespesasCriadas.push(docRef.id);
    }

    // 6. Criar Transações Financeiras (últimos 3 meses)
    const receitasModelos = [
      { desc: "Parcela PNAE Merenda Escolar", valorMin: 2500, valorMax: 4500 },
      { desc: "Repasse Anual PDDE Educação Básica", valorMin: 5000, valorMax: 10000 },
      { desc: "Contribuição Voluntária da APM", valorMin: 200, valorMax: 600 },
      { desc: "Rendimento de Aplicação Financeira", valorMin: 50, valorMax: 180 },
      { desc: "Arrecadação da Festa da Família", valorMin: 800, valorMax: 1500 }
    ];

    const despesasModelos = [
      { desc: "Compra de Hortifrúti e Leite para Merenda", valorMin: 450, valorMax: 1200 },
      { desc: "Aquisição de Papel A4 e Cartuchos de Tinta", valorMin: 280, valorMax: 650 },
      { desc: "Manutenção dos Ar-Condicionados das Salas", valorMin: 350, valorMax: 900 },
      { desc: "Produtos de Higiene, Álcool e Limpeza", valorMin: 200, valorMax: 550 },
      { desc: "Recarga de Extintores de Incêndio", valorMin: 180, valorMax: 400 },
      { desc: "Troca de Lâmpadas LED e Receptáculos", valorMin: 120, valorMax: 300 },
      { desc: "Material Pedagógico e Jogos Educativos", valorMin: 300, valorMax: 850 }
    ];

    for (let offset = 0; offset <= 2; offset++) {
      for (let r = 0; r < 3; r++) {
        const modelo = receitasModelos[Math.floor(Math.random() * receitasModelos.length)];
        const valor = Number((Math.random() * (modelo.valorMax - modelo.valorMin) + modelo.valorMin).toFixed(2));
        const catId = catReceitasCriadas[Math.floor(Math.random() * catReceitasCriadas.length)];
        const caixaId = caixasCriados[Math.floor(Math.random() * caixasCriados.length)];

        await addDoc(collection(db, "fin_transacoes"), {
          descricao: modelo.desc,
          valor: valor,
          data: gerarDataNosUltimosMeses(offset),
          tipo: "Receita",
          categoriaId: catId,
          caixaId: caixaId,
          escolaId,
          criadoEm: serverTimestamp()
        });
      }

      for (let d = 0; d < 6; d++) {
        const modelo = despesasModelos[Math.floor(Math.random() * despesasModelos.length)];
        const valor = Number((Math.random() * (modelo.valorMax - modelo.valorMin) + modelo.valorMin).toFixed(2));
        const catId = catDespesasCriadas[Math.floor(Math.random() * catDespesasCriadas.length)];
        const caixaId = caixasCriados[Math.floor(Math.random() * caixasCriados.length)];

        await addDoc(collection(db, "fin_transacoes"), {
          descricao: modelo.desc,
          valor: valor,
          data: gerarDataNosUltimosMeses(offset),
          tipo: "Despesa",
          categoriaId: catId,
          caixaId: caixaId,
          escolaId,
          criadoEm: serverTimestamp()
        });
      }
    }

    console.log("Injeção finalizada com sucesso!");
    return true;
  } catch (err) {
    console.error("Erro na injeção de dados:", err);
    throw err;
  }
}
