import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { getNotasAluno } from "./notasService";
import { getFrequenciasAluno } from "./frequenciaService";
import { DISCIPLINAS } from "../utils/constants";

/**
 * Calcula a situação final do aluno com base nas notas e faltas
 */
export function calcularSituacaoDisciplina(b1, b2, b3, b4, rec, totalFaltas = 0, totalAulasPrevistas = 200) {
  const notasPreenchidas = [b1, b2, b3, b4].filter(n => n !== null && n !== undefined && !isNaN(Number(n))).map(Number);
  
  // Se ainda não tem os 4 bimestres ou está em andamento
  const emAndamento = notasPreenchidas.length < 4;
  
  if (notasPreenchidas.length === 0) {
    return {
      media: null,
      mediaFinal: null,
      situacao: "Cursando",
      cor: "azul",
      badge: "🔵 Cursando"
    };
  }

  const soma = notasPreenchidas.reduce((a, b) => a + b, 0);
  const media = +(soma / notasPreenchidas.length).toFixed(1);
  
  // Se faltas ultrapassarem 25% (ou 50 faltas em 200 aulas)
  const percPresenca = totalAulasPrevistas > 0 ? ((totalAulasPrevistas - totalFaltas) / totalAulasPrevistas) * 100 : 100;
  
  if (!emAndamento && percPresenca < 75) {
    return {
      media,
      mediaFinal: media,
      situacao: "Reprovado por Falta",
      cor: "vermelho",
      badge: "🔴 Reprovado"
    };
  }

  if (emAndamento) {
    return {
      media,
      mediaFinal: media,
      situacao: "Cursando",
      cor: "azul",
      badge: "🔵 Cursando"
    };
  }

  // 4 bimestres completos:
  let mediaFinal = media;
  const notaRec = (rec !== null && rec !== undefined && !isNaN(Number(rec))) ? Number(rec) : null;

  if (notaRec !== null) {
    // Se fez recuperação, média final ponderada ou maior nota
    mediaFinal = +( (media + notaRec) / 2 ).toFixed(1);
  }

  if (mediaFinal >= 6.0) {
    return {
      media,
      mediaFinal,
      situacao: "Aprovado",
      cor: "verde",
      badge: "🟢 Aprovado"
    };
  } else if (media >= 4.0 && media < 6.0 && notaRec === null) {
    return {
      media,
      mediaFinal,
      situacao: "Recuperação",
      cor: "amarelo",
      badge: "🟡 Recuperação"
    };
  } else {
    return {
      media,
      mediaFinal,
      situacao: "Reprovado",
      cor: "vermelho",
      badge: "🔴 Reprovado"
    };
  }
}

/**
 * Determina o resultado final geral do aluno a partir de todas as disciplinas
 */
export function calcularResultadoGeral(disciplinasProcessadas, frequenciaGlobalPerc = 100) {
  if (!disciplinasProcessadas || disciplinasProcessadas.length === 0) {
    return { situacao: "Cursando", badge: "🔵 Cursando", cor: "azul" };
  }

  if (frequenciaGlobalPerc < 75) {
    return { situacao: "Reprovado", badge: "🔴 Reprovado por Frequência", cor: "vermelho" };
  }

  const temReprovado = disciplinasProcessadas.some(d => d.situacao === "Reprovado" || d.situacao === "Reprovado por Falta");
  const temRecuperacao = disciplinasProcessadas.some(d => d.situacao === "Recuperação");
  const temCursando = disciplinasProcessadas.some(d => d.situacao === "Cursando");

  if (temReprovado) {
    return { situacao: "Reprovado", badge: "🔴 Reprovado", cor: "vermelho" };
  }
  if (temRecuperacao) {
    return { situacao: "Recuperação", badge: "🟡 Recuperação", cor: "amarelo" };
  }
  if (temCursando) {
    return { situacao: "Cursando", badge: "🔵 Cursando", cor: "azul" };
  }

  return { situacao: "Aprovado", badge: "🟢 Aprovado", cor: "verde" };
}

/**
 * Constrói o boletim completo do aluno
 */
