import React, { useState } from "react";
import { Card, Btn, Badge, Modal, Input, Select, EmptyState, Alert } from "../../../components/ui";
import { addMensagem, deleteMensagem } from "../../../services/comunicacaoService";

const MODELOS_MENSAGEM = [
  {
    id: "elogio",
    titulo: "🌟 Elogio de Desempenho e Comportamento",
    texto: "Prezado(a) responsável, gostaríamos de parabenizá-lo(a) pelo excelente desempenho e dedicação demonstrados pelo(a) estudante nas atividades escolares desta semana. Continuem incentivando!"
  },
  {
    id: "material",
    titulo: "🎒 Lembrete de Material Escolar e Uniforme",
    texto: "Prezado(a) responsável, solicitamos a gentileza de verificar os materiais escolares e uso diário do uniforme completo do estudante para o melhor aproveitamento das atividades pedagógicas."
  },
  {
    id: "comparecimento",
    titulo: "🏫 Solicitação de Comparecimento à Coordenação",
    texto: "Prezado(a) responsável, solicitamos o seu comparecimento à coordenação pedagógica da escola em data oportuna para tratarmos do acompanhamento acadêmico do estudante."
  },
  {
    id: "saude",
    titulo: "💊 Notificação de Saúde / Mal-estar",
    texto: "Prezado(a) responsável, informamos que o(a) estudante apresentou leve indisposição durante o turno de aulas. Ele(a) está acolhido(a) na secretaria sob cuidados."
  },
  {
    id: "documentacao",
    titulo: "📑 Regularização de Documentos na Secretaria",
    texto: "Prezado(a) responsável, solicitamos o envio das cópias dos documentos pendentes para atualização cadastral da pasta do estudante na secretaria."
  }
];

