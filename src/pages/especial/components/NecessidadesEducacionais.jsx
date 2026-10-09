import { useState, useMemo } from "react";
import { Card, Btn, Modal, Input, Select, Badge, EmptyState, Alert } from "../../../components/ui";
import { addNecessidadeEducacional, updateNecessidadeEducacional, deleteNecessidadeEducacional } from "../../../services/educacaoEspecialService";

export default function NecessidadesEducacionais({
  necessidades = [],
  alunos = [],
  escolaId,
  onReload
}) {
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    alunoId: "",
    alunoNome: "",
    turma: "",
    barreirasIdentificadas: "",
    adaptacoesAvaliativas: "Tempo adicional de 30% e prova com enunciados simplificados",
    recursosTecnologiaAssistiva: "Prancha de CAA e apoio visual",
    acessibilidadeFisica: "Mobiliário acessível na sala regular",
    orientacoesProfessores: ""
  });

  const abrirNovo = () => {
    setItemEditando(null);
    const alunoPadrao = alunos[0];
    setForm({
      alunoId: alunoPadrao?.id || "",
      alunoNome: alunoPadrao?.nomeAluno || "",
      turma: alunoPadrao?.turmaRegular || "",
      barreirasIdentificadas: "Comunicação verbal restrita e sobrecarga a ruídos intensos",
      adaptacoesAvaliativas: "Tempo adicional de 30% em avaliações e fracionamento de provas em etapas",
      recursosTecnologiaAssistiva: "Prancha de Comunicação Aumentativa e Alternativa (CAA / PECS)",
      acessibilidadeFisica: "Fones abafadores acústicos e cadeira próxima à mesa do professor",
      orientacoesProfessores: "Priorizar comandos curtos com apoio pictográfico e permitir pausas sensoriais."
    });
    setErro("");
    setModalAberto(true);
  };

  const abrirEditar = (item) => {
    setItemEditando(item);
    setForm({
      alunoId: item.alunoId || "",
      alunoNome: item.alunoNome || "",
      turma: item.turma || "",
      barreirasIdentificadas: item.barreirasIdentificadas || "",
      adaptacoesAvaliativas: item.adaptacoesAvaliativas || "",
      recursosTecnologiaAssistiva: item.recursosTecnologiaAssistiva || "",
      acessibilidadeFisica: item.acessibilidadeFisica || "",
      orientacoesProfessores: item.orientacoesProfessores || ""
    });
    setErro("");
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    if (!form.alunoNome.trim()) {
      setErro("Selecione o estudante.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const payload = { ...form };

      if (itemEditando) {
        await updateNecessidadeEducacional(itemEditando.id, payload);
      } else {
        await addNecessidadeEducacional(payload, escolaId);
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
    if (window.confirm(`Deseja excluir o registro de necessidades de ${nome}?`)) {
      try {
        await deleteNecessidadeEducacional(id);
        onReload();
      } catch (e) {
        alert("Erro ao excluir: " + e.message);
      }
    }
  };

  const necessidadesFiltradas = useMemo(() => {
    return necessidades.filter(n => {
      const termo = busca.toLowerCase();
      return (
        (n.alunoNome || "").toLowerCase().includes(termo) ||
        (n.barreirasIdentificadas || "").toLowerCase().includes(termo) ||
        (n.recursosTecnologiaAssistiva || "").toLowerCase().includes(termo)
      );
    });
  }, [necessidades, busca]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Barra de Filtros e Cadastro */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, maxWidth: 460 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              placeholder="Buscar por estudante, barreira ou recurso assistivo..."
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
          <i className="ti ti-plus" /> Mapear Necessidade Educacional
        </Btn>
      </div>

      {/* Grid de Necessidades Educacionais Mapeadas */}
      {necessidadesFiltradas.length === 0 ? (
        <EmptyState icon="accessible" texto="Nenhum mapeamento de necessidades educacionais cadastrado." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 18 }}>
          {necessidadesFiltradas.map((item) => (
            <Card key={item.id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 20 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1f2937" }}>
                      {item.alunoNome}
                    </h4>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                      Turma: <strong>{item.turma || "Sala Regular"}</strong>
                    </div>
                  </div>
                  <Badge color="blue">Acessibilidade Mapeada</Badge>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "#334155", background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                  <div>
                    <strong style={{ color: "#991b1b" }}>Barreiras de Aprendizagem:</strong>
                    <div>{item.barreirasIdentificadas || "Não informadas"}</div>
                  </div>

                  <div>
                    <strong style={{ color: "#047857" }}>Tecnologia Assistiva / CAA:</strong>
                    <div>{item.recursosTecnologiaAssistiva || "Recursos visuais adaptados"}</div>
                  </div>

                  <div>
                    <strong style={{ color: "#1e40af" }}>Adaptações em Provas & Avaliações:</strong>
                    <div>{item.adaptacoesAvaliativas || "Tempo adicional e prova ilustrada"}</div>
                  </div>

                  {item.orientacoesProfessores && (
                    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 6, fontStyle: "italic", color: "#64748b" }}>
                      <strong>Dica Pedagógica:</strong> {item.orientacoesProfessores}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 14, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                <Btn onClick={() => abrirEditar(item)} style={{ padding: "6px 10px", fontSize: 12 }}>
                  <i className="ti ti-edit" /> Editar
                </Btn>
                <Btn variant="danger" onClick={() => handleExcluir(item.id, item.alunoNome)} style={{ padding: "6px 10px", fontSize: 12 }}>
                  <i className="ti ti-trash" />
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Cadastro/Edição de Necessidade */}
      {modalAberto && (
        <Modal
          titulo={itemEditando ? "Editar Mapeamento de Necessidades" : "Mapear Necessidades Educacionais & Acessibilidade"}
          onClose={() => setModalAberto(false)}
          onSave={handleSalvar}
          salvando={salvando}
          larguraMax={640}
        >
          {erro && <Alert tipo="error">{erro}</Alert>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Select
              label="Selecione o Estudante *"
              value={form.alunoId}
              onChange={(e) => {
                const aId = e.target.value;
                const aObj = alunos.find(a => a.id === aId);
                setForm({
                  ...form,
                  alunoId: aId,
                  alunoNome: aObj ? aObj.nomeAluno : form.alunoNome,
                  turma: aObj ? aObj.turmaRegular : form.turma
                });
              }}
            >
              <option value="">Selecione o aluno do AEE...</option>
              {alunos.map(a => (
                <option key={a.id} value={a.id}>{a.nomeAluno} — {a.diagnosticoPrincipal}</option>
              ))}
            </Select>

            <Input
              label="Barreiras Identificadas no Ambiente Escolar *"
              placeholder="Ex: Comunicação não-verbal, dificuldade motora para escrita e sensibilidade a ruídos"
              value={form.barreirasIdentificadas}
              onChange={(e) => setForm({ ...form, barreirasIdentificadas: e.target.value })}
            />

            <Input
              label="Recursos de Tecnologia Assistiva & Comunicação Alternativa (CAA)"
              placeholder="Ex: Prancha de comunicação PECS, engrossadores de lápis e tesoura com mola"
              value={form.recursosTecnologiaAssistiva}
              onChange={(e) => setForm({ ...form, recursosTecnologiaAssistiva: e.target.value })}
            />

            <Input
              label="Adaptações Avaliativas (Provas e Trabalhos)"
              placeholder="Ex: Tempo adicional de 30%, prova em fonte 24pt, enunciados ilustrados e leitor de apoio"
              value={form.adaptacoesAvaliativas}
              onChange={(e) => setForm({ ...form, adaptacoesAvaliativas: e.target.value })}
            />

            <Input
              label="Acessibilidade Arquitetônica e Mobiliário"
              placeholder="Ex: Mesa adaptada para cadeira de rodas, rampa de acesso e fones abafadores acústicos"
              value={form.acessibilidadeFisica}
              onChange={(e) => setForm({ ...form, acessibilidadeFisica: e.target.value })}
            />

            <Input
              label="Orientações aos Professores da Sala Regular"
              placeholder="Ex: Utilizar pistas visuais, avisar antes de transições de atividades e incentivar a interação com os pares."
              value={form.orientacoesProfessores}
              onChange={(e) => setForm({ ...form, orientacoesProfessores: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
