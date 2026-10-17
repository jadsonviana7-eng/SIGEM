import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getAlunos } from "../services/alunosService";
import { getTurmas } from "../services/turmasService";
import { getHistoricoConsolidado } from "../services/historicoService";
import { getEscolaById } from "../services/escolasService";
import { Card, Badge, Btn, Modal, Spinner, EmptyState } from "../components/ui";
import CabecalhoDocumentoOficial from "../components/CabecalhoDocumentoOficial";

export default function HistoricoEscolar() {
  const [searchParams] = useSearchParams();
  const urlAlunoId = searchParams.get("alunoId");

  const { user, escolas, selectedEscolaId } = useAuth();
  const activeEscolaId = selectedEscolaId || user?.selectedEscolaId || "";
  const [escolaCarregada, setEscolaCarregada] = useState(null);

  // Se a escola ativa não estiver na lista global em memória, busca direto no Firestore
  useEffect(() => {
    let ativo = true;
    if (activeEscolaId && !(escolas || []).some(e => e.id === activeEscolaId)) {
      getEscolaById(activeEscolaId).then(res => {
        if (ativo && res) setEscolaCarregada(res);
      }).catch(err => console.error("Erro ao carregar dados da escola:", err));
    }
    return () => { ativo = false; };
  }, [activeEscolaId, escolas]);

  const escolaAtual = useMemo(() => {
    const daLista = (escolas || []).find(e => e.id === activeEscolaId);
    if (daLista) return daLista;
    if (escolaCarregada) return escolaCarregada;
    return {
      nome: "Escola Municipal",
      inep: "27000000",
      municipio: "Maceió",
      uf: "AL"
    };
  }, [escolas, activeEscolaId, escolaCarregada]);

  const [turmaFiltro, setTurmaFiltro] = useState("");
  const [busca, setBusca] = useState("");
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState(urlAlunoId || "");
  const [historicoCarregado, setHistoricoCarregado] = useState(null);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [modalVisualizar, setModalVisualizar] = useState(false);

  // Carrega Turmas
  const { dados: turmas } = useFirestore(
    useCallback(() => getTurmas(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  // Carrega Alunos
  const { dados: todosAlunos, carregando: cAlunos } = useFirestore(
    useCallback(() => getAlunos(activeEscolaId), [activeEscolaId]),
    [activeEscolaId]
  );

  // Alunos Filtrados
  const alunosFiltrados = useMemo(() => {
    if (!todosAlunos) return [];
    return todosAlunos.filter(a => {
      const matchTurma = !turmaFiltro || a.turma === turmaFiltro;
      const matchBusca = !busca ||
        (a.nome || "").toLowerCase().includes(busca.toLowerCase()) ||
        (a.matricula || "").includes(busca) ||
        (a.cpf || "").includes(busca);
      return matchTurma && matchBusca;
    });
  }, [todosAlunos, turmaFiltro, busca]);

  // Ao selecionar um aluno, carrega o histórico consolidado
  async function carregarHistoricoAluno(alunoId) {
    if (!alunoId) return;
    setAlunoSelecionadoId(alunoId);
    setCarregandoHistorico(true);
    try {
      const alunoObj = (todosAlunos || []).find(a => a.id === alunoId);
      const escAluno = (escolas || []).find(e => e.id === alunoObj?.escolaId) || escolaAtual;
      const dados = await getHistoricoConsolidado(alunoId, activeEscolaId, escAluno);
      setHistoricoCarregado(dados);
      setModalVisualizar(true);
    } catch (err) {
      console.error("Erro ao carregar histórico escolar:", err);
      alert("Erro ao gerar histórico consolidado do aluno.");
    } finally {
      setCarregandoHistorico(false);
    }
  }

  useEffect(() => {
    if (urlAlunoId) {
      carregarHistoricoAluno(urlAlunoId);
    }
  }, [urlAlunoId, activeEscolaId]);

  function handleImprimir() {
    window.print();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: "3rem" }}>
      {/* CSS DE IMPRESSÃO A4 COM MARGENS DE 2CM E OCULTAÇÃO DE LAYOUT */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            color: #000000 !important;
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          .historico-print-target, .historico-print-target * {
            visibility: visible !important;
          }
          .historico-print-target {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 12mm 2cm 12mm 2cm !important; /* 2cm de margem lateral */
            box-sizing: border-box !important;
            background: #ffffff !important;
            display: block !important;
          }
          .cabecalho-documento-oficial h2 {
            font-size: 12px !important;
            margin: 0 !important;
            font-weight: bold !important;
          }
          .cabecalho-documento-oficial h3 {
            font-size: 11.5px !important;
            margin: 1px 0 !important;
            font-weight: bold !important;
          }
          .cabecalho-documento-oficial .escola-nome-oficial {
            font-size: 15px !important;
            font-weight: 900 !important;
            margin: 3px 0 2px !important;
          }
          .cabecalho-documento-oficial .escola-detalhes-oficial {
            font-size: 10px !important;
            line-height: 1.35 !important;
          }
          .cabecalho-documento-oficial .boletim-titulo-tag {
            font-size: 11px !important;
            padding: 3px 14px !important;
          }
          .historico-tabela {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 8px !important;
            border: 1px solid #000 !important;
            margin-bottom: 6px !important;
            color: #000000 !important;
          }
          .historico-tabela th, .historico-tabela td {
            border: 1px solid #000 !important;
            padding: 2.5px 3.5px !important;
            line-height: 1.15 !important;
            color: #000000 !important;
          }
          .historico-tabela th {
            background-color: #f1f5f9 !important;
            font-weight: bold !important;
            color: #000000 !important;
          }
          .historico-assinaturas {
            display: flex !important;
            justify-content: space-around !important;
            margin-top: 50px !important;
            text-align: center !important;
            font-size: 8.5px !important;
            page-break-inside: avoid !important;
          }
          .historico-assinaturas .linha-ass {
            width: 160px !important;
            border-top: 1px solid #000 !important;
            margin: 0 auto 3px !important;
          }
        }
      `}</style>

      {/* CABEÇALHO */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.6rem" }}>📜</span>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Histórico Escolar Oficial & Trajetória
            </h1>
          </div>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Emissão eletrônica com validação criptográfica 🔐, QR Code oficial e consolidação automática de trajetória.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <a href="/validar-documento" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <Btn variant="default" style={{ color: "var(--accent-indigo, #818cf8)", borderColor: "var(--border-color)", background: "var(--bg-surface)", fontWeight: 600 }}>
              <i className="ti ti-shield-check" style={{ color: "var(--accent-indigo, #818cf8)" }} />
              Portal de Validação 🔐
            </Btn>
          </a>
        </div>
      </div>

      {/* PAINEL PRINCIPAL DE ESTUDANTES */}
      <Card className="no-print">
        {/* FILTROS & BUSCA */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-surface)", padding: "0.4rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <i className="ti ti-books" style={{ color: "var(--text-muted)" }} />
              <select
                value={turmaFiltro}
                onChange={(e) => setTurmaFiltro(e.target.value)}
                style={{ background: "transparent", border: "none", fontWeight: 600, color: "var(--text-primary)", cursor: "pointer", outline: "none", fontSize: "0.85rem" }}
              >
                <option value="" style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}>Todas as Turmas</option>
                {(turmas || []).map(t => (
                  <option key={t.id || t.nome} value={t.nome} style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>{t.nome}</option>
                ))}
              </select>
            </div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
              {alunosFiltrados.length} {alunosFiltrados.length === 1 ? "aluno encontrado" : "alunos encontrados"}
            </span>
          </div>

          <div style={{ position: "relative", flex: "1 1 240px", maxWidth: "100%" }}>
            <i className="ti ti-search" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar por nome, matrícula ou CPF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: "100%",
                padding: "0.45rem 0.75rem 0.45rem 2.2rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
          </div>
        </div>

        {/* TABELA DE ALUNOS */}
        {cAlunos ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <Spinner />
            <p style={{ marginTop: "1rem", color: "#94a3b8" }}>Carregando dados dos estudantes...</p>
          </div>
        ) : alunosFiltrados.length === 0 ? (
          <EmptyState
            icone="school"
            titulo="Nenhum estudante encontrado"
            descricao="Não há alunos correspondentes aos filtros selecionados."
          />
        ) : (
          <>
            {/* Visualização Desktop: Tabela Estruturada */}
            <div className="sigem-desktop-table" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface)", borderBottom: "2px solid var(--border-color)", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Estudante</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Matrícula / CPF</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Turma Atual</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Trajetória Escolar</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Status</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 600, textAlign: "right" }}>Emissão Oficial</th>
                  </tr>
                </thead>
                <tbody>
                  {alunosFiltrados.map((a) => {
                    const trajetoriaCount = (a.trajetoriaEscolar || []).length || 5;
                    return (
                      <tr key={a.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>{a.nome}</div>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Mãe: {a.mae || a.responsavel || "Não informada"}</span>
                        </td>

                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{a.matricula || "—"}</div>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>CPF: {a.cpf || "Não informado"}</span>
                        </td>

                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{a.turma || "Sem turma"}</div>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{a.turno || "Matutino"}</span>
                        </td>

                        <td style={{ padding: "1rem" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", padding: "0.25rem 0.6rem", borderRadius: "12px", fontSize: "0.8rem", color: "#818cf8", fontWeight: 600 }}>
                            <i className="ti ti-timeline" style={{ color: "#818cf8" }} />
                            {trajetoriaCount} anos registrados
                          </div>
                        </td>

                        <td style={{ padding: "1rem" }}>
                          <Badge tipo={a.status === "Transferido" ? "aviso" : "sucesso"}>
                            {a.status || "Ativo"}
                          </Badge>
                        </td>

                        <td style={{ padding: "1rem", textAlign: "right" }}>
                          <Btn
                            tamanho="pequeno"
                            variante="primario"
                            onClick={() => carregarHistoricoAluno(a.id)}
                            desabilitado={carregandoHistorico && alunoSelecionadoId === a.id}
                          >
                            <i className="ti ti-file-certificate" />
                            {carregandoHistorico && alunoSelecionadoId === a.id ? "Gerando..." : "Gerar Histórico 📜"}
                          </Btn>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Visualização Mobile: Cards Otimizados */}
            <div className="sigem-mobile-cards">
              {alunosFiltrados.map((a) => {
                const trajetoriaCount = (a.trajetoriaEscolar || []).length || 5;
                const isCarregandoEste = carregandoHistorico && alunoSelecionadoId === a.id;

                return (
                  <div
                    key={`mob-hist-${a.id}`}
                    onClick={() => carregarHistoricoAluno(a.id)}
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      borderRadius: 14,
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      cursor: "pointer",
                      boxShadow: "var(--card-shadow)",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-indigo)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}
                  >
                    {/* Avatar / Ícone */}
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      color: "var(--text-muted)",
                      flexShrink: 0
                    }}>
                      <i className="ti ti-file-certificate" style={{ color: "#818cf8" }} />
                    </div>

                    {/* Dados Essenciais */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {a.nome}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 11 }}>
                        <Badge color="blue">{a.turma || "Sem turma"}</Badge>
                        <span style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>
                          #{a.matricula || "S/N"}
                        </span>
                        <span style={{ color: "var(--text-muted)", marginLeft: "auto" }}>
                          {trajetoriaCount} anos reg.
                        </span>
                      </div>
                    </div>

                    {/* Status & Ação / Chevron */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <Badge tipo={a.status === "Transferido" ? "aviso" : "sucesso"}>
                        {a.status || "Ativo"}
                      </Badge>
                      <div style={{ color: "var(--text-muted)", fontSize: 18, display: "flex", alignItems: "center" }}>
                        {isCarregandoEste ? (
                          <i className="ti ti-loader rotate" style={{ color: "var(--accent-indigo)" }} />
                        ) : (
                          <i className="ti ti-chevron-right" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* ================= MODAL: HISTÓRICO ESCOLAR OFICIAL COM VALIDAÇÃO & QR CODE ================= */}
      {modalVisualizar && historicoCarregado && (
        <Modal
          titulo={`Histórico Escolar Oficial · ${historicoCarregado.aluno.nome}`}
          onClose={() => setModalVisualizar(false)}
          semRodape
          width="880px"
          larguraMax="880px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* BARRA DE AÇÕES NO TOPO DO MODAL */}
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #33435c", paddingBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#34d399", background: "rgba(16, 185, 129, 0.15)", padding: "0.3rem 0.75rem", borderRadius: "20px", border: "1px solid rgba(16, 185, 129, 0.3)", fontWeight: 700 }}>
                <span style={{ fontSize: "1rem" }}>🔐</span>
                Autenticado Digitalmente: {historicoCarregado.autenticacao.codigoValidacao}
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Btn variant="default" onClick={handleImprimir}>
                  <i className="ti ti-file-download" /> Baixar PDF
                </Btn>
                <Btn variant="primary" onClick={handleImprimir}>
                  <i className="ti ti-printer" /> Imprimir Histórico
                </Btn>
              </div>
            </div>

            {/* DOCUMENTO OFICIAL DO HISTÓRICO ESCOLAR */}
            <div
              id="documento-historico"
              className="historico-print-target"
              style={{
                background: "#ffffff",
                padding: "1.25rem 1.5rem",
                color: "#000000",
                fontFamily: "Arial, sans-serif",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              {/* CABEÇALHO OFICIAL COM BRASÃO */}
              <CabecalhoDocumentoOficial
                escola={historicoCarregado?.escola || escolaAtual}
                tituloDocumento="HISTÓRICO ESCOLAR DO ENSINO FUNDAMENTAL"
                protocolo={historicoCarregado?.autenticacao?.codigoValidacao}
              />

              {/* DADOS CADASTRAIS DO ALUNO */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.3rem 0.6rem", background: "#f8fafc", border: "1px solid #000", padding: "0.4rem 0.6rem", fontSize: "0.74rem", marginBottom: "0.5rem" }}>
                <div style={{ gridColumn: "span 2" }}>
                  <strong>Nome do Estudante:</strong> {historicoCarregado.aluno.nome.toUpperCase()}
                </div>
                <div>
                  <strong>Matrícula:</strong> {historicoCarregado.aluno.matricula || "20260012"}
                </div>
                <div>
                  <strong>Filiação / Mãe:</strong> {historicoCarregado.aluno.mae || historicoCarregado.aluno.responsavel || "Não informada"}
                </div>
                <div>
                  <strong>Filiação / Pai:</strong> {historicoCarregado.aluno.pai || "Não declarado"}
                </div>
                <div>
                  <strong>Data de Nascimento:</strong> {historicoCarregado.aluno.nascimento ? new Date(historicoCarregado.aluno.nascimento + "T12:00:00").toLocaleDateString("pt-BR") : "01/01/2012"}
                </div>
                <div>
                  <strong>Naturalidade:</strong> {historicoCarregado.aluno.municipioNascimento || "Porto Calvo"} / {historicoCarregado.aluno.ufNascimento || "AL"}
                </div>
                <div>
                  <strong>Nacionalidade:</strong> {historicoCarregado.aluno.nacionalidade || "Brasileira"}
                </div>
                <div>
                  <strong>CPF:</strong> {historicoCarregado.aluno.cpf || "Não informado"}
                </div>
              </div>

              {/* TABELA 1: MATRIZ CURRICULAR DA BNCC E AVALIAÇÃO ANUAL */}
              <div style={{ fontSize: "0.72rem", fontWeight: "bold", marginBottom: "0.2rem", textTransform: "uppercase" }}>
                1. Matriz Curricular & Rendimento Escolar (BNCC)
              </div>
              <table className="historico-tabela" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.7rem", border: "1px solid #000", marginBottom: "0.5rem" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "center" }}>
                    <th style={{ border: "1px solid #000", padding: "3px 5px", textAlign: "left" }}>Componente Curricular</th>
                    {historicoCarregado.trajetoria.map((t) => (
                      <th key={t.serieAno} style={{ border: "1px solid #000", padding: "3px", width: "48px" }}>
                        <div>{t.serieAno}</div>
                        <span style={{ fontSize: "0.6rem", fontWeight: "normal" }}>({t.anoLetivo})</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historicoCarregado.componentes.map((c) => (
                    <tr key={c.disciplina} style={{ textAlign: "center" }}>
                      <td style={{ border: "1px solid #000", padding: "2.5px 5px", textAlign: "left", fontWeight: "bold" }}>
                        {c.disciplina}
                      </td>
                      {c.historicoMedias.map((m, idx) => (
                        <td key={idx} style={{ border: "1px solid #000", padding: "2.5px" }}>
                          {m}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* TABELA 2: QUADRO DE ESTUDOS REALIZADOS E TRAJETÓRIA COMPLETA */}
              <div style={{ fontSize: "0.72rem", fontWeight: "bold", marginBottom: "0.2rem", textTransform: "uppercase" }}>
                2. Registro dos Estudos Realizados & Trajetória Escolar
              </div>
              <table className="historico-tabela" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem", border: "1px solid #000", marginBottom: "0.5rem" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "center" }}>
                    <th style={{ border: "1px solid #000", padding: "3px" }}>Série / Ano</th>
                    <th style={{ border: "1px solid #000", padding: "3px" }}>Ano Letivo</th>
                    <th style={{ border: "1px solid #000", padding: "3px" }}>Carga Horária</th>
                    <th style={{ border: "1px solid #000", padding: "3px" }}>Frequência</th>
                    <th style={{ border: "1px solid #000", padding: "3px", textAlign: "left" }}>Estabelecimento de Ensino</th>
                    <th style={{ border: "1px solid #000", padding: "3px" }}>Município / UF</th>
                    <th style={{ border: "1px solid #000", padding: "3px" }}>Resultado Final</th>
                  </tr>
                </thead>
                <tbody>
                  {historicoCarregado.trajetoria.map((t) => (
                    <tr key={t.id || t.serieAno} style={{ textAlign: "center" }}>
                      <td style={{ border: "1px solid #000", padding: "2.5px", fontWeight: "bold" }}>{t.serieAno}</td>
                      <td style={{ border: "1px solid #000", padding: "2.5px" }}>{t.anoLetivo}</td>
                      <td style={{ border: "1px solid #000", padding: "2.5px" }}>{t.cargaHoraria || "800 h/a"}</td>
                      <td style={{ border: "1px solid #000", padding: "2.5px" }}>{t.frequenciaPercentual || "95%"}</td>
                      <td style={{ border: "1px solid #000", padding: "2.5px 5px", textAlign: "left" }}>{t.escola}</td>
                      <td style={{ border: "1px solid #000", padding: "2.5px" }}>
                        {t.cidadeUf || `${historicoCarregado?.escola?.municipio || historicoCarregado?.escola?.cidade || escolaAtual?.municipio || escolaAtual?.cidade || "Maceió"} - ${historicoCarregado?.escola?.uf || escolaAtual?.uf || "AL"}`}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "2.5px", fontWeight: "bold" }}>
                        {t.situacaoFinal === "Aprovado" ? "APROVADO" : t.situacaoFinal.toUpperCase()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 🔐 SELO DE VALIDAÇÃO DIGITAL & QR CODE */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", border: "1.5px solid #000", padding: "0.5rem 0.75rem", background: "#f8fafc", marginBottom: "0.5rem", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: "bold", fontSize: "0.78rem", color: "#166534" }}>
                    <span>🔐</span>
                    DOCUMENTO OFICIAL COM AUTENTICAÇÃO DIGITAL SIGEM
                  </div>
                  <div style={{ fontSize: "0.7rem", marginTop: "2px", color: "#333" }}>
                    Código de Validação: <strong style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#000" }}>{historicoCarregado.autenticacao.codigoValidacao}</strong>
                  </div>
                  <div style={{ fontSize: "0.66rem", color: "#555", marginTop: "2px" }}>
                    Emitido em: {new Date(historicoCarregado.autenticacao.dataEmissao).toLocaleString("pt-BR")} | Consulte a autenticidade em: <strong>{historicoCarregado.autenticacao.urlValidacao}</strong>
                  </div>
                </div>

                {/* QR CODE */}
                <div style={{ textAlign: "center", background: "#ffffff", padding: "3px", border: "1px solid #000", borderRadius: "3px" }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(historicoCarregado.autenticacao.urlValidacao)}`}
                    alt="QR Code de Validação do Documento"
                    style={{ width: "55px", height: "55px", display: "block" }}
                  />
                  <span style={{ fontSize: "0.55rem", fontWeight: "bold", display: "block", marginTop: "1px" }}>Validar QR Code</span>
                </div>
              </div>

              {/* OBSERVAÇÕES & CERTIFICAÇÃO */}
              <div style={{ fontSize: "0.68rem", border: "1px solid #000", padding: "0.3rem 0.5rem", marginBottom: "0.75rem", lineHeight: 1.25 }}>
                <strong>OBSERVAÇÕES LEGAIS:</strong> Documento expedido em conformidade com a Lei de Diretrizes e Bases da Educação Nacional (Lei Federal nº 9.394/1996) e Resoluções do Conselho Nacional e Municipal de Educação. Média curricular calculada na escala de 0,0 a 10,0.
              </div>

              {/* LOCAL E DATA */}
              <div style={{ textAlign: "right", fontSize: "0.72rem", marginBottom: "20px", fontStyle: "italic" }}>
                {historicoCarregado?.escola?.municipio || historicoCarregado?.escola?.cidade || escolaAtual?.municipio || escolaAtual?.cidade || "Maceió"} - {historicoCarregado?.escola?.uf || escolaAtual?.uf || "AL"}, {historicoCarregado?.dataEmissao || new Date().toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' })}.
              </div>

              {/* ASSINATURAS MOVIDAS 50PX PARA BAIXO */}
              <div
                className="historico-assinaturas"
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  marginTop: "50px", /* 50px de espaçamento */
                  textAlign: "center",
                  fontSize: "0.74rem"
                }}
              >
                <div>
                  <div className="linha-ass" style={{ width: "180px", borderTop: "1px solid #000", margin: "0 auto 3px" }} />
                  <strong>Secretário(a) Escolar</strong>
                  <div style={{ fontSize: "0.65rem", color: "#444" }}>
                    {historicoCarregado?.escola?.secretario || escolaAtual?.secretario || "Secretaria Escolar · Reg. SEDUC"}
                  </div>
                </div>
                <div>
                  <div className="linha-ass" style={{ width: "180px", borderTop: "1px solid #000", margin: "0 auto 3px" }} />
                  <strong>Diretor(a) Escolar</strong>
                  <div style={{ fontSize: "0.65rem", color: "#444" }}>
                    {historicoCarregado?.escola?.diretor || escolaAtual?.diretor || "Direção Escolar · Portaria SEDUC"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