export default function MensagensEscola({
  mensagens = [],
  alunos = [],
  turmas = [],
  escolaId,
  selectedEscola,
  onRefresh
}) {
  const [busca, setBusca] = useState("");
  const [modalNovaMensagem, setModalNovaMensagem] = useState(false);
  const [tipoEnvio, setTipoEnvio] = useState("INDIVIDUAL"); // INDIVIDUAL | TURMA | GERAL
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState("");
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState("");
  const [assunto, setAssunto] = useState("");
  const [corpoMensagem, setCorpoMensagem] = useState("");
  const [canal, setCanal] = useState("WhatsApp & Mural");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(null);

  const alunoObj = alunos.find((a) => a.id === alunoSelecionadoId);

  const aplicarModelo = (modelo) => {
    setAssunto(modelo.titulo.replace(/[^\w\sÀ-ú]/g, "").trim());
    setCorpoMensagem(modelo.texto);
  };

  const handleEnviarMensagem = async (e) => {
    e.preventDefault();
    if (!corpoMensagem.trim() || !assunto.trim()) {
      alert("Por favor, preencha o assunto e o texto da mensagem.");
      return;
    }

    if (tipoEnvio === "INDIVIDUAL" && !alunoSelecionadoId) {
      alert("Por favor, selecione o aluno destinatário.");
      return;
    }

    setEnviando(true);
    try {
      let destInfo = {};
      if (tipoEnvio === "INDIVIDUAL" && alunoObj) {
        destInfo = {
          destinatarioTipo: "Individual",
          alunoNome: alunoObj.nome,
          alunoId: alunoObj.id,
          responsavelNome: alunoObj.responsavelNome || alunoObj.responsavel || "Responsável Legal",
          responsavelTelefone: alunoObj.responsavelTelefone || alunoObj.telefone || "(87) 98845-1234"
        };
      } else if (tipoEnvio === "TURMA") {
        const tObj = turmas.find((t) => t.id === turmaSelecionadaId || t.nome === turmaSelecionadaId);
        destInfo = {
          destinatarioTipo: "Turma Completa",
          turmaNome: tObj?.nome || turmaSelecionadaId || "Turma"
        };
      } else {
        destInfo = {
          destinatarioTipo: "Toda a Escola",
          publico: "Todos os Responsáveis"
        };
      }

      const novaMsg = {
        ...destInfo,
        tipo: "Mensagem Direta",
        assunto,
        conteudo: corpoMensagem,
        canal,
        autor: "Secretaria / Gestão Escolar"
      };

      await addMensagem(novaMsg, escolaId);

      // Se for individual e canal envolver WhatsApp, abrir link formatado
      if (tipoEnvio === "INDIVIDUAL" && alunoObj && canal.includes("WhatsApp")) {
        const nomeEscola = selectedEscola?.nome || "Escola Municipal";
        const textoWA = `*${assunto.toUpperCase()}*\n🏫 *${nomeEscola}*\n\n` +
          `Olá, *${destInfo.responsavelNome}* (Responsável por *${destInfo.alunoNome}*),\n\n` +
          `${corpoMensagem}\n\n` +
          `_Atenciosamente, Gestão Escolar._`;

        const foneLimpo = (destInfo.responsavelTelefone || "").replace(/\D/g, "");
        if (foneLimpo) {
          window.open(`https://api.whatsapp.com/send?phone=55${foneLimpo}&text=${encodeURIComponent(textoWA)}`, "_blank");
        }
      }

      setSucesso("Mensagem registrada e enviada com sucesso!");
      setModalNovaMensagem(false);
      setAssunto("");
      setCorpoMensagem("");
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar mensagem: " + err.message);
    } finally {
      setEnviando(false);
    }
  };

  const handleExcluir = async (id) => {
    if (!window.confirm("Deseja remover este registro do histórico de mensagens?")) return;
    try {
      await deleteMensagem(id);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtragem de mensagens
  const mensagensFiltradas = mensagens.filter((m) => {
    const q = busca.toLowerCase();
    return (
      (m.assunto || "").toLowerCase().includes(q) ||
      (m.conteudo || "").toLowerCase().includes(q) ||
      (m.alunoNome || "").toLowerCase().includes(q) ||
      (m.responsavelNome || "").toLowerCase().includes(q) ||
      (m.turmaNome || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
          padding: "24px 28px",
          borderRadius: "16px",
          color: "#fff",
          boxShadow: "0 10px 25px -5px rgba(5, 150, 105, 0.3)"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>💬</span>
            <h2 style={{ fontSize: "22px", fontWeight: "700", margin: 0 }}>
              Mensagens da Escola & Atendimento
            </h2>
          </div>
          <p style={{ margin: 0, opacity: 0.9, fontSize: "14px", maxWidth: "600px" }}>
            Envie comunicados individuais, elogios pedagógicos ou avisos urgentes diretamente para o
            WhatsApp dos pais e mantenha todo o histórico registrado.
          </p>
        </div>

        <Btn
          variant="secondary"
          onClick={() => setModalNovaMensagem(true)}
          style={{
            background: "#fff",
            color: "#047857",
            fontWeight: "600",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            padding: "10px 18px"
          }}
        >
          <i className="ti ti-message-plus" style={{ marginRight: "6px", fontSize: "18px" }}></i>
          Nova Mensagem
        </Btn>
      </div>

      {sucesso && (
        <Alert type="success" onClose={() => setSucesso(null)}>
          {sucesso}
        </Alert>
      )}

      {/* Modelos Rápidos de Mensagem */}
      <Card style={{ padding: "18px 22px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#334155", margin: "0 0 12px 0" }}>
          ⚡ Atalhos de Mensagens Frequentes:
        </h4>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {MODELOS_MENSAGEM.map((mod) => (
            <button
              key={mod.id}
              onClick={() => {
                aplicarModelo(mod);
                setModalNovaMensagem(true);
              }}
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.15s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#dcfce7")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#f0fdf4")}
            >
              {mod.titulo}
            </button>
          ))}
        </div>
      </Card>

      {/* Busca e Tabela de Histórico */}
      <Card style={{ padding: "16px 20px" }}>
        <Input
          placeholder="Buscar no histórico de mensagens por assunto, aluno, responsável ou conteúdo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          prefixIcon="ti ti-search"
        />
      </Card>

      {mensagensFiltradas.length === 0 ? (
        <EmptyState
          icon="ti ti-messages"
          title="Nenhuma mensagem registrada"
          description="Envie comunicados individuais ou para turmas para manter a ponte com os responsáveis."
          action={
            <Btn variant="primary" onClick={() => setModalNovaMensagem(true)}>
              <i className="ti ti-plus" style={{ marginRight: "6px" }}></i> Enviar Mensagem
            </Btn>
          }
        />
      ) : (
        <Card style={{ padding: "0", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
              Histórico de Mensagens Enviadas ({mensagensFiltradas.length})
            </h3>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 18px", fontWeight: "600" }}>Data / Horário</th>
                  <th style={{ padding: "12px 18px", fontWeight: "600" }}>Destinatário</th>
                  <th style={{ padding: "12px 18px", fontWeight: "600" }}>Assunto & Conteúdo</th>
                  <th style={{ padding: "12px 18px", fontWeight: "600" }}>Canal</th>
                  <th style={{ padding: "12px 18px", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "12px 18px", fontWeight: "600", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {mensagensFiltradas.map((msg) => (
                  <tr key={msg.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: "600", color: "#1e293b" }}>
                        {msg.enviadoEm ? new Date(msg.enviadoEm).toLocaleDateString("pt-BR") : "—"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {msg.enviadoEm ? new Date(msg.enviadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </div>
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      {msg.alunoNome ? (
                        <div>
                          <div style={{ fontWeight: "600", color: "#1e293b" }}>{msg.alunoNome}</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            Resp: {msg.responsavelNome || "Família"}
                          </div>
                        </div>
                      ) : msg.turmaNome ? (
                        <div>
                          <Badge variant="purple">Turma: {msg.turmaNome}</Badge>
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                            {msg.totalDestinatarios ? `${msg.totalDestinatarios} alunos` : "Todos"}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="blue">Toda a Escola</Badge>
                      )}
                    </td>

                    <td style={{ padding: "14px 18px", maxWidth: "340px" }}>
                      <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "4px" }}>
                        {msg.assunto || msg.tipo || "Mensagem"}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#64748b",
                          lineHeight: "1.4",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}
                      >
                        {msg.conteudo}
                      </div>
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      <Badge variant="green">{msg.canal || "WhatsApp"}</Badge>
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ color: "#16a34a", fontWeight: "600", fontSize: "13px" }}>
                        ✓ {msg.status || "Enviada"}
                      </span>
                    </td>

                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <Btn
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExcluir(msg.id)}
                        title="Remover do Histórico"
                        style={{ padding: "6px 8px" }}
                      >
                        <i className="ti ti-trash" style={{ color: "#ef4444" }}></i>
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal de Nova Mensagem */}
      <Modal
        isOpen={modalNovaMensagem}
        onClose={() => setModalNovaMensagem(false)}
        title="Enviar Nova Mensagem da Escola"
        maxWidth="620px"
      >
        <form onSubmit={handleEnviarMensagem} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
              Tipo de Envio
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setTipoEnvio("INDIVIDUAL")}
                style={{
                  background: tipoEnvio === "INDIVIDUAL" ? "#047857" : "#f1f5f9",
                  color: tipoEnvio === "INDIVIDUAL" ? "#fff" : "#334155",
                  border: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                👤 Individual
              </button>

              <button
                type="button"
                onClick={() => setTipoEnvio("TURMA")}
                style={{
                  background: tipoEnvio === "TURMA" ? "#047857" : "#f1f5f9",
                  color: tipoEnvio === "TURMA" ? "#fff" : "#334155",
                  border: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                👥 Por Turma
              </button>

              <button
                type="button"
                onClick={() => setTipoEnvio("GERAL")}
                style={{
                  background: tipoEnvio === "GERAL" ? "#047857" : "#f1f5f9",
                  color: tipoEnvio === "GERAL" ? "#fff" : "#334155",
                  border: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                📢 Toda a Escola
              </button>
            </div>
          </div>

          {tipoEnvio === "INDIVIDUAL" && (
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                Selecione o Estudante *
              </label>
              <Select
                value={alunoSelecionadoId}
                onChange={(e) => setAlunoSelecionadoId(e.target.value)}
                options={[
                  { value: "", label: "-- Escolha o Aluno --" },
                  ...alunos.map((a) => ({
                    value: a.id,
                    label: `${a.nome} — Resp: ${a.responsavelNome || a.responsavel || "Pais"}`
                  }))
                ]}
              />
            </div>
          )}

          {tipoEnvio === "TURMA" && (
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                Selecione a Turma *
              </label>
              <Select
                value={turmaSelecionadaId}
                onChange={(e) => setTurmaSelecionadaId(e.target.value)}
                options={[
                  { value: "", label: "-- Escolha a Turma --" },
                  ...turmas.map((t) => ({ value: t.id || t.nome, label: t.nome || t.id }))
                ]}
              />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                Assunto da Mensagem *
              </label>
              <Input
                required
                placeholder="Ex: Acompanhamento Pedagógico"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                Canal de Envio
              </label>
              <Select
                value={canal}
                onChange={(e) => setCanal(e.target.value)}
                options={[
                  { value: "WhatsApp & Mural", label: "WhatsApp & Mural Digital" },
                  { value: "WhatsApp Direto", label: "Somente WhatsApp" },
                  { value: "Mural do Responsável", label: "Mural Online" }
                ]}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
              Conteúdo da Mensagem *
            </label>
            <textarea
              required
              rows={5}
              placeholder="Digite o texto que será enviado ao responsável..."
              value={corpoMensagem}
              onChange={(e) => setCorpoMensagem(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontFamily: "inherit",
                fontSize: "14px",
                resize: "vertical"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <Btn variant="ghost" onClick={() => setModalNovaMensagem(false)}>
              Cancelar
            </Btn>
            <Btn variant="primary" type="submit" disabled={enviando} style={{ background: "#047857", borderColor: "#047857" }}>
              <i className="ti ti-send" style={{ marginRight: "6px" }}></i>
              {enviando ? "Enviando..." : "Enviar Mensagem"}
            </Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
