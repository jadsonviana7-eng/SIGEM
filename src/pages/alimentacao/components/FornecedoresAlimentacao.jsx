import { useState, useMemo } from "react";
import { Card, Btn, Modal, Input, Select, Badge, EmptyState, Alert } from "../../../components/ui";
import { addFornecedor, updateFornecedor, deleteFornecedor } from "../../../services/alimentacaoService";

export default function FornecedoresAlimentacao({
  fornecedores = [],
  escolaId,
  onReload
}) {
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [fornecedorEditando, setFornecedorEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    nome: "",
    tipo: "Agricultura Familiar (PNAE 30%)",
    cnpj: "",
    responsavel: "",
    telefone: "",
    email: "",
    produtosFornecidos: "",
    status: "Ativo",
    contratoNumero: ""
  });

  const abrirNovo = () => {
    setFornecedorEditando(null);
    setForm({
      nome: "",
      tipo: "Agricultura Familiar (PNAE 30%)",
      cnpj: "",
      responsavel: "",
      telefone: "",
      email: "",
      produtosFornecidos: "",
      status: "Ativo",
      contratoNumero: "Chamada Pública PNAE " + new Date().getFullYear()
    });
    setErro("");
    setModalAberto(true);
  };

  const abrirEditar = (f) => {
    setFornecedorEditando(f);
    setForm({
      nome: f.nome || "",
      tipo: f.tipo || "Agricultura Familiar (PNAE 30%)",
      cnpj: f.cnpj || "",
      responsavel: f.responsavel || "",
      telefone: f.telefone || "",
      email: f.email || "",
      produtosFornecidos: f.produtosFornecidos || "",
      status: f.status || "Ativo",
      contratoNumero: f.contratoNumero || ""
    });
    setErro("");
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    if (!form.nome.trim()) {
      setErro("Informe o nome ou razão social do fornecedor.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const payload = { ...form };

      if (fornecedorEditando) {
        await updateFornecedor(fornecedorEditando.id, payload);
      } else {
        await addFornecedor(payload, escolaId);
      }

      setModalAberto(false);
      onReload();
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar fornecedor: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id, nome) => {
    if (window.confirm(`Deseja realmente excluir o fornecedor "${nome}"?`)) {
      try {
        await deleteFornecedor(id);
        onReload();
      } catch (e) {
        alert("Erro ao excluir: " + e.message);
      }
    }
  };

  const fornecedoresFiltrados = useMemo(() => {
    return fornecedores.filter(f => {
      const termo = busca.toLowerCase();
      return (
        (f.nome || "").toLowerCase().includes(termo) ||
        (f.cnpj || "").includes(termo) ||
        (f.responsavel || "").toLowerCase().includes(termo) ||
        (f.tipo || "").toLowerCase().includes(termo)
      );
    });
  }, [fornecedores, busca]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Barra de Filtros e Cadastro */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, maxWidth: 460 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              placeholder="Buscar fornecedor por nome, CNPJ ou tipo..."
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
          <i className="ti ti-plus" /> Cadastrar Fornecedor
        </Btn>
      </div>

      {/* Grid de Fornecedores */}
      {fornecedoresFiltrados.length === 0 ? (
        <EmptyState icon="truck" texto="Nenhum fornecedor cadastrado até o momento." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 18 }}>
          {fornecedoresFiltrados.map((forn) => {
            const isFamiliar = (forn.tipo || "").toLowerCase().includes("familiar") || (forn.tipo || "").toLowerCase().includes("pnae");

            return (
              <Card key={forn.id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 20 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: isFamiliar ? "#ecfdf5" : "#eff6ff",
                        color: isFamiliar ? "#059669" : "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22
                      }}>
                        <i className={`ti ti-${isFamiliar ? "plant" : "truck"}`} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1f2937" }}>
                          {forn.nome}
                        </h4>
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                          CNPJ/CPF: {forn.cnpj || "Não informado"}
                        </div>
                      </div>
                    </div>

                    <Badge color={forn.status === "Ativo" ? "green" : "gray"}>
                      {forn.status || "Ativo"}
                    </Badge>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#4b5563", background: "#f8fafc", padding: 12, borderRadius: 8, marginTop: 10 }}>
                    <div>
                      <strong>Modalidade:</strong> <span style={{ color: isFamiliar ? "#059669" : "#1e40af", fontWeight: 600 }}>{forn.tipo}</span>
                    </div>
                    {forn.responsavel && (
                      <div>
                        <strong>Contato / Responsável:</strong> {forn.responsavel}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 14 }}>
                      <span><i className="ti ti-phone" style={{ marginRight: 4 }} /> {forn.telefone || "-"}</span>
                      <span><i className="ti ti-mail" style={{ marginRight: 4 }} /> {forn.email || "-"}</span>
                    </div>
                    {forn.produtosFornecidos && (
                      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 6, fontSize: 11, color: "#64748b" }}>
                        <strong>Gêneros:</strong> {forn.produtosFornecidos}
                      </div>
                    )}
                  </div>

                  {forn.contratoNumero && (
                    <div style={{ marginTop: 10, fontSize: 11, color: "#475569" }}>
                      <strong>Contrato / Edital:</strong> {forn.contratoNumero}
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 14, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                  <Btn onClick={() => abrirEditar(forn)} style={{ padding: "6px 10px", fontSize: 12 }}>
                    <i className="ti ti-edit" /> Editar
                  </Btn>
                  <Btn variant="danger" onClick={() => handleExcluir(forn.id, forn.nome)} style={{ padding: "6px 10px", fontSize: 12 }}>
                    <i className="ti ti-trash" />
                  </Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro/Edição de Fornecedor */}
      {modalAberto && (
        <Modal
          titulo={fornecedorEditando ? "Editar Fornecedor de Alimentos" : "Cadastrar Novo Fornecedor"}
          onClose={() => setModalAberto(false)}
          onSave={handleSalvar}
          salvando={salvando}
          larguraMax={580}
        >
          {erro && <Alert tipo="error">{erro}</Alert>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input
              label="Nome / Razão Social ou Nome do Produtor *"
              placeholder="Ex: Cooperativa de Produtores Familiares COOPAF"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
              <Select
                label="Tipo de Fornecedor"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                <option value="Agricultura Familiar (PNAE 30%)">Agricultura Familiar (PNAE 30%)</option>
                <option value="Comércio Atacadista Convencional">Comércio Atacadista Convencional</option>
                <option value="Indústria de Laticínios">Indústria de Laticínios</option>
                <option value="Frigorífico / Açougue">Frigorífico / Açougue</option>
                <option value="Panificadora / Padaria Local">Panificadora / Padaria Local</option>
              </Select>

              <Input
                label="CNPJ ou CPF (Produtor)"
                placeholder="00.000.000/0001-00"
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Nome do Representante / Contato"
                placeholder="Ex: Manoel Messias da Silva"
                value={form.responsavel}
                onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
              />
              <Input
                label="Telefone / WhatsApp"
                placeholder="(82) 99999-9999"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="E-mail"
                placeholder="contato@empresa.com.br"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                label="Nº do Contrato / Chamada Pública"
                placeholder="Ex: Contrato PNAE 04/2026"
                value={form.contratoNumero}
                onChange={(e) => setForm({ ...form, contratoNumero: e.target.value })}
              />
            </div>

            <Input
              label="Gêneros Alimentícios Fornecidos"
              placeholder="Ex: Frutas da estação, verduras, tubérculos e polpa de frutas"
              value={form.produtosFornecidos}
              onChange={(e) => setForm({ ...form, produtosFornecidos: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
