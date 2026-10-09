import { useState, useMemo } from "react";
import { Card, Btn, Modal, Input, Select, Badge, EmptyState, Alert } from "../../../components/ui";
import { addMotorista, updateMotorista, deleteMotorista } from "../../../services/transporteService";

export default function MotoristasTransporte({
  motoristas = [],
  rotas = [],
  escolaId,
  onReload
}) {
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [motoristaEditando, setMotoristaEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    cnh: "",
    categoriaCnh: "D",
    validadeCnh: "",
    cursoTransporte: "",
    tipo: "Motorista",
    status: "Ativo",
    experiencia: ""
  });

  const abrirNovo = () => {
    setMotoristaEditando(null);
    setForm({
      nome: "",
      cpf: "",
      telefone: "",
      cnh: "",
      categoriaCnh: "D",
      validadeCnh: "",
      cursoTransporte: "Curso de Condutor de Transporte Escolar (CONTRAN)",
      tipo: "Motorista",
      status: "Ativo",
      experiencia: ""
    });
    setErro("");
    setModalAberto(true);
  };

  const abrirEditar = (m) => {
    setMotoristaEditando(m);
    setForm({
      nome: m.nome || "",
      cpf: m.cpf || "",
      telefone: m.telefone || "",
      cnh: m.cnh || "",
      categoriaCnh: m.categoriaCnh || "D",
      validadeCnh: m.validadeCnh || "",
      cursoTransporte: m.cursoTransporte || "",
      tipo: m.tipo || "Motorista",
      status: m.status || "Ativo",
      experiencia: m.experiencia || ""
    });
    setErro("");
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    if (!form.nome.trim()) {
      setErro("Informe o nome do profissional.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const payload = { ...form };

      if (motoristaEditando) {
        await updateMotorista(motoristaEditando.id, payload);
      } else {
        await addMotorista(payload, escolaId);
      }

      setModalAberto(false);
      onReload();
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id, nome) => {
    if (window.confirm(`Deseja realmente remover o registro de ${nome}?`)) {
      try {
        await deleteMotorista(id);
        onReload();
      } catch (e) {
        alert("Erro ao excluir: " + e.message);
      }
    }
  };

  const motoristasFiltrados = useMemo(() => {
    return motoristas.filter(m => {
      const termo = busca.toLowerCase();
      return (
        (m.nome || "").toLowerCase().includes(termo) ||
        (m.cpf || "").includes(termo) ||
        (m.cnh || "").includes(termo) ||
        (m.tipo || "").toLowerCase().includes(termo)
      );
    });
  }, [motoristas, busca]);

  const hoje = new Date();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Barra Superior */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, maxWidth: 460 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              placeholder="Buscar motorista ou monitor por nome, CPF ou CNH..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 13,
                outline: "none"
              }}
            />
            <i className="ti ti-search" style={{ position: "absolute", left: 12, top: 11, color: "#9ca3af" }} />
          </div>
        </div>

        <Btn variant="primary" onClick={abrirNovo}>
          <i className="ti ti-plus" /> Cadastrar Motorista / Monitor
        </Btn>
      </div>

      {/* Grid de Profissionais */}
      {motoristasFiltrados.length === 0 ? (
        <EmptyState icon="steering-wheel" texto="Nenhum motorista ou monitor cadastrado." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 18 }}>
          {motoristasFiltrados.map((m) => {
            const rotasAtendidas = rotas.filter(r => r.motoristaId === m.id || r.monitorId === m.id);
            const cnhVencida = m.validadeCnh && m.validadeCnh !== "-" && new Date(m.validadeCnh) < hoje;

            return (
              <Card key={m.id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 20 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: m.tipo === "Monitor(a)" ? "#fdf2f8" : "#eff6ff",
                        color: m.tipo === "Monitor(a)" ? "#db2777" : "#1d4ed8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        fontWeight: "bold"
                      }}>
                        <i className={`ti ti-${m.tipo === "Monitor(a)" ? "user-heart" : "steering-wheel"}`} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1f2937" }}>
                          {m.nome}
                        </h4>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                          {m.tipo || "Motorista"} · CPF: {m.cpf || "Não informado"}
                        </div>
                      </div>
                    </div>

                    <Badge color={m.status === "Ativo" ? "green" : m.status === "Férias" ? "blue" : "gray"}>
                      {m.status || "Ativo"}
                    </Badge>
                  </div>

                  {/* Informações de Habilitação & Cursos */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "#4b5563", background: "#f8fafc", padding: "12px", borderRadius: 8, marginTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span><i className="ti ti-phone" style={{ marginRight: 4 }} /> Telefone:</span>
                      <strong style={{ color: "#1f2937" }}>{m.telefone || "Não informado"}</strong>
                    </div>

                    {m.tipo !== "Monitor(a)" && (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span><i className="ti ti-license" style={{ marginRight: 4 }} /> CNH (Cat. {m.categoriaCnh}):</span>
                          <strong style={{ color: "#1f2937" }}>{m.cnh || "-"}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span><i className="ti ti-calendar" style={{ marginRight: 4 }} /> Validade da CNH:</span>
                          <strong style={{ color: cnhVencida ? "#dc2626" : "#1f2937" }}>
                            {m.validadeCnh ? new Date(m.validadeCnh + "T00:00:00").toLocaleDateString("pt-BR") : "Não inf."}
                            {cnhVencida && " ⚠️ Vencida"}
                          </strong>
                        </div>
                      </>
                    )}

                    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 6, fontSize: 11, color: "#64748b" }}>
                      <strong>Capacitação:</strong> {m.cursoTransporte || "Conforme diretrizes municipais"}
                    </div>
                  </div>

                  {/* Rotas Vinculadas */}
                  {rotasAtendidas.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Linha / Rota Atribuída:</span>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                        {rotasAtendidas.map(r => (
                          <Badge key={r.id} color="blue">{r.nome}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 14, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                  <Btn onClick={() => abrirEditar(m)} style={{ padding: "6px 10px", fontSize: 12 }}>
                    <i className="ti ti-edit" /> Editar
                  </Btn>
                  <Btn variant="danger" onClick={() => handleExcluir(m.id, m.nome)} style={{ padding: "6px 10px", fontSize: 12 }}>
                    <i className="ti ti-trash" />
                  </Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro/Edição de Motorista */}
      {modalAberto && (
        <Modal
          titulo={motoristaEditando ? "Editar Profissional do Transporte" : "Cadastrar Motorista / Monitor(a)"}
          onClose={() => setModalAberto(false)}
          onSave={handleSalvar}
          salvando={salvando}
          larguraMax={580}
        >
          {erro && <Alert tipo="error">{erro}</Alert>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <Input
                label="Nome Completo *"
                placeholder="Ex: Carlos Eduardo da Silva"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
              <Select
                label="Função / Cargo"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                <option value="Motorista">Motorista Titular</option>
                <option value="Monitor(a)">Monitor(a) de Transporte</option>
                <option value="Motorista Substituto">Motorista Substituto / Reserva</option>
              </Select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="CPF"
                placeholder="000.000.000-00"
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })}
              />
              <Input
                label="Telefone / WhatsApp *"
                placeholder="(82) 99999-9999"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
            </div>

            {form.tipo !== "Monitor(a)" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <Input
                  label="Número do Registro CNH"
                  placeholder="Ex: 04829103940"
                  value={form.cnh}
                  onChange={(e) => setForm({ ...form, cnh: e.target.value })}
                />
                <Select
                  label="Categoria CNH"
                  value={form.categoriaCnh}
                  onChange={(e) => setForm({ ...form, categoriaCnh: e.target.value })}
                >
                  <option value="D">Categoria D (Exigida p/ Ônibus/Vans)</option>
                  <option value="E">Categoria E (Veículos Articulados)</option>
                  <option value="C">Categoria C</option>
                  <option value="B">Categoria B</option>
                </Select>
                <Input
                  label="Validade da CNH"
                  type="date"
                  value={form.validadeCnh}
                  onChange={(e) => setForm({ ...form, validadeCnh: e.target.value })}
                />
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <Input
                label="Curso Específico de Transporte Escolar"
                placeholder="Ex: Curso CONTRAN homologado válido até 2027"
                value={form.cursoTransporte}
                onChange={(e) => setForm({ ...form, cursoTransporte: e.target.value })}
              />
              <Select
                label="Status Atual"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Ativo">Ativo em Atividade</option>
                <option value="Férias">Em Férias</option>
                <option value="Afastado">Afastado / Licença</option>
                <option value="Inativo">Inativo</option>
              </Select>
            </div>

            <Input
              label="Experiência / Observações"
              placeholder="Ex: 8 anos em condução de escolares e rotas rurais."
              value={form.experiencia}
              onChange={(e) => setForm({ ...form, experiencia: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