export async function getBoletimCompleto(aluno, escolaId, anoLetivo = "2026") {
  if (!aluno) return null;

  try {
    const notasDocs = await getNotasAluno(aluno.id, escolaId);
    const freqDocs = await getFrequenciasAluno(aluno.id, escolaId);

    // Mapeia faltas por mês/bimestre
    let totalFaltasGeral = 0;
    const faltasPorBimestre = { b1: 0, b2: 0, b3: 0, b4: 0 };

    freqDocs.forEach(f => {
      const dias = f.dias || {};
      const faltasMes = Object.values(dias).filter(v => v === "F" || v === "FJ").length;
      totalFaltasGeral += faltasMes;

      const mes = Number(f.mes); // 0 a 11
      if (mes >= 1 && mes <= 3) faltasPorBimestre.b1 += faltasMes;
      else if (mes >= 4 && mes <= 5) faltasPorBimestre.b2 += faltasMes;
      else if (mes >= 6 && mes <= 8) faltasPorBimestre.b3 += faltasMes;
      else if (mes >= 9 && mes <= 11) faltasPorBimestre.b4 += faltasMes;
    });

    const listaDisciplinas = DISCIPLINAS || [
      "Português", "Matemática", "Ciências", "História", "Geografia", "Artes", "Educação Física", "Inglês", "Ensino Religioso"
    ];

    let somaMedias = 0;
    let totalDisciplinasComNota = 0;

    const disciplinas = listaDisciplinas.map((nomeDisc) => {
      const notaObj = notasDocs.find(n => n.disciplina === nomeDisc && String(n.anoLetivo) === String(anoLetivo));
      const b = notaObj?.bimestres || {};
      
      const b1 = b.b1 !== undefined ? b.b1 : null;
      const b2 = b.b2 !== undefined ? b.b2 : null;
      const b3 = b.b3 !== undefined ? b.b3 : null;
      const b4 = b.b4 !== undefined ? b.b4 : null;
      const rec = b.rec !== undefined ? b.rec : null;

      // Faltas estimadas ou distribuídas proporcionalmente
      const faltasDisc = Math.floor(totalFaltasGeral / listaDisciplinas.length) || 0;
      const resDisc = calcularSituacaoDisciplina(b1, b2, b3, b4, rec, faltasDisc, 50);

      if (resDisc.mediaFinal !== null) {
        somaMedias += resDisc.mediaFinal;
        totalDisciplinasComNota++;
      }

      return {
        disciplina: nomeDisc,
        b1,
        b2,
        b3,
        b4,
        rec,
        faltas: faltasDisc,
        media: resDisc.media,
        mediaFinal: resDisc.mediaFinal,
        situacao: resDisc.situacao,
        badge: resDisc.badge,
        cor: resDisc.cor
      };
    });

    const totalAulasAnuais = 800; // 200 dias * 4h
    const frequenciaPerc = Math.max(0, Math.min(100, Math.round(((totalAulasAnuais - (totalFaltasGeral * 4)) / totalAulasAnuais) * 100)));
    const mediaGeral = totalDisciplinasComNota > 0 ? +(somaMedias / totalDisciplinasComNota).toFixed(1) : null;
    const resultadoFinal = calcularResultadoGeral(disciplinas, frequenciaPerc);

    return {
      alunoId: aluno.id,
      alunoNome: aluno.nome,
      alunoMatricula: aluno.matricula || "202600" + (aluno.id ? aluno.id.slice(0, 4) : "01"),
      nascimento: aluno.nascimento || "",
      turma: aluno.turma || "Não enturmado",
      anoLetivo: String(anoLetivo),
      turno: aluno.turno || "Matutino",
      totalFaltas: totalFaltasGeral,
      frequenciaPerc,
      mediaGeral,
      disciplinas,
      resultadoFinal: resultadoFinal.situacao,
      resultadoBadge: resultadoFinal.badge,
      resultadoCor: resultadoFinal.cor,
      faltasPorBimestre
    };
  } catch (err) {
    console.error("Erro ao gerar boletim completo do aluno:", err);
    return null;
  }
}
