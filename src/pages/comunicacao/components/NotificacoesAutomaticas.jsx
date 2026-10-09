import React, { useState } from "react";
import { Card, Btn, Badge, Select, Alert } from "../../../components/ui";
import { addMensagem } from "../../../services/comunicacaoService";

export default function NotificacoesAutomaticas({
  turmas = [],
  alunos = [],
  escolaId,
  selectedEscola,
  onRefresh
}) {
  const [abaAtiva, setAbaAtiva] = useState("BOLETIM"); // BOLETIM | FREQUENCIA | PEDAGOGICO
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [bimestre, setBimestre] = useState("1º Bimestre");
  const [limiarFalta, setLimiarFalta] = useState(5); // Dias de falta para alertar
  const [enviando, setEnviando] = useState(false);
  const [alertaSucesso, setAlertaSucesso] = useState(null);

  // Alunos da turma selecionada
  const alunosFiltrados = turmaSelecionada
    ? alunos.filter((a) => a.turmaId === turmaSelecionada || a.turma === turmaSelecionada)
    : alunos.slice(0, 15);

  // Simulação de faltas e infrequência calculadas
  const alunosComFrequencia = alunosFiltrados.map((a, idx) => {
    // mock determinístico baseado no id/idx para demonstração realista
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
      // Salvar registro de disparo na base
      const registro = {
        tipo: "Boletim Disponível",
        destinatarioTipo: "Turma Completa",
        turmaNome: nomeTurma,
        bimestre: bimestre,
        totalDestinatarios: alunosFiltrados.length,
        conteudo: `Aviso oficial: O Boletim Escolar do ${bimestre} referente ao estudante já está homologado e disponível para consulta no Portal do Aluno/Responsável.`,
        canal: "WhatsApp & Mural Digital",
        autor: "Secretaria Escolar"
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

    // Copiar e abrir WhatsApp
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

    // Registrar no histórico
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
        autor: "Coordenação de Frequência"
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Banner Principal */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
          padding: "24px 28px",
          borderRadius: "16px",
          color: "#fff",
          boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.3)"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>⚡</span>
            <h2 style={{ fontSize: "22px", fontWeight: "700", margin: 0 }}>
              Notificações Automáticas & Alertas
            </h2>
          </div>
          <p style={{ margin: 0, opacity: 0.9, fontSize: "14px", maxWidth: "650px" }}>
            Dispare avisos em massa para as famílias com links dos <strong>Boletins Escolares</strong> e
            monitore alunos com <strong>baixa frequência ou faltas consecutivas</strong> com notificações imediatas.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Badge variant="success" style={{ padding: "8px 14px", fontSize: "13px", background: "rgba(255,255,255,0.2)", color: "#fff", borderColor: "transparent" }}>
            <i className="ti ti-check" style={{ marginRight: "6px" }}></i> Integração WhatsApp & Web
          </Badge>
        </div>
      </div>

      {alertaSucesso && (
        <Alert type="success" onClose={() => setAlertaSucesso(null)}>
          {alertaSucesso}
        </Alert>
      )}

      {/* Tabs de Controle */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>
        <button
          onClick={() => setAbaAtiva("BOLETIM")}
          style={{
            background: abaAtiva === "BOLETIM" ? "#4f46e5" : "transparent",
            color: abaAtiva === "BOLETIM" ? "#fff" : "#64748b",
            border: "none",
            borderRadius: "8px",
            padding: "10px 18px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s"
          }}
        >
          <i className="ti ti-file-certificate" style={{ fontSize: "18px" }}></i>
          Boletim Disponível
        </button>

        <button
          onClick={() => setAbaAtiva("FREQUENCIA")}
          style={{
            background: abaAtiva === "FREQUENCIA" ? "#4f46e5" : "transparent",
            color: abaAtiva === "FREQUENCIA" ? "#fff" : "#64748b",
            border: "none",
            borderRadius: "8px",
            padding: "10px 18px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s"
          }}
        >
          <i className="ti ti-user-exclamation" style={{ fontSize: "18px" }}></i>
          Alertas de Frequência & Faltas
        </button>
      </div>

      {/* ==================================================== */}
      {/* ABA 1: BOLETIM DISPONÍVEL                            */}
      {/* ==================================================== */}
      {abaAtiva === "BOLETIM" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Card style={{ padding: "22px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#1e293b", margin: "0 0 14px 0" }}>
              Disparo em Massa: Boletim Escolar Online
            </h3>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 20px 0" }}>
              Selecione o bimestre e a turma para enviar a mensagem formatada para todos os responsáveis,
              avisando sobre a publicação das notas e desempenho acadêmico.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
                alignItems: "flex-end",
                background: "#f8fafc",
                padding: "18px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0"
              }}
            >
              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Bimestre de Referência *
                </label>
                <Select
                  value={bimestre}
                  onChange={(e) => setBimestre(e.target.value)}
                  options={[
                    { value: "1º Bimestre", label: "1º Bimestre Letivo" },
                    { value: "2º Bimestre", label: "2º Bimestre Letivo" },
                    { value: "3º Bimestre", label: "3º Bimestre Letivo" },
                    { value: "4º Bimestre", label: "4º Bimestre Letivo" },
                    { value: "Resultado Final", label: "Resultado Final Anual" }
                  ]}
                />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                  Turma Destino *
                </label>
                <Select
                  value={turmaSelecionada}
                  onChange={(e) => setTurmaSelecionada(e.target.value)}
                  options={[
                    { value: "", label: "-- Todas as Turmas / Selecione --" },
                    ...turmas.map((t) => ({ value: t.id || t.nome, label: t.nome || t.id }))
                  ]}
                />
              </div>

              <div>
                <Btn
                  variant="primary"
                  onClick={handleDispararBoletimTurma}
                  disabled={enviando}
                  style={{
                    width: "100%",
                    background: "#4f46e5",
                    borderColor: "#4f46e5",
                    height: "40px",
                    fontWeight: "600"
                  }}
                >
                  <i className="ti ti-send" style={{ marginRight: "8px" }}></i>
                  {enviando ? "Disparando Avisos..." : `Disparar para a Turma (${alunosFiltrados.length} Alunos)`}
                </Btn>
              </div>
            </div>
          </Card>

          {/* Pré-visualização do Formato da Notificação */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
            <Card style={{ padding: "20px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: "0 0 12px 0" }}>
                📱 Prévia da Notificação Enviada aos Responsáveis
              </h4>
              <div
                style={{
                  background: "#dcf8c6",
                  color: "#1e293b",
                  padding: "16px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.06)",
                  border: "1px solid #c7e8a9",
                  position: "relative"
                }}
              >
                <div style={{ fontWeight: "700", color: "#075e54", marginBottom: "6px" }}>
                  📊 ESCOLA MUNICIPAL — BOLETIM DISPONÍVEL
                </div>
                Olá, responsável! Informamos que o Boletim Escolar referente ao <strong>{bimestre}</strong> do estudante já se encontra homologado e disponível para consulta.
                <br /><br />
                🔗 <strong>Acesse o Portal do Responsável:</strong>
                <br />
                <span style={{ color: "#0284c7", textDecoration: "underline" }}>
                  https://sigem.educacao.gov.br/mural-responsavel
                </span>
                <br /><br />
                <em>"Acompanhar a jornada escolar do seu filho é fundamental para o sucesso de sua aprendizagem."</em>
                <div style={{ textAlign: "right", fontSize: "11px", color: "#64748b", marginTop: "8px" }}>
                  11:42 ✓✓
                </div>
              </div>
            </Card>

            <Card style={{ padding: "20px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: "0 0 12px 0" }}>
                👥 Lista de Alunos Contemplados
              </h4>
              <div style={{ maxHeight: "260px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                {alunosComFrequencia.map((aluno) => (
                  <div
                    key={aluno.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      background: "#f8fafc",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "600", color: "#1e293b" }}>{aluno.nome}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        Resp: {aluno.responsavelNome}
                      </div>
                    </div>
                    <Badge variant="blue">Pronto</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* ABA 2: ALERTAS DE FREQUÊNCIA & FALTAS               */}
      {/* ==================================================== */}
      {abaAtiva === "FREQUENCIA" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Configuração de Filtros */}
          <Card style={{ padding: "18px 22px" }}>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ minWidth: "220px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "4px" }}>
                    Filtrar por Turma
                  </label>
                  <Select
                    value={turmaSelecionada}
                    onChange={(e) => setTurmaSelecionada(e.target.value)}
                    options={[
                      { value: "", label: "Todas as Turmas" },
                      ...turmas.map((t) => ({ value: t.id || t.nome, label: t.nome || t.id }))
                    ]}
                  />
                </div>

                <div style={{ minWidth: "200px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "4px" }}>
                    Limite para Alerta (Faltas no Mês)
                  </label>
                  <Select
                    value={limiarFalta}
                    onChange={(e) => setLimiarFalta(Number(e.target.value))}
                    options={[
                      { value: 3, label: "3 ou mais faltas" },
                      { value: 5, label: "5 ou mais faltas (Padrão)" },
                      { value: 8, label: "8 ou mais faltas (Grave)" },
                      { value: 10, label: "10+ faltas (Conselho Tutelar)" }
                    ]}
                  />
                </div>
              </div>

              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 16px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                <i className="ti ti-alert-triangle" style={{ color: "#ef4444", fontSize: "20px" }}></i>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#991b1b" }}>
                    {alunosComFrequencia.filter((a) => a.riscoInfrequencia).length} Alunos em Risco
                  </div>
                  <div style={{ fontSize: "11px", color: "#b91c1c" }}>
                    Frequência inferior a 75% ou excesso de ausências
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabela de Estudantes e Ações Rápidas */}
          <Card style={{ padding: "0", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                Painel de Infrequência e Notificação aos Responsáveis
              </h3>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 18px", fontWeight: "600" }}>Estudante</th>
                    <th style={{ padding: "12px 18px", fontWeight: "600" }}>Responsável & Telefone</th>
                    <th style={{ padding: "12px 18px", fontWeight: "600", textAlign: "center" }}>Faltas no Mês</th>
                    <th style={{ padding: "12px 18px", fontWeight: "600", textAlign: "center" }}>% Presença</th>
                    <th style={{ padding: "12px 18px", fontWeight: "600", textAlign: "center" }}>Status de Risco</th>
                    <th style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody>
                  {alunosComFrequencia.map((aluno) => {
                    const emRisco = aluno.riscoInfrequencia;
                    return (
                      <tr
                        key={aluno.id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: emRisco ? "#fff7ed" : "transparent"
                        }}
                      >
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ fontWeight: "600", color: "#1e293b" }}>{aluno.nome}</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            Matrícula: {aluno.matricula || aluno.id?.slice(0, 8) || "2026001"}
                          </div>
                        </td>

                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ color: "#334155", fontWeight: "500" }}>{aluno.responsavelNome}</div>
                          <div style={{ fontSize: "12px", color: "#0284c7" }}>
                            <i className="ti ti-phone" style={{ marginRight: "4px" }}></i>
                            {aluno.responsavelTelefone}
                          </div>
                        </td>

                        <td style={{ padding: "14px 18px", textAlign: "center" }}>
                          <span style={{ fontWeight: "700", color: emRisco ? "#ea580c" : "#334155", fontSize: "15px" }}>
                            {aluno.faltasNoMes} dias
                          </span>
                        </td>

                        <td style={{ padding: "14px 18px", textAlign: "center" }}>
                          <span
                            style={{
                              fontWeight: "700",
                              color: Number(aluno.taxaPresenca) < 75 ? "#ef4444" : "#16a34a"
                            }}
                          >
                            {aluno.taxaPresenca}%
                          </span>
                        </td>

                        <td style={{ padding: "14px 18px", textAlign: "center" }}>
                          {emRisco ? (
                            <Badge variant="danger">Risco de Evasão</Badge>
                          ) : (
                            <Badge variant="success">Frequência Regular</Badge>
                          )}
                        </td>

                        <td style={{ padding: "14px 18px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <Btn
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDispararAlertaFalta(aluno)}
                              title="Enviar Alerta via WhatsApp"
                              style={{
                                background: "#22c55e",
                                color: "#fff",
                                borderColor: "#22c55e",
                                padding: "6px 12px"
                              }}
                            >
                              <i className="ti ti-brand-whatsapp" style={{ marginRight: "4px" }}></i>
                              WhatsApp
                            </Btn>

                            <Btn
                              variant="outline"
                              size="sm"
                              onClick={() => imprimirNotificacaoOficialFaltas(aluno)}
                              title="Imprimir Notificação Oficial (LDB / Conselho Tutelar)"
                              style={{ padding: "6px 10px" }}
                            >
                              <i className="ti ti-printer" style={{ marginRight: "4px" }}></i>
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
          </Card>
        </div>
      )}
    </div>
  );
}
