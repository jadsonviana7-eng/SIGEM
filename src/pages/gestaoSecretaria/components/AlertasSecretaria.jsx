import React, { useState } from "react";
import { Modal, Btn, Badge } from "../../../components/ui";

export default function AlertasSecretaria({
  alunos = [],
  turmas = [],
  professores = [],
  escolas = [],
  onNavigate
}) {
  const [modalAlertaAtivo, setModalAlertaAtivo] = useState(null);
  const [notificando, setNotificando] = useState(false);
  const [notificadoSucesso, setNotificadoSucesso] = useState(false);

  // 1. Alunos abaixo da frequência mínima (< 75%)
  const alunosBaixaFreq = alunos.filter((a) => {
    if (a.presencaPct !== undefined && a.presencaPct !== null) {
      return Number(a.presencaPct) < 75;
    }
    if (a.frequencia !== undefined && a.frequencia !== null) {
      return Number(a.frequencia) < 75;
    }
    return false;
  });
  const countBaixaFreq = alunosBaixaFreq.length;

  // 2. Turmas que não fecharam notas do bimestre
  const turmasPendentesNotas = turmas.filter((t) => {
    return t.fechadoNotas !== true && t.fechado !== true && t.statusFechamento !== "Fechado";
  });
  const countTurmasPendentes = turmasPendentesNotas.length;

  // 3. Escolas com cadernetas / diários pendentes (baseado nas turmas da escola)
  const idsEscolasComPendencias = new Set(turmasPendentesNotas.map((t) => t.escolaId).filter(Boolean));
  const escolasCadernetasPendentes = escolas.filter((e) => idsEscolasComPendencias.has(e.id));
  const countEscolasPendentes = escolasCadernetasPendentes.length;

  // 4. Alunos sem documentação básica completa (CPF ou Certidão / Registro Civil)
  const alunosSemDocs = alunos.filter((a) => {
    return !a.cpf || (!a.registroCivil && !a.certidaoNascimento);
  });
  const countAlunosSemDocs = alunosSemDocs.length;

  // 5. Professores com turmas pendentes de fechamento
  const nomesProfsPendentes = new Set(turmasPendentesNotas.map((t) => t.professor).filter(Boolean));
  const professoresDiarioAtraso = professores.filter((p) => nomesProfsPendentes.has(p.nome) || p.diarioAtraso === true);
  const countProfDiarioAtraso = professoresDiarioAtraso.length;

  const listaAlertas = [
    {
      id: "frequencia",
      tipo: "danger",
      icone: "ti ti-user-exclamation",
      titulo: `${countBaixaFreq} alunos abaixo da frequência mínima`,
      subtitulo: countBaixaFreq > 0 
        ? "Frequência escolar inferior a 75% — risco de evasão (LDB / Conselho Tutelar)"
        : "Nenhum aluno em infrequência crítica registrada na rede escolar (< 75%)",
      count: countBaixaFreq,
      corDestaque: "#ef4444",
      bgDestaque: "rgba(239, 68, 68, 0.08)",
      borda: "rgba(239, 68, 68, 0.25)",
      acaoTexto: "Ver Alunos & Notificar",
      detalhes: {
        titulo: "Alunos com Infrequência Crítica (< 75%)",
        descricao: "Estudantes em situação de risco de abandono ou perda de benefício social por falta reiterada.",
        itens: (alunosBaixaFreq.length > 0 ? alunosBaixaFreq.slice(0, 15) : []).map((item, idx) => ({
          nome: item.nome || `Aluno em Risco ${idx + 1}`,
          turma: item.turma || item.ano || "Turma Municipal",
          escola: item.escolaNome || (escolas.find(e => e.id === item.escolaId)?.nome) || "Escola Municipal",
          detalhe: item.faltas ? `${item.faltas} faltas acumuladas (${item.presencaPct || item.frequencia}%)` : `Taxa de presença: ${item.presencaPct || item.frequencia || 0}%`
        }))
      }
    },
    {
      id: "fechamento_notas",
      tipo: "warning",
      icone: "ti ti-clipboard-x",
      titulo: `${countTurmasPendentes} turmas com notas pendentes`,
      subtitulo: "Prazo de fechamento: até o término do 1º Bimestre (Conforme Calendário SEMED)",
      count: countTurmasPendentes,
      corDestaque: "#f59e0b",
      bgDestaque: "rgba(245, 158, 11, 0.08)",
      borda: "rgba(245, 158, 11, 0.25)",
      acaoTexto: "Cobrar Fechamento",
      detalhes: {
        titulo: "Turmas com Fechamento de Bimestre Pendente",
        descricao: "Turmas com notas ou diários eletrônicos em fase de lançamento docente / homologação pela coordenação.",
        itens: (turmasPendentesNotas.length > 0 ? turmasPendentesNotas.slice(0, 15) : []).map((item, idx) => {
          const escNome = (escolas.find(e => e.id === item.escolaId)?.nome) || "Escola Municipal";
          return {
            nome: item.nome || `Turma ${idx + 1}`,
            turma: item.serie || item.ano || item.turno || "Fundamental",
            escola: escNome,
            detalhe: `Professor(a): ${item.professor || "Regente"} · Prazo: Fim do Bimestre Letivo`
          };
        })
      }
    },
    {
      id: "cadernetas_escolas",
      tipo: "purple",
      icone: "ti ti-notebook",
      titulo: `${countEscolasPendentes} escolas com cadernetas pendentes`,
      subtitulo: "Unidades escolares com registros ou diários aguardando homologação final",
      count: countEscolasPendentes,
      corDestaque: "#a855f7",
      bgDestaque: "rgba(168, 85, 247, 0.08)",
      borda: "rgba(168, 85, 247, 0.25)",
      acaoTexto: "Ver Escolas",
      detalhes: {
        titulo: "Escolas com Cadernetas / Diários em Aberto",
        descricao: "Unidades escolares que possuem turmas ou diários de classe pendentes de fechamento.",
        itens: (escolasCadernetasPendentes.length > 0 ? escolasCadernetasPendentes : escolas).map((e, idx) => {
          const turmasDaEscola = turmasPendentesNotas.filter(t => t.escolaId === e.id);
          return {
            nome: e.nome || `Escola Municipal ${idx + 1}`,
            turma: `${turmasDaEscola.length} turmas pendentes`,
            escola: `${e.municipio || "Maceió"} - ${e.zona || "Urbana"}`,
            detalhe: turmasDaEscola.length > 0 ? `${turmasDaEscola.length} turmas em aberto no bimestre` : "Cadernetas regulares"
          };
        })
      }
    },
    {
      id: "documentacao",
      tipo: "amber",
      icone: "ti ti-file-alert",
      titulo: `${countAlunosSemDocs} alunos sem documentação completa`,
      subtitulo: "Matrículas com pendência de CPF ou Certidão de Nascimento / Registro Civil",
      count: countAlunosSemDocs,
      corDestaque: "#f59e0b",
      bgDestaque: "rgba(245, 158, 11, 0.08)",
      borda: "rgba(245, 158, 11, 0.25)",
      acaoTexto: "Regularizar Pastas",
      detalhes: {
        titulo: "Pendências na Pasta do Aluno (Documentação)",
        descricao: "Matrículas que necessitam de complementação documental junto aos responsáveis.",
        itens: (alunosSemDocs.length > 0 ? alunosSemDocs.slice(0, 15) : []).map((item, idx) => {
          const escNome = (escolas.find(e => e.id === item.escolaId)?.nome) || "Escola Municipal";
          const faltas = [];
          if (!item.cpf) faltas.push("CPF");
          if (!item.registroCivil && !item.certidaoNascimento) faltas.push("Certidão / Registro Civil");
          return {
            nome: item.nome || `Aluno ${idx + 1}`,
            turma: item.turma || item.ano || "Turma Regular",
            escola: escNome,
            detalhe: `Pendente: ${faltas.join(", ") || "Documentação Básica"}`
          };
        })
      }
    },
    {
      id: "diarios_docentes",
      tipo: "blue",
      icone: "ti ti-user-exclamation",
      titulo: `${countProfDiarioAtraso} professores com diários pendentes`,
      subtitulo: "Docentes com turmas em aberto aguardando fechamento e lançamento de conteúdos",
      count: countProfDiarioAtraso,
      corDestaque: "#38bdf8",
      bgDestaque: "rgba(56, 189, 248, 0.08)",
      borda: "rgba(56, 189, 248, 0.25)",
      acaoTexto: "Notificar Docentes",
      detalhes: {
        titulo: "Professores com Diários / Fechamento Pendente",
        descricao: "Docentes vinculados a turmas que ainda não concluíram o fechamento do bimestre.",
        itens: (professoresDiarioAtraso.length > 0 ? professoresDiarioAtraso.slice(0, 15) : []).map((p, idx) => {
          const escNome = (escolas.find(e => e.id === p.escolaId)?.nome) || "Escola Municipal";
          return {
            nome: p.nome || `Professor(a) ${idx + 1}`,
            turma: p.disciplina || "Docente Regente",
            escola: escNome,
            detalhe: "Aguardando envio das notas e diário do bimestre"
          };
        })
      }
    }
  ];

  const handleDispararNotificacaoMassa = () => {
    setNotificando(true);
    setTimeout(() => {
      setNotificando(false);
      setNotificadoSucesso(true);
      setTimeout(() => setNotificadoSucesso(false), 4000);
    }, 1200);
  };

  return (
    <div
      style={{
        background: "#1e293b",
        borderRadius: "16px",
        border: "1px solid #2c3b52",
        padding: "20px 24px",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.18)",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}
    >
      {/* Header da Área de Alertas */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          borderBottom: "1px solid #2c3b52",
          paddingBottom: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px"
            }}
          >
            <i className="ti ti-alert-triangle" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#f8fafc", margin: 0 }}>
                🚨 Centro de Alertas & Pendências da Secretaria
              </h3>
              <span
                style={{
                  background: "#dc2626",
                  color: "white",
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "2px 8px",
                  borderRadius: "10px"
                }}
              >
                {listaAlertas.length} Atenções
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "#94a3b8", margin: "2px 0 0 0" }}>
              Monitoramento automático e proativo de não-conformidades, frequência e registros pedagógicos na rede.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={handleDispararNotificacaoMassa}
            disabled={notificando}
            style={{
              background: "#18202d",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              padding: "7px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s"
            }}
          >
            <i className="ti ti-bell-ringing" />
            {notificando ? "Disparando Avisos..." : "Cobrar Pendências Geral"}
          </button>
        </div>
      </div>

      {notificadoSucesso && (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#10b981",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <i className="ti ti-check" style={{ fontSize: "16px" }} />
          Notificações automáticas disparadas com sucesso para os diretores e coordenações escolares!
        </div>
      )}

      {/* Grid de Cards de Alertas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "12px"
        }}
      >
        {listaAlertas.map((alerta) => (
          <div
            key={alerta.id}
            onClick={() => setModalAlertaAtivo(alerta)}
            style={{
              background: alerta.bgDestaque,
              border: `1px solid ${alerta.borda}`,
              borderRadius: "12px",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              cursor: "pointer",
              transition: "transform 0.15s ease, box-shadow 0.15s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className={alerta.icone} style={{ color: alerta.corDestaque, fontSize: "18px" }} />
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc", lineHeight: "1.3" }}>
                    {alerta.titulo}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 10px 0", lineHeight: "1.4" }}>
                {alerta.subtitulo}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px dashed ${alerta.borda}`, paddingTop: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "600", color: alerta.corDestaque }}>
                Clique para ver detalhes
              </span>
              <span style={{ fontSize: "12px", color: alerta.corDestaque, fontWeight: "700" }}>
                →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Interativo de Detalhes do Alerta */}
      {modalAlertaAtivo && (
        <Modal
          isOpen={Boolean(modalAlertaAtivo)}
          onClose={() => setModalAlertaAtivo(null)}
          title={`🚨 Detalhamento: ${modalAlertaAtivo.titulo}`}
          maxWidth="680px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "#cbd5e1" }}>
              {modalAlertaAtivo.detalhes?.descricao}
            </p>

            <div
              style={{
                border: "1px solid #33435c",
                borderRadius: "10px",
                overflow: "hidden",
                maxHeight: "320px",
                overflowY: "auto"
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#243144", borderBottom: "1px solid #33435c", color: "#cbd5e1" }}>
                    <th style={{ padding: "10px 14px", fontWeight: "600" }}>Nome / Entidade</th>
                    <th style={{ padding: "10px 14px", fontWeight: "600" }}>Turma / Unidade</th>
                    <th style={{ padding: "10px 14px", fontWeight: "600" }}>Situação / Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {modalAlertaAtivo.detalhes?.itens.map((item, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #2c3b52" }}>
                      <td style={{ padding: "10px 14px", fontWeight: "600", color: "#f8fafc" }}>
                        {item.nome}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#94a3b8" }}>
                        {item.turma} — <span style={{ fontSize: "11px" }}>{item.escola}</span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <Badge variant="warning">{item.detalhe}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid #33435c" }}>
              <Btn
                variant="primary"
                onClick={() => {
                  alert(`Aviso oficial enviado para os responsáveis de ${modalAlertaAtivo.titulo}!`);
                  setModalAlertaAtivo(null);
                }}
                style={{ background: modalAlertaAtivo.corDestaque, borderColor: modalAlertaAtivo.corDestaque }}
              >
                <i className="ti ti-send" style={{ marginRight: "6px" }} />
                Disparar Alerta para Direção Escolar
              </Btn>

              <Btn variant="secondary" onClick={() => setModalAlertaAtivo(null)}>
                Fechar
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
