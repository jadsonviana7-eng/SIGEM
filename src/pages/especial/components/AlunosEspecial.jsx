import { useState, useMemo } from "react";
import { Card, Btn, Modal, Input, Select, Badge, EmptyState, Alert } from "../../../components/ui";
import { addAlunoEspecial, updateAlunoEspecial, deleteAlunoEspecial, registrarAcessoSigiloso } from "../../../services/educacaoEspecialService";

export default function AlunosEspecial({
  alunos = [],
  alunosEscola = [],
  profissionais = [],
  currentUser,
  escolaId,
  onReload
}) {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [alunoEditando, setAlunoEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // Modal de Prontuário Sigiloso
  const [modalProntuario, setModalProntuario] = useState(false);
  const [alunoProntuario, setAlunoProntuario] = useState(null);

  const [form, setForm] = useState({
    alunoId: "",
    nomeAluno: "",
    turmaRegular: "",
    dataNascimento: "",
    diagnosticoPrincipal: "Transtorno do Espectro Autista (TEA)",
    cid10: "CID-10: F84.0",
    temLaudoMedico: "Sim (Laudo Homologado)",
    medicoLaudo: "",
    dataLaudo: "",
    frequenciaAEE: "2x por semana (50 min/sessão)",
    professorAEEResponsavel: "",
    necessitaMediadorApoio: "Sim (Acompanhamento na sala regular)",
    profissionalApoio: "",
    recursosTecnologiaAssistiva: "",
    responsavelNome: "",
    responsavelTelefone: "",
    status: "Ativo no AEE",
    observacoesConfidenciais: ""
  });

  const abrirNovo = () => {
    setAlunoEditando(null);
    const profAEE = profissionais.find(p => p.cargo?.includes("AEE")) || profissionais[0];
    const profApoio = profissionais.find(p => p.cargo?.includes("Apoio") || p.cargo?.includes("Mediador"));

    setForm({
      alunoId: "",
      nomeAluno: "",
      turmaRegular: "",
      dataNascimento: "",
      diagnosticoPrincipal: "Transtorno do Espectro Autista (TEA)",
      cid10: "CID-10: F84.0",
      temLaudoMedico: "Sim (Laudo Homologado)",
      medicoLaudo: "",
      dataLaudo: "",
      frequenciaAEE: "2x por semana (Contraturno)",
      professorAEEResponsavel: profAEE?.nome || "",
      necessitaMediadorApoio: "Sim (Acompanhamento na sala regular)",
      profissionalApoio: profApoio?.nome || "",
      recursosTecnologiaAssistiva: "Prancha de Comunicação Alternativa (CAA) e recursos visuais",
      responsavelNome: "",
      responsavelTelefone: "",
      status: "Ativo no AEE",
      observacoesConfidenciais: ""
    });
    setErro("");
    setModalAberto(true);
  };

  const abrirEditar = (item) => {
    setAlunoEditando(item);
    setForm({
      alunoId: item.alunoId || "",
      nomeAluno: item.nomeAluno || "",
      turmaRegular: item.turmaRegular || "",
      dataNascimento: item.dataNascimento || "",
      diagnosticoPrincipal: item.diagnosticoPrincipal || "Transtorno do Espectro Autista (TEA)",
      cid10: item.cid10 || "",
      temLaudoMedico: item.temLaudoMedico || "Sim (Laudo Homologado)",
      medicoLaudo: item.medicoLaudo || "",
      dataLaudo: item.dataLaudo || "",
      frequenciaAEE: item.frequenciaAEE || "",
      professorAEEResponsavel: item.professorAEEResponsavel || "",
      necessitaMediadorApoio: item.necessitaMediadorApoio || "Não",
      profissionalApoio: item.profissionalApoio || "",
      recursosTecnologiaAssistiva: item.recursosTecnologiaAssistiva || "",
      responsavelNome: item.responsavelNome || "",
      responsavelTelefone: item.responsavelTelefone || "",
      status: item.status || "Ativo no AEE",
      observacoesConfidenciais: item.observacoesConfidenciais || ""
    });
    setErro("");
    setModalAberto(true);
  };

  const handleSelecionarAlunoEscola = (id) => {
    const al = alunosEscola.find(a => a.id === id);
    if (al) {
      setForm(prev => ({
        ...prev,
        alunoId: al.id,
        nomeAluno: al.nome || "",
        turmaRegular: al.turma || al.ano || "",
        dataNascimento: al.dataNascimento || "",
        responsavelNome: al.responsavel || al.filiacao || "",
        responsavelTelefone: al.telefone || al.celular || ""
      }));
    } else {
      setForm(prev => ({ ...prev, alunoId: id }));
    }
  };

  const handleSalvar = async () => {
    if (!form.nomeAluno.trim()) {
      setErro("Informe o nome do estudante.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const payload = { ...form };

      if (alunoEditando) {
        await updateAlunoEspecial(alunoEditando.id, payload);
      } else {
        await addAlunoEspecial(payload, escolaId);
      }

      setModalAberto(false);
      onReload();
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar cadastro de inclusão: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id, nome) => {
    if (window.confirm(`Deseja realmente remover o registro de Educação Especial do estudante ${nome}?`)) {
      try {
        await deleteAlunoEspecial(id);
        onReload();
      } catch (e) {
        alert("Erro ao excluir: " + e.message);
      }
    }
  };

  // Abrir Prontuário Sigiloso e Registrar Log de Auditoria LGPD
  const abrirProntuarioSigiloso = async (aluno) => {
    setAlunoProntuario(aluno);
    setModalProntuario(true);

    // Registra log de acesso à informação sensível
    await registrarAcessoSigiloso({
      usuarioNome: currentUser?.displayName || currentUser?.email || "Usuário Autorizado",
      usuarioEmail: currentUser?.email || "",
      usuarioPerfil: currentUser?.role || "Equipe AEE",
      acao: "Visualização de Prontuário e Laudo Médico Confidencial",
      alunoId: aluno.id,
      alunoNome: aluno.nomeAluno,
      diagnostico: aluno.diagnosticoPrincipal
    }, escolaId);
  };

  const alunosFiltrados = useMemo(() => {
    return alunos.filter(a => {
      const termo = busca.toLowerCase();
      const matchBusca = (a.nomeAluno || "").toLowerCase().includes(termo) ||
        (a.diagnosticoPrincipal || "").toLowerCase().includes(termo) ||
        (a.cid10 || "").toLowerCase().includes(termo) ||
        (a.turmaRegular || "").toLowerCase().includes(termo);

      const matchStatus = !filtroStatus || a.status === filtroStatus;
      return matchBusca && matchStatus;
    });
  }, [alunos, busca, filtroStatus]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Barra Superior */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: 520 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              placeholder="Buscar estudante por nome, diagnóstico, CID ou turma..."
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
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, background: "white" }}
          >
            <option value="">Todos os Status</option>
            <option value="Ativo no AEE">Ativo no AEE</option>
            <option value="Em Avaliação">Em Avaliação Diagnóstica</option>
            <option value="Acompanhamento Sala Regular">Acompanhamento Sala Regular</option>
            <option value="Desligado / Transferido">Desligado / Transferido</option>
          </select>
        </div>

        <Btn variant="primary" onClick={abrirNovo}>
          <i className="ti ti-user-plus" /> Cadastrar Aluno no AEE
        </Btn>
      </div>

      {/* Tabela de Alunos da Educação Especial */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {alunosFiltrados.length === 0 ? (
          <EmptyState icon="users" texto="Nenhum estudante com cadastro de Educação Especial encontrado." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "12px 16px" }}>Estudante</th>
                  <th style={{ padding: "12px 16px" }}>Turma Regular</th>
                  <th style={{ padding: "12px 16px" }}>Diagnóstico / CID</th>
                  <th style={{ padding: "12px 16px" }}>Laudo Homologado</th>
                  <th style={{ padding: "12px 16px" }}>Atendimento AEE</th>
                  <th style={{ padding: "12px 16px" }}>Mediação / Apoio</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {alunosFiltrados.map((aluno) => (
                  <tr key={aluno.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{aluno.nomeAluno}</div>
                      {aluno.responsavelNome && (
                        <div style={{ fontSize: 11, color: "#64748b" }}>Resp: {aluno.responsavelNome}</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontWeight: 500, color: "#334155" }}>{aluno.turmaRegular || "-"}</span>
                    </td>
                    <td style={{ padding: "12px 16px", maxWidth: 240 }}>
                      <div style={{ fontWeight: 600, color: "#4f46e5" }}>{aluno.diagnosticoPrincipal}</div>
                      {aluno.cid10 && <div style={{ fontSize: 11, color: "#64748b" }}>{aluno.cid10}</div>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge color={aluno.temLaudoMedico?.includes("Sim") ? "green" : "amber"}>
                        {aluno.temLaudoMedico || "Pendente"}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12 }}>
                      <div>{aluno.frequenciaAEE || "A definir"}</div>
                      {aluno.professorAEEResponsavel && (
                        <div style={{ fontSize: 11, color: "#64748b" }}>Prof(a): {aluno.professorAEEResponsavel}</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12 }}>
                      {aluno.necessitaMediadorApoio?.includes("Sim") ? (
                        <div>
                          <Badge color="blue">Com Mediador(a)</Badge>
                          {aluno.profissionalApoio && (
                            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{aluno.profissionalApoio}</div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>Autônomo</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge color={aluno.status === "Ativo no AEE" ? "green" : "gray"}>
                        {aluno.status || "Ativo"}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                        <button
                          onClick={() => abrirProntuarioSigiloso(aluno)}
                          title="Ver Prontuário Confidencial"
                          style={{
                            background: "#eef2ff",
                            color: "#4f46e5",
                            border: "1px solid #c7d2fe",
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4
                          }}
                        >
                          <i className="ti ti-lock" /> Prontuário
                        </button>
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

      {/* Modal de Cadastro/Edição de Aluno no AEE */}
      {modalAberto && (
        <Modal
          titulo={alunoEditando ? "Editar Ficha de Educação Especial" : "Cadastrar Estudante no AEE / Educação Inclusiva"}
          onClose={() => setModalAberto(false)}
          onSave={handleSalvar}
          salvando={salvando}
          larguraMax={720}
        >
          {erro && <Alert tipo="error">{erro}</Alert>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {!alunoEditando && alunosEscola.length > 0 && (
              <Select
                label="Importar Aluno da Base Escolar (Autopreenchimento)"
                value={form.alunoId}
                onChange={(e) => handleSelecionarAlunoEscola(e.target.value)}
              >
                <option value="">Selecione um aluno para preenchimento automático...</option>
                {alunosEscola.map(a => (
                  <option key={a.id} value={a.id}>{a.nome} — {a.turma || a.ano || ""}</option>
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
                label="Turma da Sala Regular"
                placeholder="Ex: 4º Ano A (Manhã)"
                value={form.turmaRegular}
                onChange={(e) => setForm({ ...form, turmaRegular: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
              <Select
                label="Diagnóstico Principal / Condição"
                value={form.diagnosticoPrincipal}
                onChange={(e) => setForm({ ...form, diagnosticoPrincipal: e.target.value })}
              >
                <option value="Transtorno do Espectro Autista (TEA)">Transtorno do Espectro Autista (TEA)</option>
                <option value="Deficiência Auditiva / Surdez (Usuário de Libras)">Deficiência Auditiva / Surdez (Libras)</option>
                <option value="Deficiência Visual (Cegueira / Baixa Visão)">Deficiência Visual (Cegueira / Baixa Visão)</option>
                <option value="Deficiência Física / Mobilidade Reduzida">Deficiência Física / Mobilidade Reduzida</option>
                <option value="Deficiência Intelectual">Deficiência Intelectual</option>
                <option value="Síndrome de Down (Trissomia 21)">Síndrome de Down (Trissomia 21)</option>
                <option value="Deficiência Múltipla">Deficiência Múltipla</option>
                <option value="Altas Habilidades / Superdotação">Altas Habilidades / Superdotação</option>
                <option value="TDAH / Transtornos de Aprendizagem">TDAH / Transtornos de Aprendizagem</option>
                <option value="Outra Condição Específica">Outra Condição Específica</option>
              </Select>

              <Input
                label="Código CID-10 / CID-11"
                placeholder="Ex: CID-10: F84.0"
                value={form.cid10}
                onChange={(e) => setForm({ ...form, cid10: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", gap: 12 }}>
              <Select
                label="Laudo Médico Homologado"
                value={form.temLaudoMedico}
                onChange={(e) => setForm({ ...form, temLaudoMedico: e.target.value })}
              >
                <option value="Sim (Laudo Homologado)">Sim (Laudo Homologado)</option>
                <option value="Em Investigação Clínica">Em Investigação Clínica</option>
                <option value="Não Possui Laudo">Não Possui Laudo</option>
              </Select>
              <Input
                label="Médico Emissor / CRM"
                placeholder="Ex: Dr. Roberto Antunes (Neuropediatra - CRM 8940)"
                value={form.medicoLaudo}
                onChange={(e) => setForm({ ...form, medicoLaudo: e.target.value })}
              />
              <Input
                label="Data do Laudo"
                type="date"
                value={form.dataLaudo}
                onChange={(e) => setForm({ ...form, dataLaudo: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
              <Select
                label="Professor(a) de AEE Responsável"
                value={form.professorAEEResponsavel}
                onChange={(e) => setForm({ ...form, professorAEEResponsavel: e.target.value })}
              >
                <option value="">Selecione o professor de AEE...</option>
                {profissionais.map(p => (
                  <option key={p.id} value={p.nome}>{p.nome} ({p.cargo})</option>
                ))}
              </Select>

              <Input
                label="Frequência Semanal no AEE"
                placeholder="Ex: 2x por semana (Ter/Qui 14h)"
                value={form.frequenciaAEE}
                onChange={(e) => setForm({ ...form, frequenciaAEE: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select
                label="Necessidade de Mediador / Cuidador"
                value={form.necessitaMediadorApoio}
                onChange={(e) => setForm({ ...form, necessitaMediadorApoio: e.target.value })}
              >
                <option value="Sim (Acompanhamento na sala regular)">Sim (Acompanhamento na sala regular)</option>
                <option value="Sim (Apoio em locomoção e higiene)">Sim (Apoio em locomoção e higiene)</option>
                <option value="Não (Autônomo)">Não (Autônomo)</option>
              </Select>

              <Input
                label="Profissional de Apoio / Mediador Designado"
                placeholder="Ex: Rosângela Maria dos Santos"
                value={form.profissionalApoio}
                onChange={(e) => setForm({ ...form, profissionalApoio: e.target.value })}
              />
            </div>

            <Input
              label="Recursos de Tecnologia Assistiva & Comunicação Alternativa (CAA)"
              placeholder="Ex: Prancha PECS, fones abafadores acústicos, lupa eletrônica e caderno ampliado"
              value={form.recursosTecnologiaAssistiva}
              onChange={(e) => setForm({ ...form, recursosTecnologiaAssistiva: e.target.value })}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
              <Input
                label="Nome do Responsável Legal"
                placeholder="Ex: Carla Patrícia dos Santos"
                value={form.responsavelNome}
                onChange={(e) => setForm({ ...form, responsavelNome: e.target.value })}
              />
              <Input
                label="Telefone / Contato de Emergência"
                placeholder="(82) 99999-9999"
                value={form.responsavelTelefone}
                onChange={(e) => setForm({ ...form, responsavelTelefone: e.target.value })}
              />
            </div>

            <Input
              label="Observações Confidenciais de Saúde e Comportamento"
              placeholder="Ex: Hipersensibilidade a ruídos agudos; gosta de livros ilustrados sobre animais."
              value={form.observacoesConfidenciais}
              onChange={(e) => setForm({ ...form, observacoesConfidenciais: e.target.value })}
            />
          </div>
        </Modal>
      )}

      {/* Modal de Prontuário Sigiloso Oficial */}
      {modalProntuario && alunoProntuario && (
        <Modal
          titulo={`Prontuário Confidencial de AEE: ${alunoProntuario.nomeAluno}`}
          onClose={() => setModalProntuario(false)}
          larguraMax={760}
          semRodape
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #4f46e5", paddingBottom: 10 }}>
              <div>
                <h3 style={{ margin: 0, color: "#4f46e5", fontSize: 18 }}>SIGEM — Ficha Confidencial de Educação Especial (AEE)</h3>
                <div style={{ fontSize: 12, color: "#64748b" }}>Documento Sigiloso · Protegido pela LGPD e Lei Brasileira de Inclusão (LBI)</div>
              </div>
              <button
                onClick={() => window.print()}
                style={{
                  background: "#4f46e5",
                  color: "white",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <i className="ti ti-printer" /> Imprimir Ficha Oficial
              </button>
            </div>

            {/* Dados do Estudante */}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 12, background: "#f8fafc", padding: 14, borderRadius: 8, fontSize: 12 }}>
              <div>
                <strong>Nome do Estudante:</strong>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{alunoProntuario.nomeAluno}</div>
              </div>
              <div>
                <strong>Turma Regular:</strong>
                <div>{alunoProntuario.turmaRegular || "-"}</div>
              </div>
              <div>
                <strong>Status AEE:</strong>
                <div><Badge color="green">{alunoProntuario.status || "Ativo"}</Badge></div>
              </div>
              <div>
                <strong>Diagnóstico:</strong>
                <div style={{ color: "#4f46e5", fontWeight: 600 }}>{alunoProntuario.diagnosticoPrincipal}</div>
              </div>
              <div>
                <strong>CID:</strong>
                <div>{alunoProntuario.cid10 || "-"}</div>
              </div>
              <div>
                <strong>Laudo Médico:</strong>
                <div>{alunoProntuario.temLaudoMedico} ({alunoProntuario.dataLaudo ? new Date(alunoProntuario.dataLaudo + "T00:00:00").toLocaleDateString("pt-BR") : "Não inf."})</div>
              </div>
              <div style={{ gridColumn: "span 3" }}>
                <strong>Médico Responsável pelo Laudo:</strong> {alunoProntuario.medicoLaudo || "Não informado"}
              </div>
            </div>

            {/* Atendimento e Suporte */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, background: "#eef2ff", padding: 14, borderRadius: 8 }}>
              <div><strong>Professor(a) de AEE:</strong> {alunoProntuario.professorAEEResponsavel || "Equipe AEE"}</div>
              <div><strong>Frequência Contraturno:</strong> {alunoProntuario.frequenciaAEE || "Sessões semanais"}</div>
              <div><strong>Profissional de Apoio / Mediador:</strong> {alunoProntuario.necessitaMediadorApoio} {alunoProntuario.profissionalApoio ? `(${alunoProntuario.profissionalApoio})` : ""}</div>
              <div><strong>Tecnologia Assistiva / CAA:</strong> {alunoProntuario.recursosTecnologiaAssistiva || "Recursos visuais e pranchas adaptadas"}</div>
            </div>

            {/* Observações Confidenciais */}
            {alunoProntuario.observacoesConfidenciais && (
              <div style={{ fontSize: 12, background: "#fffbeb", color: "#92400e", padding: 12, borderRadius: 8, border: "1px solid #fde68a" }}>
                <strong>Orientações Confidenciais de Manejo e Saúde:</strong>
                <p style={{ margin: "4px 0 0 0" }}>{alunoProntuario.observacoesConfidenciais}</p>
              </div>
            )}

            {/* Contato dos Pais */}
            <div style={{ fontSize: 12, borderTop: "1px solid #e2e8f0", paddingTop: 10 }}>
              <strong>Responsável Legal:</strong> {alunoProntuario.responsavelNome || "-"} · <strong>Telefone:</strong> {alunoProntuario.responsavelTelefone || "-"}
            </div>

            {/* Assinaturas */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginTop: 20, paddingTop: 16, borderTop: "1px dashed #cbd5e1", textAlign: "center", fontSize: 11 }}>
              <div>
                <div style={{ borderBottom: "1px solid #475569", width: "80%", margin: "0 auto 6px" }} />
                <div>Professor(a) Especialista em AEE</div>
                <div style={{ color: "#64748b" }}>{alunoProntuario.professorAEEResponsavel || "Sala de Recursos Multifuncionais"}</div>
              </div>
              <div>
                <div style={{ borderBottom: "1px solid #475569", width: "80%", margin: "0 auto 6px" }} />
                <div>Coordenação Pedagógica / Direção</div>
                <div style={{ color: "#64748b" }}>Secretaria Municipal de Educação</div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
