import { useState, useMemo } from "react";
import { Card, Btn, Modal, Input, Select, Badge, EmptyState, Alert } from "../../../components/ui";
import { addAlunoTransporte, updateAlunoTransporte, deleteAlunoTransporte } from "../../../services/transporteService";

export default function AlunosTransporte({
  alunosTransporte = [],
  alunosEscola = [],
  rotas = [],
  pontos = [],
  escolaId,
  onReload
}) {
  const [busca, setBusca] = useState("");
  const [filtroRota, setFiltroRota] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [alunoEditando, setAlunoEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    alunoId: "",
    nomeAluno: "",
    turma: "",
    rotaId: "",
    pontoId: "",
    turno: "Manhã",
    responsavel: "",
    telefoneContato: "",
    necessidadeEspecial: "Nenhuma",
    status: "Ativo",
    observacoes: ""
  });

  const abrirNovo = () => {
    setAlunoEditando(null);
    setForm({
      alunoId: "",
      nomeAluno: "",
      turma: "",
      rotaId: rotas[0]?.id || "",
      pontoId: pontos[0]?.id || "",
      turno: "Manhã",
      responsavel: "",
      telefoneContato: "",
      necessidadeEspecial: "Nenhuma",
      status: "Ativo",
      observacoes: ""
    });
    setErro("");
    setModalAberto(true);
  };

  const abrirEditar = (item) => {
    setAlunoEditando(item);
    setForm({
      alunoId: item.alunoId || "",
      nomeAluno: item.nomeAluno || "",
      turma: item.turma || "",
      rotaId: item.rotaId || "",
      pontoId: item.pontoId || "",
      turno: item.turno || "Manhã",
      responsavel: item.responsavel || "",
      telefoneContato: item.telefoneContato || "",
      necessidadeEspecial: item.necessidadeEspecial || "Nenhuma",
      status: item.status || "Ativo",
      observacoes: item.observacoes || ""
    });
    setErro("");
    setModalAberto(true);
  };

  // Ao selecionar um aluno já existente na base da escola, autopreenche nome, turma e responsável
  const handleSelecionarAlunoEscola = (id) => {
    const al = alunosEscola.find(a => a.id === id);
    if (al) {
      setForm(prev => ({
        ...prev,
        alunoId: al.id,
        nomeAluno: al.nome || "",
        turma: al.turma || al.ano || "",
        responsavel: al.responsavel || al.filiacao || "",
        telefoneContato: al.telefone || al.celular || ""
      }));
    } else {
      setForm(prev => ({ ...prev, alunoId: id }));
    }
  };

  const handleSalvar = async () => {
    if (!form.nomeAluno.trim()) {
      setErro("Informe o nome do aluno.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const rotaObj = rotas.find(r => r.id === form.rotaId);
      const pontoObj = pontos.find(p => p.id === form.pontoId);

      const payload = {
        ...form,
        rotaNome: rotaObj ? rotaObj.nome : "",
        pontoNome: pontoObj ? pontoObj.nome : "",
        dataVinculo: alunoEditando?.dataVinculo || new Date().toISOString().split("T")[0]
      };

      if (alunoEditando) {
        await updateAlunoTransporte(alunoEditando.id, payload);
      } else {
        await addAlunoTransporte(payload, escolaId);
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
    if (window.confirm(`Deseja realmente desvincular o(a) aluno(a) ${nome} do transporte?`)) {
      try {
        await deleteAlunoTransporte(id);
        onReload();
      } catch (e) {
        alert("Erro ao excluir: " + e.message);
      }
    }
  };

  const alunosFiltrados = useMemo(() => {
    return alunosTransporte.filter(a => {
      const matchBusca = (a.nomeAluno || "").toLowerCase().includes(busca.toLowerCase()) ||
        (a.turma || "").toLowerCase().includes(busca.toLowerCase()) ||
        (a.responsavel || "").toLowerCase().includes(busca.toLowerCase());

      const matchRota = !filtroRota || a.rotaId === filtroRota;
      const matchTurno = !filtroTurno || a.turno === filtroTurno;

      return matchBusca && matchRota && matchTurno;
    });
  }, [alunosTransporte, busca, filtroRota, filtroTurno]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Filtros e Ações */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flex: 1 }}>
          <div style={{ position: "relative", minWidth: 260 }}>
            <input
              type="text"
              placeholder="Buscar por nome do aluno, turma ou responsável..."
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

          <select
            value={filtroRota}
            onChange={(e) => setFiltroRota(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, background: "white" }}
          >
            <option value="">Todas as Rotas</option>
            {rotas.map(r => (
              <option key={r.id} value={r.id}>{r.nome}</option>
            ))}
          </select>

          <select
            value={filtroTurno}
            onChange={(e) => setFiltroTurno(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, background: "white" }}
          >
            <option value="">Todos os Turnos</option>
            <option value="Manhã">Manhã</option>
            <option value="Tarde">Tarde</option>
            <option value="Noite">Noite</option>
            <option value="Integral">Integral</option>
          </select>
        </div>

        <Btn variant="primary" onClick={abrirNovo}>
          <i className="ti ti-user-plus" /> Vincular Aluno ao Transporte
        </Btn>
      </div>

      {/* Tabela de Alunos Transportados */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {alunosFiltrados.length === 0 ? (
          <EmptyState icon="users" texto="Nenhum aluno transportado encontrado com os filtros selecionados." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "12px 16px" }}>Estudante</th>
                  <th style={{ padding: "12px 16px" }}>Turma / Turno</th>
                  <th style={{ padding: "12px 16px" }}>Rota / Linha</th>
                  <th style={{ padding: "12px 16px" }}>Ponto de Embarque</th>
                  <th style={{ padding: "12px 16px" }}>Responsável / Contato</th>
                  <th style={{ padding: "12px 16px" }}>Necessidades</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {alunosFiltrados.map((aluno) => (
                  <tr key={aluno.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{aluno.nomeAluno}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontWeight: 500 }}>{aluno.turma || "-"}</span>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{aluno.turno}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge color="blue">{aluno.rotaNome || "Sem rota"}</Badge>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#334155" }}>
                        <i className="ti ti-map-pin" style={{ color: "#ef4444" }} />
                        {aluno.pontoNome || "Ponto Principal"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div>{aluno.responsavel || "-"}</div>
                      <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 500 }}>{aluno.telefoneContato || "-"}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {aluno.necessidadeEspecial && aluno.necessidadeEspecial !== "Nenhuma" ? (
                        <Badge color="red">{aluno.necessidadeEspecial}</Badge>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge color={aluno.status === "Ativo" ? "green" : aluno.status === "Suspenso" ? "amber" : "gray"}>
                        {aluno.status || "Ativo"}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                        <Btn onClick={() => abrirEditar(aluno)} style={{ padding: "4px 8px", fontSize: 12 }}>
                          <i className="ti ti-edit" />
                        </Btn>
                        <Btn variant="danger" onClick={() => handleExcluir(aluno.id, aluno.nomeAluno)} style={{ padding: "4px 8px", fontSize: 12 }}>
                          <i className="ti ti-trash" />
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Cadastro / Edição de Aluno no Transporte */}
      {modalAberto && (
        <Modal
          titulo={alunoEditando ? "Editar Vínculo de Transporte" : "Vincular Aluno ao Transporte Escolar"}
          onClose={() => setModalAberto(false)}
          onSave={handleSalvar}
          salvando={salvando}
          larguraMax={620}
        >
          {erro && <Alert tipo="error">{erro}</Alert>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {!alunoEditando && alunosEscola.length > 0 && (
              <Select
                label="Selecionar Aluno da Base da Escola (Preenchimento Automático)"
                value={form.alunoId}
                onChange={(e) => handleSelecionarAlunoEscola(e.target.value)}
              >
                <option value="">Selecione para autopreencher ou digite manualmente abaixo...</option>
                {alunosEscola.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.nome} — {a.turma || a.ano || ""}
                  </option>
                ))}
              </Select>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <Input
                label="Nome Completo do Estudante *"
                placeholder="Ex: Lucas Gabriel dos Santos"
                value={form.nomeAluno}
                onChange={(e) => setForm({ ...form, nomeAluno: e.target.value })}
              />
              <Input
                label="Turma / Série"
                placeholder="Ex: 5º Ano B"
                value={form.turma}
                onChange={(e) => setForm({ ...form, turma: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select
                label="Rota / Linha de Transporte *"
                value={form.rotaId}
                onChange={(e) => setForm({ ...form, rotaId: e.target.value })}
              >
                <option value="">Selecione uma rota...</option>
                {rotas.map(r => (
                  <option key={r.id} value={r.id}>{r.nome}</option>
                ))}
              </Select>

              <Select
                label="Ponto de Embarque / Parada"
                value={form.pontoId}
                onChange={(e) => setForm({ ...form, pontoId: e.target.value })}
              >
                <option value="">Selecione o ponto...</option>
                {pontos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} {p.horarioIda ? `(${p.horarioIda})` : ""}</option>
                ))}
              </Select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select
                label="Turno de Transporte"
                value={form.turno}
                onChange={(e) => setForm({ ...form, turno: e.target.value })}
              >
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
                <option value="Integral">Integral</option>
              </Select>

              <Select
                label="Status no Transporte"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Ativo">Ativo (Utilizando o transporte)</option>
                <option value="Suspenso">Suspenso Temporariamente</option>
                <option value="Desistente">Desistente / Inativo</option>
              </Select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Nome do Responsável Legal"
                placeholder="Ex: Maria das Dores dos Santos"
                value={form.responsavel}
                onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
              />
              <Input
                label="Telefone / Contato de Emergência *"
                placeholder="(82) 99999-9999"
                value={form.telefoneContato}
                onChange={(e) => setForm({ ...form, telefoneContato: e.target.value })}
              />
            </div>

            <Select
              label="Necessidade Especial / Acessibilidade (PCD)"
              value={form.necessidadeEspecial}
              onChange={(e) => setForm({ ...form, necessidadeEspecial: e.target.value })}
            >
              <option value="Nenhuma">Nenhuma</option>
              <option value="Cadeirante (Mobilidade Reduzida)">Cadeirante (Mobilidade Reduzida)</option>
              <option value="Deficiência Visual">Deficiência Visual</option>
              <option value="Deficiência Auditiva">Deficiência Auditiva</option>
              <option value="Transtorno do Espectro Autista (TEA)">Transtorno do Espectro Autista (TEA)</option>
              <option value="Outra necessidade especial">Outra necessidade especial</option>
            </Select>

            <Input
              label="Observações Adicionais"
              placeholder="Ex: Embarca junto com o irmão mais novo."
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
