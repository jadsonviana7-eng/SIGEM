import React, { useState } from "react";
import { Card, Btn, Badge, Modal, Input, Select, EmptyState, Alert } from "../../../components/ui";
import { addEvento, updateEvento, deleteEvento } from "../../../services/comunicacaoService";

const CATEGORIAS = [
  "Cultural & Festivo",
  "Acadêmico & Mostra Científica",
  "Esportivo & Recreativo",
  "Comunitário & Família",
  "Pedagógico & Formativo",
  "Outros"
];

const PUBLICOS = [
  "Toda a Comunidade Escolar",
  "Educação Infantil",
  "Ensino Fundamental I",
  "Ensino Fundamental II",
  "Turma Específica"
];

export default function EventosCalendario({
  eventos = [],
  turmas = [],
  escolaId,
  onRefresh,
  selectedEscola
}) {
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("TODAS");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Form State
  const [form, setForm] = useState({
    titulo: "",
    categoria: "Cultural & Festivo",
    publicoAlvo: "Toda a Comunidade Escolar",
    turmaAlvo: "",
    dataEvento: new Date().toISOString().split("T")[0],
    horaInicio: "08:00",
    horaFim: "11:30",
    local: "Pátio Principal / Quadra Coberta",
    descricao: "",
    organizador: "Equipe Gestora & Docentes",
    abertoFamilia: true,
    status: "Confirmado"
  });

  const abrirNovo = () => {
    setForm({
      titulo: "",
      categoria: "Cultural & Festivo",
      publicoAlvo: "Toda a Comunidade Escolar",
      turmaAlvo: "",
      dataEvento: new Date().toISOString().split("T")[0],
      horaInicio: "08:00",
      horaFim: "11:30",
      local: "Pátio Principal / Quadra Coberta",
      descricao: "",
      organizador: "Equipe Gestora & Docentes",
      abertoFamilia: true,
      status: "Confirmado"
    });
    setIsEditing(false);
    setModalOpen(true);
  };

  const abrirEditar = (ev) => {
    setSelectedEvento(ev);
    setForm({
      titulo: ev.titulo || "",
      categoria: ev.categoria || "Cultural & Festivo",
      publicoAlvo: ev.publicoAlvo || "Toda a Comunidade Escolar",
      turmaAlvo: ev.turmaAlvo || "",
      dataEvento: ev.dataEvento || "",
      horaInicio: ev.horaInicio || "08:00",
      horaFim: ev.horaFim || "11:30",
      local: ev.local || "",
      descricao: ev.descricao || "",
      organizador: ev.organizador || "Equipe Gestora & Docentes",
      abertoFamilia: ev.abertoFamilia !== false,
      status: ev.status || "Confirmado"
    });
    setIsEditing(true);
    setModalOpen(true);
  };

  const abrirDetalhes = (ev) => {
    setSelectedEvento(ev);
    setCopiado(false);
    setModalDetalhesOpen(true);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.dataEvento) {
      alert("Por favor, preencha o título e a data do evento.");
      return;
    }
    setSalvando(true);
    try {
      if (isEditing && selectedEvento) {
        await updateEvento(selectedEvento.id, form);
      } else {
        await addEvento(form, escolaId);
      }
      setModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar evento: " + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id) => {
    if (!window.confirm("Deseja realmente excluir este evento do calendário?")) return;
    try {
      await deleteEvento(id);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir: " + err.message);
    }
  };

  const formatarDataBR = (dt) => {
    if (!dt) return "—";
    const [y, m, d] = dt.split("-");
    return `${d}/${m}/${y}`;
  };

  const gerarTextoWhatsApp = (ev) => {
    const escolaNome = selectedEscola?.nome || "Escola Municipal";
    return `🎉 *CONVITE ESPECIAL: ${ev.titulo?.toUpperCase()}*\n\n` +
      `🏫 *${escolaNome}*\n` +
      `📅 *Data:* ${formatarDataBR(ev.dataEvento)}\n` +
      `⏰ *Horário:* ${ev.horaInicio} às ${ev.horaFim}\n` +
      `📍 *Local:* ${ev.local}\n` +
      `👥 *Público:* ${ev.publicoAlvo}${ev.turmaAlvo ? ` (${ev.turmaAlvo})` : ""}\n\n` +
      `📝 *Detalhes:* ${ev.descricao || "Participe com toda a sua família!"}\n\n` +
      `🤝 _Sua presença é fundamental para fortalecermos os laços entre escola e família!_`;
  };

  const copiarWhatsApp = (ev) => {
    const txt = gerarTextoWhatsApp(ev);
    navigator.clipboard.writeText(txt);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const imprimirConvite = (ev) => {
    const printWin = window.open("", "_blank", "width=800,height=900");
    const escolaNome = selectedEscola?.nome || "ESCOLA MUNICIPAL";
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Convite de Evento - ${ev.titulo}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
          .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; color: #0284c7; text-transform: uppercase; margin-top: 10px; }
          .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 14px; margin-top: 5px; }
          .card-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 25px; background: #f8fafc; margin-bottom: 25px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .field { font-size: 15px; }
          .field strong { color: #334155; }
          .desc { font-size: 16px; line-height: 1.6; color: #334155; margin-top: 15px; white-space: pre-wrap; }
          .footer { margin-top: 50px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 20px; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${escolaNome}</h2>
          <div class="title">${ev.titulo}</div>
          <span class="badge">${ev.categoria}</span>
        </div>
        <div class="card-box">
          <div class="grid">
            <div class="field"><strong>📅 Data:</strong> ${formatarDataBR(ev.dataEvento)}</div>
            <div class="field"><strong>⏰ Horário:</strong> ${ev.horaInicio} às ${ev.horaFim}</div>
            <div class="field"><strong>📍 Local:</strong> ${ev.local}</div>
            <div class="field"><strong>👥 Público Convidado:</strong> ${ev.publicoAlvo} ${ev.turmaAlvo ? `(${ev.turmaAlvo})` : ""}</div>
            <div class="field"><strong>👨‍🏫 Organizador:</strong> ${ev.organizador}</div>
            <div class="field"><strong>👨‍👩‍👧‍👦 Aberto à Família:</strong> ${ev.abertoFamilia ? "Sim, presença incentivada" : "Evento interno de alunos"}</div>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
          <div><strong>Programação & Informações:</strong></div>
          <div class="desc">${ev.descricao || "Participe e prestigie o trabalho de nossos estudantes e da comunidade escolar."}</div>
        </div>
        <div class="footer">
          Documento gerado automaticamente pelo Sistema Integrado de Gestão Escolar (SIGEM) em ${new Date().toLocaleDateString("pt-BR")}.
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  // Filtros
  const eventosFiltrados = eventos.filter((ev) => {
    const matchBusca =
      (ev.titulo || "").toLowerCase().includes(busca.toLowerCase()) ||
      (ev.descricao || "").toLowerCase().includes(busca.toLowerCase()) ||
      (ev.local || "").toLowerCase().includes(busca.toLowerCase());
    const matchCat = filtroCategoria === "TODAS" || ev.categoria === filtroCategoria;
    return matchBusca && matchCat;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header & Ações */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
          padding: "24px 28px",
          borderRadius: "16px",
          color: "#fff",
          boxShadow: "0 10px 25px -5px rgba(2, 132, 199, 0.3)"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>🎪</span>
            <h2 style={{ fontSize: "22px", fontWeight: "700", margin: 0 }}>
              Eventos & Calendário Cultural
            </h2>
          </div>
          <p style={{ margin: 0, opacity: 0.9, fontSize: "14px", maxWidth: "600px" }}>
            Planeje, divulgue e convide as famílias para feiras culturais, mostras pedagógicas,
            comemorações cívicas e atividades esportivas da escola.
          </p>
        </div>

        <Btn
          variant="secondary"
          onClick={abrirNovo}
          style={{
            background: "#fff",
            color: "#0369a1",
            fontWeight: "600",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            padding: "10px 18px"
          }}
        >
          <i className="ti ti-calendar-plus" style={{ marginRight: "6px", fontSize: "18px" }}></i>
          Novo Evento
        </Btn>
      </div>

      {/* Barra de Filtros */}
      <Card style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1", minWidth: "240px" }}>
            <Input
              placeholder="Buscar por nome do evento, local ou descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              prefixIcon="ti ti-search"
            />
          </div>

          <div style={{ minWidth: "220px" }}>
            <Select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              options={[
                { value: "TODAS", label: "Todas as Categorias" },
                ...CATEGORIAS.map((c) => ({ value: c, label: c }))
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Grid de Cards de Eventos */}
      {eventosFiltrados.length === 0 ? (
        <EmptyState
          icon="ti ti-calendar-event"
          title="Nenhum evento agendado"
          description="Clique em 'Novo Evento' para cadastrar atividades no calendário escolar."
          action={
            <Btn variant="primary" onClick={abrirNovo}>
              <i className="ti ti-plus" style={{ marginRight: "6px" }}></i> Cadastrar Primeiro Evento
            </Btn>
          }
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "18px"
          }}
        >
          {eventosFiltrados.map((ev) => {
            const isHoje = ev.dataEvento === new Date().toISOString().split("T")[0];

            return (
              <Card
                key={ev.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "20px",
                  borderRadius: "14px",
                  border: isHoje ? "2px solid #0284c7" : "1px solid #e2e8f0",
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
              >
                {isHoje && (
                  <div
                    style={{
                      position: "absolute",
                      top: "0",
                      right: "0",
                      background: "#0284c7",
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "3px 12px",
                      borderBottomLeftRadius: "10px"
                    }}
                  >
                    HOJE!
                  </div>
                )}

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "10px",
                      marginBottom: "12px"
                    }}
                  >
                    <Badge
                      variant={
                        ev.categoria.includes("Cultural")
                          ? "purple"
                          : ev.categoria.includes("Acadêmico")
                          ? "blue"
                          : ev.categoria.includes("Esportivo")
                          ? "green"
                          : "warning"
                      }
                    >
                      {ev.categoria}
                    </Badge>
                    <Badge variant={ev.status === "Confirmado" ? "success" : "neutral"}>
                      {ev.status || "Confirmado"}
                    </Badge>
                  </div>

                  <h3
                    style={{
                      fontSize: "17px",
                      fontWeight: "700",
                      color: "#1e293b",
                      margin: "0 0 8px 0",
                      lineHeight: "1.3"
                    }}
                  >
                    {ev.titulo}
                  </h3>

                  <p
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      margin: "0 0 16px 0",
                      lineHeight: "1.5",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}
                  >
                    {ev.descricao || "Sem detalhes adicionais cadastrados."}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      background: "#f8fafc",
                      padding: "12px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      color: "#334155",
                      marginBottom: "16px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <i className="ti ti-calendar" style={{ color: "#0284c7" }}></i>
                      <span>
                        <strong>Data:</strong> {formatarDataBR(ev.dataEvento)}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <i className="ti ti-clock" style={{ color: "#0284c7" }}></i>
                      <span>
                        <strong>Horário:</strong> {ev.horaInicio} às {ev.horaFim}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <i className="ti ti-map-pin" style={{ color: "#e11d48" }}></i>
                      <span>
                        <strong>Local:</strong> {ev.local}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <i className="ti ti-users" style={{ color: "#16a34a" }}></i>
                      <span>
                        <strong>Público:</strong> {ev.publicoAlvo} {ev.turmaAlvo && `(${ev.turmaAlvo})`}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "12px",
                    gap: "8px"
                  }}
                >
                  <Btn
                    variant="ghost"
                    size="sm"
                    onClick={() => abrirDetalhes(ev)}
                    style={{ color: "#0284c7", fontWeight: "600", padding: "6px 10px" }}
                  >
                    <i className="ti ti-eye" style={{ marginRight: "4px" }}></i> Detalhes & Envio
                  </Btn>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <Btn
                      variant="ghost"
                      size="sm"
                      onClick={() => abrirEditar(ev)}
                      title="Editar Evento"
                      style={{ padding: "6px 8px" }}
                    >
                      <i className="ti ti-pencil" style={{ color: "#64748b" }}></i>
                    </Btn>
                    <Btn
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExcluir(ev.id)}
                      title="Excluir Evento"
                      style={{ padding: "6px 8px" }}
                    >
                      <i className="ti ti-trash" style={{ color: "#ef4444" }}></i>
                    </Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro / Edição */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? "Editar Evento Escolar" : "Agendar Novo Evento Escolar"}
        maxWidth="680px"
      >
        <form onSubmit={handleSalvar} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
              Título do Evento *
            </label>
            <Input
              required
              placeholder="Ex: Feira de Ciências e Tecnologia 2026"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                Categoria *
              </label>
              <Select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                options={CATEGORIAS.map((c) => ({ value: c, label: c }))}
              />
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                Status
              </label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                options={[
                  { value: "Confirmado", label: "Confirmado" },
                  { value: "Em Planejamento", label: "Em Planejamento" },
                  { value: "Adiado", label: "Adiado" },
                  { value: "Cancelado", label: "Cancelado" }
                ]}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                Data do Evento *
              </label>
              <Input
                type="date"
                required
                value={form.dataEvento}
                onChange={(e) => setForm({ ...form, dataEvento: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                Hora Início
              </label>
              <Input
                type="time"
                value={form.horaInicio}
                onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                Hora Término
              </label>
              <Input
                type="time"
                value={form.horaFim}
                onChange={(e) => setForm({ ...form, horaFim: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                Local do Evento *
              </label>
              <Input
                required
                placeholder="Ex: Ginásio Poliesportivo / Pátio"
                value={form.local}
                onChange={(e) => setForm({ ...form, local: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                Público Alvo
              </label>
              <Select
                value={form.publicoAlvo}
                onChange={(e) => setForm({ ...form, publicoAlvo: e.target.value })}
                options={PUBLICOS.map((p) => ({ value: p, label: p }))}
              />
            </div>
          </div>

          {form.publicoAlvo === "Turma Específica" && (
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
                Selecione a Turma *
              </label>
              <Select
                value={form.turmaAlvo}
                onChange={(e) => setForm({ ...form, turmaAlvo: e.target.value })}
                options={[
                  { value: "", label: "-- Selecione a Turma --" },
                  ...turmas.map((t) => ({ value: t.nome || t.id, label: t.nome || t.id }))
                ]}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "6px" }}>
              Descrição & Programação
            </label>
            <textarea
              rows={4}
              placeholder="Descreva os objetivos do evento, atividades previstas, apresentações e orientações para a comunidade..."
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px",
              background: "#f1f5f9",
              borderRadius: "8px"
            }}
          >
            <input
              type="checkbox"
              id="abertoFamiliaCheck"
              checked={form.abertoFamilia}
              onChange={(e) => setForm({ ...form, abertoFamilia: e.target.checked })}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <label htmlFor="abertoFamiliaCheck" style={{ fontSize: "14px", color: "#334155", cursor: "pointer", fontWeight: "500" }}>
              Evento aberto com convite e incentivo à presença das famílias e responsáveis
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <Btn variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Btn>
            <Btn variant="primary" type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : isEditing ? "Atualizar Evento" : "Cadastrar Evento"}
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Modal de Detalhes, Divulgação e WhatsApp */}
      {selectedEvento && (
        <Modal
          isOpen={modalDetalhesOpen}
          onClose={() => setModalDetalhesOpen(false)}
          title={`Detalhes do Evento: ${selectedEvento.titulo}`}
          maxWidth="640px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                border: "1px solid #bbf7d0",
                padding: "16px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "14px"
              }}
            >
              <div
                style={{
                  background: "#22c55e",
                  color: "#fff",
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}
              >
                <i className="ti ti-brand-whatsapp"></i>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: "0 0 4px 0", color: "#15803d", fontSize: "15px", fontWeight: "700" }}>
                  Divulgação Rápida via WhatsApp
                </h4>
                <p style={{ margin: 0, fontSize: "13px", color: "#166534" }}>
                  Copie o convite formatado com emojis para enviar aos grupos de mães, pais e responsáveis.
                </p>
              </div>
              <Btn
                variant="primary"
                onClick={() => copiarWhatsApp(selectedEvento)}
                style={{ background: "#16a34a", borderColor: "#16a34a" }}
              >
                <i className="ti ti-copy" style={{ marginRight: "6px" }}></i>
                {copiado ? "Copiado! ✓" : "Copiar Texto"}
              </Btn>
            </div>

            {copiado && (
              <Alert type="success">
                Texto do convite copiado para a área de transferência! Cole no WhatsApp Web ou aplicativo.
              </Alert>
            )}

            <div
              style={{
                background: "#0f172a",
                color: "#e2e8f0",
                padding: "16px",
                borderRadius: "10px",
                fontFamily: "monospace",
                fontSize: "13px",
                whiteHeight: "1.5",
                whiteSpace: "pre-wrap",
                maxHeight: "220px",
                overflowY: "auto"
              }}
            >
              {gerarTextoWhatsApp(selectedEvento)}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid #e2e8f0" }}>
              <Btn variant="outline" onClick={() => imprimirConvite(selectedEvento)}>
                <i className="ti ti-printer" style={{ marginRight: "6px" }}></i>
                Imprimir Convite / Cartaz
              </Btn>

              <Btn variant="secondary" onClick={() => setModalDetalhesOpen(false)}>
                Fechar
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
