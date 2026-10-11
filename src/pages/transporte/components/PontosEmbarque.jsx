import { useState, useMemo } from "react";
import { Card, Btn, Modal, Input, Select, Badge, EmptyState, Alert } from "../../../components/ui";
import { addPontoEmbarque, updatePontoEmbarque, deletePontoEmbarque } from "../../../services/transporteService";

export default function PontosEmbarque({
  pontos = [],
  rotas = [],
  alunos = [],
  escolaId,
  onReload
}) {
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [pontoEditando, setPontoEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    nome: "",
    endereco: "",
    referencia: "",
    horarioIda: "",
    horarioVolta: "",
    tipoParada: "Abrigo Coberto",
    observacoes: ""
  });

  const abrirNovo = () => {
    setPontoEditando(null);
    setForm({
      nome: "",
      endereco: "",
      referencia: "",
      horarioIda: "06:30",
      horarioVolta: "12:30",
      tipoParada: "Abrigo Coberto",
      observacoes: ""
    });
    setErro("");
    setModalAberto(true);
  };

  const abrirEditar = (p) => {
    setPontoEditando(p);
    setForm({
      nome: p.nome || "",
      endereco: p.endereco || "",
      referencia: p.referencia || "",
      horarioIda: p.horarioIda || "",
      horarioVolta: p.horarioVolta || "",
      tipoParada: p.tipoParada || "Abrigo Coberto",
      observacoes: p.observacoes || ""
    });
    setErro("");
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    if (!form.nome.trim()) {
      setErro("Informe o nome do ponto de embarque.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const payload = { ...form };

      if (pontoEditando) {
        await updatePontoEmbarque(pontoEditando.id, payload);
      } else {
        await addPontoEmbarque(payload, escolaId);
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
    if (window.confirm(`Deseja realmente excluir o ponto "${nome}"?`)) {
      try {
        await deletePontoEmbarque(id);
        onReload();
      } catch (e) {
        alert("Erro ao excluir: " + e.message);
      }
    }
  };

  const pontosFiltrados = useMemo(() => {
    return pontos.filter(p => {
      const termo = busca.toLowerCase();
      return (
        (p.nome || "").toLowerCase().includes(termo) ||
        (p.endereco || "").toLowerCase().includes(termo) ||
        (p.referencia || "").toLowerCase().includes(termo)
      );
    });
  }, [pontos, busca]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Barra de Busca e Cadastro */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, maxWidth: 460 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              placeholder="Buscar ponto de parada por nome, endereço ou referência..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 38px",
                borderRadius: 10,
                border: "1px solid #2c3b52",
                background: "#1e293b",
                color: "#f8fafc",
                fontSize: 13,
                outline: "none"
              }}
            />
            <i className="ti ti-search" style={{ position: "absolute", left: 12, top: 12, color: "#64748b" }} />
          </div>
        </div>

        <Btn variant="primary" onClick={abrirNovo}>
          <i className="ti ti-plus" /> Cadastrar Ponto de Embarque
        </Btn>
      </div>

      {/* Grid de Pontos de Embarque */}
      {pontosFiltrados.length === 0 ? (
        <EmptyState icon="map-pin" texto="Nenhum ponto de embarque cadastrado." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
          {pontosFiltrados.map((ponto) => {
            const rotasQuePassam = rotas.filter(r => (r.pontosIds || []).includes(ponto.id));
            const alunosQueEmbarcam = alunos.filter(a => a.pontoId === ponto.id && (a.status === "Ativo" || !a.status));

            return (
              <Card key={ponto.id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 20, background: "#1e293b", border: "1px solid #2c3b52" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "rgba(59, 130, 246, 0.15)",
                        color: "#60a5fa",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22
                      }}>
                        <i className="ti ti-map-pin" />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#ffffff" }}>
                          {ponto.nome}
                        </h4>
                        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                          {ponto.tipoParada || "Ponto de Parada"}
                        </div>
                      </div>
                    </div>

                    <Badge color="blue">
                      {alunosQueEmbarcam.length} alunos
                    </Badge>
                  </div>

                  {/* Informações de Localização */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 12, color: "#cbd5e1", background: "#161f2e", padding: "12px", borderRadius: 10, border: "1px solid #243144", marginTop: 10 }}>
                    <div>
                      <strong style={{ color: "#94a3b8" }}>Endereço / Vicinal:</strong> {ponto.endereco || "Não informado"}
                    </div>
                    {ponto.referencia && (
                      <div>
                        <strong style={{ color: "#94a3b8" }}>Ponto de Ref.:</strong> {ponto.referencia}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 16, marginTop: 4, borderTop: "1px solid #243144", paddingTop: 8 }}>
                      <span><i className="ti ti-clock" style={{ color: "#60a5fa" }} /> Ida: <strong style={{ color: "#ffffff" }}>{ponto.horarioIda || "-"}</strong></span>
                      <span><i className="ti ti-clock" style={{ color: "#fbbf24" }} /> Volta: <strong style={{ color: "#ffffff" }}>{ponto.horarioVolta || "-"}</strong></span>
                    </div>
                  </div>

                  {/* Rotas que atendem o ponto */}
                  {rotasQuePassam.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Linhas que passam neste ponto:</span>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                        {rotasQuePassam.map(r => (
                          <Badge key={r.id} color="green">{r.nome}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 16, paddingTop: 12, borderTop: "1px solid #2c3b52" }}>
                  <Btn onClick={() => abrirEditar(ponto)} style={{ padding: "6px 12px", fontSize: 12 }}>
                    <i className="ti ti-edit" /> Editar
                  </Btn>
                  <Btn variant="danger" onClick={() => handleExcluir(ponto.id, ponto.nome)} style={{ padding: "6px 10px", fontSize: 12 }}>
                    <i className="ti ti-trash" />
                  </Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro / Edição de Ponto */}
      {modalAberto && (
        <Modal
          titulo={pontoEditando ? "Editar Ponto de Embarque" : "Cadastrar Ponto de Embarque / Parada"}
          onClose={() => setModalAberto(false)}
          onSave={handleSalvar}
          salvando={salvando}
          larguraMax={560}
        >
          {erro && <Alert tipo="error">{erro}</Alert>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input
              label="Nome do Ponto / Localidade *"
              placeholder="Ex: Entrada do Sítio Barra / Praça Central"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />

            <Input
              label="Endereço Completo / Estrada"
              placeholder="Ex: Estrada Vicinal KM 4, Sítio Barra"
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
            />

            <Input
              label="Ponto de Referência"
              placeholder="Ex: Em frente ao Armazém do Zé / Ao lado da Capela"
              value={form.referencia}
              onChange={(e) => setForm({ ...form, referencia: e.target.value })}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Input
                label="Horário Previsto (Ida)"
                type="time"
                value={form.horarioIda}
                onChange={(e) => setForm({ ...form, horarioIda: e.target.value })}
              />
              <Input
                label="Horário Previsto (Volta)"
                type="time"
                value={form.horarioVolta}
                onChange={(e) => setForm({ ...form, horarioVolta: e.target.value })}
              />
              <Select
                label="Estrutura da Parada"
                value={form.tipoParada}
                onChange={(e) => setForm({ ...form, tipoParada: e.target.value })}
              >
                <option value="Abrigo Coberto">Abrigo Coberto</option>
                <option value="Praça Pública">Praça Pública</option>
                <option value="Ponto Sinalizado">Ponto Sinalizado</option>
                <option value="Porteira / Residência">Porteira / Residência</option>
                <option value="Posto de Saúde">Posto de Saúde</option>
              </Select>
            </div>

            <Input
              label="Observações Adicionais"
              placeholder="Ex: Ponto com fácil manobra para ônibus e área coberta."
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
