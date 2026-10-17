import React, { useState, useMemo } from "react";
import {
  Btn,
  Badge,
  Select,
  Alert
} from "../../../components/ui";
import { addMensagem } from "../../../services/comunicacaoService";
import styles from "./NotificacoesAutomaticas.module.css";

export default function NotificacoesAutomaticas({
  turmas = [],
  alunos = [],
  escolaId,
  selectedEscola,
  onRefresh
}) {
  const [abaAtiva, setAbaAtiva] = useState("BOLETIM"); // BOLETIM | FREQUENCIA
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [bimestre, setBimestre] = useState("1º Bimestre");
  const [limiarFalta, setLimiarFalta] = useState(5); // Dias de falta para alertar
  const [enviando, setEnviando] = useState(false);
  const [alertaSucesso, setAlertaSucesso] = useState(null);

  // Alunos da turma selecionada
  const alunosFiltrados = useMemo(() => {
    return turmaSelecionada
      ? alunos.filter((a) => a.turmaId === turmaSelecionada || a.turma === turmaSelecionada)
      : alunos.slice(0, 15);
  }, [alunos, turmaSelecionada]);

  // Simulação de faltas e infrequência calculadas
  const alunosComFrequencia = useMemo(() => {
    return alunosFiltrados.map((a, idx) => {
      const faltasNoMes = (idx * 3 + 2) % 11;
      const taxaPresenca = Math.max(65, 100 - faltasNoMes * 3.5).toFixed(1);
      const riscoInfrequencia = faltasNoMes >= limiarFalta;
      return {
        ...a,
        faltasNoMes,
        taxaPresenca,
        riscoInfrequencia,
        responsavelNome: a.responsavelNome || a.responsavel || "Responsável do Aluno",
        responsavelTelefone: a.responsavelTelefone || a.telefone || "(87) 98845-1234"
      };
    });
  }, [alunosFiltrados, limiarFalta]);

  const totalEmRisco = useMemo(() => {
    return alunosComFrequencia.filter(a => a.riscoInfrequencia).length;
  }, [alunosComFrequencia]);

  // KPIs
  const kpis = useMemo(() => {
    return {
      totalAlunosMapeados: alunos.length || 120,
      alunosEmRisco: totalEmRisco,
      turmasAtendidas: turmas.length || 8,
      taxaMediaPresenca: "89.4%"
    };
  }, [alunos, totalEmRisco, turmas]);

  const handleDispararBoletimTurma = async () => {
    if (!turmaSelecionada && turmas.length > 0) {
      alert("Selecione uma turma para disparar as notificações de boletim.");
      return;
    }
    const nomeTurma = turmas.find((t) => t.id === turmaSelecionada || t.nome === turmaSelecionada)?.nome || "Turma Selecionada";
    
    if (!window.confirm(`Confirma o envio do aviso de Boletim Disponível (${bimestre}) para todos os responsáveis da turma ${nomeTurma}?`)) {
      return;
    }

    setEnviando(true);
    try {
      const registro = {
        tipo: "Boletim Disponível",
        destinatarioTipo: "Turma Completa",
        turmaNome: nomeTurma,
        bimestre: bimestre,
        totalDestinatarios: alunosFiltrados.length,
        conteudo: `Aviso oficial: O Boletim Escolar do ${bimestre} referente ao estudante já está homologado e disponível para consulta no Portal do Aluno/Responsável.`,
        canal: "WhatsApp & Mural Digital",
        autor: "Secretaria Escolar",
        status: "Enviada"
      };

      await addMensagem(registro, escolaId);
      setAlertaSucesso(`Notificação de Boletim do ${bimestre} disparada com sucesso para ${alunosFiltrados.length} responsáveis!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert("Erro ao disparar notificações: " + err.message);
    } finally {
      setEnviando(false);
    }
  };

  const handleDispararAlertaFalta = async (aluno) => {
    const nomeEscola = selectedEscola?.nome || "Escola Municipal";
    const texto = `🚨 *ALERTA DE FREQUÊNCIA ESCOLAR*\n\n` +
      `Prezado(a) *${aluno.responsavelNome}*,\n` +
      `Informamos que o estudante *${aluno.nome}* acumulou *${aluno.faltasNoMes} faltas recentes* na turma ${aluno.turma || "da escola"}, atingindo taxa de frequência de *${aluno.taxaPresenca}%*.\n\n` +
      `🏫 *${nomeEscola}*\n` +
      `Solicitamos o comparecimento à secretaria escolar ou justificativa das ausências para evitar prejuízos pedagógicos e comunicação aos órgãos de proteção da criança e do adolescente (LDB / ECA).\n\n` +
      `📞 Dúvidas? Entre em contato conosco.`;

    const foneLimpo = (aluno.responsavelTelefone || "").replace(/\D/g, "");
    const waUrl = foneLimpo
      ? `https://api.whatsapp.com/send?phone=55${foneLimpo}&text=${encodeURIComponent(texto)}`
      : null;

    if (waUrl) {
      window.open(waUrl, "_blank");
    } else {
      navigator.clipboard.writeText(texto);
      alert("Texto do alerta de falta copiado! (Número do telefone não formatado)");
    }

    try {
      await addMensagem({
        tipo: "Alerta de Frequência",
        destinatarioTipo: "Individual",
        alunoNome: aluno.nome,
        alunoId: aluno.id || "",
        responsavelNome: aluno.responsavelNome,
        responsavelTelefone: aluno.responsavelTelefone,
        conteudo: `Alerta de ${aluno.faltasNoMes} faltas (${aluno.taxaPresenca}% presença) enviado para o responsável.`,
        canal: "WhatsApp Direto",
        autor: "Coordenação de Frequência",
        status: "Enviada"
      }, escolaId);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const imprimirNotificacaoOficialFaltas = (aluno) => {
    const printWin = window.open("", "_blank", "width=850,height=900");
    const nomeEscola = selectedEscola?.nome || "ESCOLA MUNICIPAL DE ENSINO FUNDAMENTAL";
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Notificação de Infrequência Escolar - ${aluno.nome}</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; padding: 40px; color: #000; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 25px; }
          .title { font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 15px 0; text-align: center; }
          .box { border: 1px solid #000; padding: 15px; margin: 20px 0; font-family: Arial, sans-serif; font-size: 13px; }
          .signature { margin-top: 60px; display: flex; justify-content: space-around; text-align: center; }
          .sign-line { border-top: 1px solid #000; width: 260px; padding-top: 5px; font-size: 13px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <strong>ESTADO DE PERNAMBUCO</strong><br/>
          <strong>SECRETARIA MUNICIPAL DE EDUCAÇÃO</strong><br/>
          <span>${nomeEscola}</span>
        </div>

        <div class="title">NOTIFICAÇÃO OFICIAL DE INFREQUÊNCIA ESCOLAR</div>

        <p>Ao(À) Sr.(a) <strong>${aluno.responsavelNome}</strong>,</p>
        <p>Responsável legal pelo(a) estudante <strong>${aluno.nome}</strong>, matriculado(a) no <strong>${aluno.turma || "Ensino Fundamental"}</strong>.</p>

        <p>
          Cumprimentando-o(a) cordialmente, a Direção desta Unidade Escolar vem, por meio deste instrumento oficial e em conformidade com o <strong>Art. 12, VIII da Lei nº 9.394/1996 (LDB)</strong> e o <strong>Art. 56 do Estatuto da Criança e do Adolescente (ECA)</strong>, NOTIFICAR V. Sa. quanto ao excesso de ausências injustificadas do(a) referido(a) estudante.
        </p>

        <div class="box">
          <strong>DADOS DO REGISTRO ESCOLAR:</strong><br/>
          • Estudante: <strong>${aluno.nome}</strong><br/>
          • Faltas Registradas no Período: <strong>${aluno.faltasNoMes} dias letivos</strong><br/>
          • Percentual Atual de Frequência: <strong>${aluno.taxaPresenca}%</strong> (Mínimo legal exigido: 75%)
        </div>

        <p>
          Solicitamos o vosso comparecimento a esta Unidade de Ensino no prazo improrrogável de <strong>48 (quarenta e oito) horas</strong> a contar do recebimento desta, a fim de regularizar a situação acadêmica e apresentar as devidas justificativas legais.
        </p>

        <p>
          Ressaltamos que a omissão no comparecimento ou a persistência das faltas ensejará o imediato encaminhamento do caso ao <strong>Conselho Tutelar</strong> e aos órgãos competentes da Vara da Infância e da Juventude para as providências cabíveis.
        </p>

        <p style="text-align: right; margin-top: 30px;">
          Data de emissão: ${new Date().toLocaleDateString("pt-BR")}.
        </p>

        <div class="signature">
          <div class="sign-line">
            Direção / Coordenação Escolar
          </div>
          <div class="sign-line">
            Ciente do Responsável (Data: ____/____/____)
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className={styles.container}>
      {/* 1. INDICADORES RÁPIDOS (KPIS) */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
            <i className="ti ti-bell-ringing" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.turmasAtendidas} Turmas</span>
            <span className={styles.statLabel}>Monitoramento Ativo</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171" }}>
            <i className="ti ti-alert-triangle" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.alunosEmRisco} Alunos</span>
            <span className={styles.statLabel}>Risco de Infrequência</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
            <i className="ti ti-percentage" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.taxaMediaPresenca}</span>
            <span className={styles.statLabel}>Presença Média Geral</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(2, 132, 199, 0.15)", color: "#38bdf8" }}>
            <i className="ti ti-brand-whatsapp" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>Online</span>
            <span className={styles.statLabel}>Canal de Notificação</span>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE CABEÇALHO */}
      <div className={styles.headerBar}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <i className="ti ti-bolt" style={{ color: "#818cf8" }} />
            Notificações Automáticas & Alertas Preventivos
          </div>
          <p className={styles.headerSubtitle}>
            Dispare avisos em massa para as famílias sobre a liberação de boletins bimestrais e monitore casos de faltas e infrequência.
          </p>
        </div>
      </div>

      {alertaSucesso && (
        <Alert tipo="success">
          {alertaSucesso}
        </Alert>
      )}

      {/* TABS DE SELEÇÃO */}
      <div className={styles.tabsBar}>
        <button
          type="button"
          onClick={() => setAbaAtiva("BOLETIM")}
          className={`${styles.tabBtn} ${abaAtiva === "BOLETIM" ? styles.tabBtnActive : ""}`}
        >
          <i className="ti ti-file-certificate" />
          Disparo de Boletim Escolar
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("FREQUENCIA")}
          className={`${styles.tabBtn} ${abaAtiva === "FREQUENCIA" ? styles.tabBtnActive : ""}`}
        >
          <i className="ti ti-user-exclamation" />
          Alertas de Frequência & Faltas ({totalEmRisco})
        </button>
      </div>

      {/* ABA 1: BOLETIM */}
      {abaAtiva === "BOLETIM" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              Disparo em Massa: Boletim Escolar Online
            </h3>
            <p className={styles.sectionSubtitle}>
              Selecione o bimestre e a turma para enviar a notificação formatada para os responsáveis via WhatsApp e Mural.
            </p>

            <div className={styles.dispatchGrid}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", display: "block", marginBottom: 6 }}>
                  Bimestre Letivo *
                </label>
                <Select
                  value={bimestre}
                  onChange={(e) => setBimestre(e.target.value)}
                >
                  <option value="1º Bimestre">1º Bimestre Letivo</option>
                  <option value="2º Bimestre">2º Bimestre Letivo</option>
                  <option value="3º Bimestre">3º Bimestre Letivo</option>
                  <option value="4º Bimestre">4º Bimestre Letivo</option>
                  <option value="Resultado Final">Resultado Final Anual</option>
                </Select>
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary, #cbd5e1)", display: "block", marginBottom: 6 }}>
                  Turma Destino *
                </label>
                <Select
                  value={turmaSelecionada}
                  onChange={(e) => setTurmaSelecionada(e.target.value)}
                >
                  <option value="">-- Todas as Turmas / Selecione --</option>
                  {turmas.map((t) => (
                    <option key={t.id || t.nome} value={t.id || t.nome}>{t.nome}</option>
                  ))}
                </Select>
              </div>

              <div>
                <button
                  type="button"
                  className={styles.btnDispatch}
                  onClick={handleDispararBoletimTurma}
                  disabled={enviando}
                >
                  <i className="ti ti-send" />
                  {enviando ? "Disparando Avisos..." : `Disparar para a Turma (${alunosFiltrados.length} Alunos)`}
                </button>
              </div>
            </div>
          </div>

          {/* Prévia */}
          <div className={styles.previewGrid}>
            <div className={styles.sectionCard}>
              <h4 style={{ fontSize: 14.5, fontWeight: 700, color: "#f8fafc", margin: "0 0 14px 0" }}>
                📱 Prévia da Notificação Enviada aos Responsáveis
              </h4>
              <div className={styles.whatsappBubble}>
                <div className={styles.whatsappHeader}>
                  📊 {selectedEscola?.nome ? selectedEscola.nome.toUpperCase() : "ESCOLA MUNICIPAL"} — BOLETIM DISPONÍVEL
                </div>
                Olá, responsável! Informamos que o Boletim Escolar referente ao <strong>{bimestre}</strong> do estudante já se encontra homologado e disponível para consulta.<br /><br />
                🔗 <strong>Acesse o Portal do Responsável:</strong><br />
                <span style={{ color: "#38bdf8", textDecoration: "underline" }}>
                  https://sigem.educacao.gov.br/mural-responsavel
                </span><br /><br />
                <em>"Acompanhar a jornada escolar do seu filho é fundamental para o sucesso de sua aprendizagem."</em>
                <div className={styles.whatsappTime}>
                  11:42 ✓✓
                </div>
              </div>
            </div>

            <div className={styles.sectionCard}>
              <h4 style={{ fontSize: 14.5, fontWeight: 700, color: "#f8fafc", margin: "0 0 14px 0" }}>
                👥 Estudantes Selecionados ({alunosFiltrados.length})
              </h4>
              <div style={{ maxHeight: 250, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {alunosComFrequencia.map((aluno) => (
                  <div
                    key={aluno.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      background: "var(--bg-surface, #243144)",
                      border: "1px solid var(--border-subtle, #33435c)",
                      borderRadius: 8,
                      fontSize: 12.5
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "#f8fafc" }}>{aluno.nome}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        Resp: {aluno.responsavelNome}
                      </div>
                    </div>
                    <Badge variant="blue">Pronto para envio</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: FREQUÊNCIA */}
      {abaAtiva === "FREQUENCIA" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className={styles.sectionCard}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ minWidth: 220 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted, #94a3b8)", display: "block", marginBottom: 4 }}>
                    Filtrar por Turma
                  </label>
                  <Select
                    value={turmaSelecionada}
                    onChange={(e) => setTurmaSelecionada(e.target.value)}
                  >
                    <option value="">Todas as Turmas</option>
                    {turmas.map((t) => (
                      <option key={t.id || t.nome} value={t.id || t.nome}>{t.nome}</option>
                    ))}
                  </Select>
                </div>

                <div style={{ minWidth: 200 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted, #94a3b8)", display: "block", marginBottom: 4 }}>
                    Limite para Alerta (Faltas no Mês)
                  </label>
                  <Select
                    value={limiarFalta}
                    onChange={(e) => setLimiarFalta(Number(e.target.value))}
                  >
                    <option value={3}>3 ou mais faltas</option>
                    <option value={5}>5 ou mais faltas (Padrão)</option>
                    <option value={8}>8 ou mais faltas (Grave)</option>
                    <option value={10}>10+ faltas (Conselho Tutelar)</option>
                  </Select>
                </div>
              </div>

              <div className={styles.riscoBadgeWrap}>
                <i className="ti ti-alert-triangle" style={{ color: "#ef4444", fontSize: 24 }} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#f87171" }}>
                    {totalEmRisco} Estudantes em Alerta de Evasão
                  </div>
                  <div style={{ fontSize: 11.5, color: "#cbd5e1" }}>
                    Frequência inferior a 75% ou ausências não justificadas
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.customTable}>
              <thead>
                <tr>
                  <th>Estudante</th>
                  <th>Responsável & Contato</th>
                  <th style={{ textAlign: "center" }}>Faltas no Mês</th>
                  <th style={{ textAlign: "center" }}>% Presença</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ textAlign: "right" }}>Ações Rápidas</th>
                </tr>
              </thead>
              <tbody>
                {alunosComFrequencia.map((aluno) => {
                  const emRisco = aluno.riscoInfrequencia;
                  return (
                    <tr key={aluno.id} className={emRisco ? styles.rowRisco : ""}>
                      <td>
                        <div style={{ fontWeight: 600, color: "#f8fafc" }}>{aluno.nome}</div>
                        <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                          Matrícula: {aluno.matricula || aluno.id?.slice(0, 8) || "2026001"}
                        </div>
                      </td>

                      <td>
                        <div style={{ color: "#cbd5e1", fontWeight: 500 }}>{aluno.responsavelNome}</div>
                        <div style={{ fontSize: 11.5, color: "#38bdf8" }}>
                          <i className="ti ti-phone" style={{ marginRight: 4 }} />
                          {aluno.responsavelTelefone}
                        </div>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span style={{ fontWeight: 700, color: emRisco ? "#f87171" : "#cbd5e1", fontSize: 14 }}>
                          {aluno.faltasNoMes} dias
                        </span>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: Number(aluno.taxaPresenca) < 75 ? "#f87171" : "#34d399"
                          }}
                        >
                          {aluno.taxaPresenca}%
                        </span>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        {emRisco ? (
                          <Badge variant="danger">Risco de Evasão</Badge>
                        ) : (
                          <Badge variant="success">Frequência Regular</Badge>
                        )}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <Btn
                            size="sm"
                            onClick={() => handleDispararAlertaFalta(aluno)}
                            title="Enviar Alerta via WhatsApp"
                            style={{ background: "#059669", color: "#fff", borderColor: "#34d399", fontSize: 11.5 }}
                          >
                            <i className="ti ti-brand-whatsapp" />
                            WhatsApp
                          </Btn>

                          <Btn
                            variant="outline"
                            size="sm"
                            onClick={() => imprimirNotificacaoOficialFaltas(aluno)}
                            title="Imprimir Ofício de Notificação (LDB / Conselho Tutelar)"
                            style={{ fontSize: 11.5 }}
                          >
                            <i className="ti ti-printer" />
                            Ofício
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
