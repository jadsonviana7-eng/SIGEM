import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getAlunosEspecial,
  getNecessidadesEducacionais,
  getAtendimentosAEE,
  addAtendimentoAEE,
  updateAtendimentoAEE,
  deleteAtendimentoAEE,
  getSalasRecursos,
  addSalaRecursos,
  updateSalaRecursos,
  deleteSalaRecursos,
  getProfissionaisEspecializados,
  addProfissionalEspecializado,
  updateProfissionalEspecializado,
  deleteProfissionalEspecializado,
  getPlanosAtendimento,
  addPlanoAtendimento,
  updatePlanoAtendimento,
  deletePlanoAtendimento,
  getAcompanhamentosEvolucao,
  addAcompanhamentoEvolucao,
  updateAcompanhamentoEvolucao,
  deleteAcompanhamentoEvolucao,
  getLogsAcessoSigiloso,
  injectEducacaoEspecialMockData
} from "../services/educacaoEspecialService";
import { getAlunos } from "../services/alunosService";
import { Spinner, Btn, NotificationModal } from "../components/ui";

import DashboardEspecial from "./especial/components/DashboardEspecial";
import AlunosEspecial from "./especial/components/AlunosEspecial";
import NecessidadesEducacionais from "./especial/components/NecessidadesEducacionais";
import AtendimentoAEE from "./especial/components/AtendimentoAEE";
import SalasRecursos from "./especial/components/SalasRecursos";
import ProfissionaisEspecial from "./especial/components/ProfissionaisEspecial";
import PlanoAtendimentoPEI from "./especial/components/PlanoAtendimentoPEI";
import AcompanhamentoEvolucao from "./especial/components/AcompanhamentoEvolucao";
import SegurancaSigilo from "./especial/components/SegurancaSigilo";

// Perfis autorizados a acessar dados de saúde/educação especial
const PERFIS_AUTORIZADOS = [
  "Administrador",
  "Diretor",
  "Direção",
  "Coordenador",
  "Coordenação",
  "Psicopedagogo",
  "Professor AEE",
  "Especialista",
  "Super Administrador"
];

export default function EducacaoEspecial() {
  const { user, selectedEscolaId } = useAuth();
  const activeEscolaId = selectedEscolaId || user?.escolaId || "";

  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);

  // Estados dos Dados
  const [alunos, setAlunos] = useState([]);
  const [alunosEscola, setAlunosEscola] = useState([]);
  const [necessidades, setNecessidades] = useState([]);
  const [atendimentos, setAtendimentos] = useState([]);
  const [salas, setSalas] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [acompanhamentos, setAcompanhamentos] = useState([]);
  const [logs, setLogs] = useState([]);

  const [notificacao, setNotificacao] = useState(null);

  // Verificação de Controle Rigoroso de Acesso
  const userPerfil = user?.role || user?.perfil || "Administrador";
  const temAcesso = PERFIS_AUTORIZADOS.some(p =>
    userPerfil.toLowerCase().includes(p.toLowerCase())
  );

  useEffect(() => {
    if (activeEscolaId && temAcesso) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [activeEscolaId, temAcesso]);

  const fetchData = async () => {
    if (!activeEscolaId) return;
    setLoading(true);
    try {
      const [
        resAlunos,
        resAlunosGeral,
        resNec,
        resAee,
        resSalas,
        resProf,
        resPlanos,
        resAcomp,
        resLogs
      ] = await Promise.all([
        getAlunosEspecial(activeEscolaId),
        getAlunos(activeEscolaId),
        getNecessidadesEducacionais(activeEscolaId),
        getAtendimentosAEE(activeEscolaId),
        getSalasRecursos(activeEscolaId),
        getProfissionaisEspecializados(activeEscolaId),
        getPlanosAtendimento(activeEscolaId),
        getAcompanhamentosEvolucao(activeEscolaId),
        getLogsAcessoSigiloso(activeEscolaId)
      ]);

      setAlunos(resAlunos);
      setAlunosEscola(resAlunosGeral);
      setNecessidades(resNec);
      setAtendimentos(resAee);
      setSalas(resSalas);
      setProfissionais(resProf);
      setPlanos(resPlanos);
      setAcompanhamentos(resAcomp);
      setLogs(resLogs);
    } catch (err) {
      console.error("Erro ao carregar dados da Educação Especial:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGerarMock = async () => {
    if (!window.confirm("Deseja injetar dados de demonstração de Educação Especial (Alunos atendidos, CID-10/11, laudos, SRM, AEE, PEI e pareceres)?")) {
      return;
    }
    setGerando(true);
    try {
      await injectEducacaoEspecialMockData(activeEscolaId, alunosEscola);
      await fetchData();
      setNotificacao({
        tipo: "sucesso",
        titulo: "Sucesso",
        mensagem: "Dados de teste de Educação Especial gerados com sucesso!"
      });
    } catch (e) {
      setNotificacao({
        tipo: "erro",
        titulo: "Erro",
        mensagem: "Erro ao gerar dados: " + e.message
      });
    } finally {
      setGerando(false);
    }
  };

  // Grupos do Menu Lateral Direito (Padrão Unificado)
  const gruposMenu = useMemo(() => [
    {
      titulo: "Visão Geral",
      itens: [
        {
          id: "dashboard",
          label: "Painel Principal",
          subtitulo: "Indicadores & Alertas",
          icon: "layout-dashboard",
          badge: null
        }
      ]
    },
    {
      titulo: "Atendimento & Estudantes",
      itens: [
        {
          id: "alunos",
          label: "Alunos Atendidos",
          subtitulo: "Laudos e diagnósticos",
          icon: "users",
          badge: alunos.length
        },
        {
          id: "necessidades",
          label: "Necessidades & T.A.",
          subtitulo: "Barreiras e acessibilidade",
          icon: "accessible",
          badge: necessidades.length
        },
        {
          id: "aee",
          label: "Atendimento AEE",
          subtitulo: "Horários e sessões",
          icon: "calendar-time",
          badge: atendimentos.length
        }
      ]
    },
    {
      titulo: "Ambientes & Equipe",
      itens: [
        {
          id: "salas",
          label: "Salas de Recursos",
          subtitulo: "Ambientes SRM e T.A.",
          icon: "door-enter",
          badge: salas.length
        },
        {
          id: "profissionais",
          label: "Profissionais AEE",
          subtitulo: "Equipe especializada",
          icon: "user-check",
          badge: profissionais.length
        }
      ]
    },
    {
      titulo: "Planejamento & Sigilo",
      itens: [
        {
          id: "plano",
          label: "Plano PEI / PDI",
          subtitulo: "Atendimento individual",
          icon: "file-certificate",
          badge: planos.length
        },
        {
          id: "acompanhamento",
          label: "Acompanhamento",
          subtitulo: "Pareceres descritivos",
          icon: "chart-line",
          badge: acompanhamentos.length
        },
        {
          id: "sigilo",
          label: "Segurança & Sigilo",
          subtitulo: "Auditoria e LGPD",
          icon: "shield-lock",
          badge: logs.length > 0 ? logs.length : null
        }
      ]
    }
  ], [alunos, necessidades, atendimentos, salas, profissionais, planos, acompanhamentos, logs]);

  // Funções de Persistência CRUD
  const handleSalvarAEE = async (dados, id) => {
    if (id) {
      await updateAtendimentoAEE(id, dados);
    } else {
      await addAtendimentoAEE(dados, activeEscolaId);
    }
    await fetchData();
  };

  const handleExcluirAEE = async (id) => {
    await deleteAtendimentoAEE(id);
    await fetchData();
  };

  const handleSalvarSala = async (dados, id) => {
    if (id) {
      await updateSalaRecursos(id, dados);
    } else {
      await addSalaRecursos(dados, activeEscolaId);
    }
    await fetchData();
  };

  const handleExcluirSala = async (id) => {
    await deleteSalaRecursos(id);
    await fetchData();
  };

  const handleSalvarProfissional = async (dados, id) => {
    if (id) {
      await updateProfissionalEspecializado(id, dados);
    } else {
      await addProfissionalEspecializado(dados, activeEscolaId);
    }
    await fetchData();
  };

  const handleExcluirProfissional = async (id) => {
    await deleteProfissionalEspecializado(id);
    await fetchData();
  };

  const handleSalvarPlano = async (dados, id) => {
    if (id) {
      await updatePlanoAtendimento(id, dados);
    } else {
      await addPlanoAtendimento(dados, activeEscolaId);
    }
    await fetchData();
  };

  const handleExcluirPlano = async (id) => {
    await deletePlanoAtendimento(id);
    await fetchData();
  };

  const handleSalvarAcompanhamento = async (dados, id) => {
    if (id) {
      await updateAcompanhamentoEvolucao(id, dados);
    } else {
      await addAcompanhamentoEvolucao(dados, activeEscolaId);
    }
    await fetchData();
  };

  const handleExcluirAcompanhamento = async (id) => {
    await deleteAcompanhamentoEvolucao(id);
    await fetchData();
  };

  if (!temAcesso) {
    return (
      <div style={{ padding: 32, textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ background: "white", borderRadius: 14, padding: 32, border: "1px solid #fee2e2", boxShadow: "0 8px 24px rgba(239, 68, 68, 0.1)" }}>
          <i className="ti ti-shield-x" style={{ fontSize: 48, color: "#ef4444", marginBottom: 12, display: "block" }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
            Acesso Restrito - Dados Médicos e Sigilosos (LGPD)
          </h2>
          <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
            O módulo de Educação Especial contém informações neuropediátricas e laudos confidenciais. Seu perfil atual (<strong>{userPerfil}</strong>) não possui autorização para visualização destes dados.
          </p>
        </div>
      </div>
    );
  }

  if (!activeEscolaId) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
        Por favor, selecione uma escola vinculada no menu superior para gerenciar a Educação Especial & AEE.
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) 290px",
      gap: 24,
      alignItems: "start"
    }}>
      {/* ═════════════════════════════════════════════════════ */}
      {/* ── COLUNA ESQUERDA: CONTEÚDO PRINCIPAL DO MÓDULO ── */}
      {/* ═════════════════════════════════════════════════════ */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        {loading ? (
          <Spinner />
        ) : (
          <div>
            {activeTab === "dashboard" && (
              <DashboardEspecial
                alunos={alunos}
                necessidades={necessidades}
                atendimentos={atendimentos}
                salas={salas}
                profissionais={profissionais}
                planos={planos}
                acompanhamentos={acompanhamentos}
                onNavigateTab={(tabName) => setActiveTab(tabName)}
              />
            )}

            {activeTab === "alunos" && (
              <AlunosEspecial
                alunos={alunos}
                alunosEscola={alunosEscola}
                profissionais={profissionais}
                currentUser={user}
                escolaId={activeEscolaId}
                onReload={fetchData}
              />
            )}

            {activeTab === "necessidades" && (
              <NecessidadesEducacionais
                necessidades={necessidades}
                alunos={alunos}
                escolaId={activeEscolaId}
                onReload={fetchData}
              />
            )}

            {activeTab === "aee" && (
              <AtendimentoAEE
                atendimentos={atendimentos}
                alunos={alunos}
                salas={salas}
                profissionais={profissionais}
                onSalvar={handleSalvarAEE}
                onExcluir={handleExcluirAEE}
                escolaId={activeEscolaId}
                usuario={user}
              />
            )}

            {activeTab === "salas" && (
              <SalasRecursos
                salas={salas}
                profissionais={profissionais}
                onSalvar={handleSalvarSala}
                onExcluir={handleExcluirSala}
                escolaId={activeEscolaId}
                usuario={user}
              />
            )}

            {activeTab === "profissionais" && (
              <ProfissionaisEspecial
                profissionais={profissionais}
                onSalvar={handleSalvarProfissional}
                onExcluir={handleExcluirProfissional}
                escolaId={activeEscolaId}
                usuario={user}
              />
            )}

            {activeTab === "plano" && (
              <PlanoAtendimentoPEI
                planos={planos}
                alunos={alunos}
                profissionais={profissionais}
                onSalvar={handleSalvarPlano}
                onExcluir={handleExcluirPlano}
                escolaId={activeEscolaId}
                usuario={user}
              />
            )}

            {activeTab === "acompanhamento" && (
              <AcompanhamentoEvolucao
                acompanhamentos={acompanhamentos}
                alunos={alunos}
                profissionais={profissionais}
                onSalvar={handleSalvarAcompanhamento}
                onExcluir={handleExcluirAcompanhamento}
                escolaId={activeEscolaId}
                usuario={user}
              />
            )}

            {activeTab === "sigilo" && (
              <SegurancaSigilo
                logs={logs}
                usuario={user}
                escolaId={activeEscolaId}
              />
            )}
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════ */}
      {/* ── COLUNA DIREITA: MENU VERTICAL & RESUMO DO AEE ── */}
      {/* ═════════════════════════════════════════════════════ */}
      <aside style={{
        position: "sticky",
        top: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16
      }}>
        {/* Cartão de Navegação Vertical */}
        <div style={{
          background: "white",
          borderRadius: 14,
          padding: "16px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 12,
            marginBottom: 12,
            borderBottom: "1px solid #f1f5f9"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                boxShadow: "0 2px 6px rgba(30, 64, 175, 0.3)"
              }}>
                <i className="ti ti-heart-handshake" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Educação Especial</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>AEE & Inclusão</div>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchData}
              title="Recarregar Dados"
              style={{
                padding: "6px 8px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                color: "#475569",
                cursor: "pointer",
                fontSize: 12,
                display: "flex",
                alignItems: "center"
              }}
            >
              <i className="ti ti-refresh" />
            </button>
          </div>

          {/* Lista de Grupos e Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {gruposMenu.map((grupo, gIdx) => (
              <div key={gIdx}>
                <div style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  color: "#94a3b8",
                  padding: "0 8px 6px 8px"
                }}>
                  {grupo.titulo}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {grupo.itens.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "none",
                          background: isActive ? "#eff6ff" : "transparent",
                          color: isActive ? "#1e40af" : "#334155",
                          fontWeight: isActive ? 700 : 500,
                          fontSize: 13,
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s ease",
                          borderLeft: isActive ? "3px solid #1e40af" : "3px solid transparent"
                        }}
                        onMouseOver={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = "#f8fafc";
                            e.currentTarget.style.color = "#1e293b";
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#334155";
                          }
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                          <i
                            className={`ti ti-${item.icon}`}
                            style={{
                              fontSize: 16,
                              color: isActive ? "#1e40af" : "#64748b",
                              flexShrink: 0
                            }}
                          />
                          <span style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}>
                            {item.label}
                          </span>
                        </div>

                        {item.badge !== null && (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: 10,
                            background: isActive ? "#1e40af" : "#f1f5f9",
                            color: isActive ? "white" : "#64748b",
                            flexShrink: 0
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cartão de Resumo Rápido & Sigilo */}
        <div style={{
          background: "#f8fafc",
          borderRadius: 14,
          padding: "14px 16px",
          border: "1px solid #e2e8f0",
          fontSize: 12
        }}>
          <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-shield-check" style={{ color: "#10b981", fontSize: 16 }} />
            <span>Conformidade & Sigilo LGPD</span>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 6, color: "#475569" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Alunos no AEE:</span>
              <strong>{alunos.length}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Planos PEI Vigentes:</span>
              <strong>{planos.length}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Salas SRM Ativas:</span>
              <strong>{salas.length}</strong>
            </div>
          </div>

          {alunos.length === 0 && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed #cbd5e1" }}>
              <Btn
                onClick={handleGerarMock}
                disabled={gerando}
                style={{ width: "100%", justifyContent: "center", fontSize: 11, padding: "6px 8px" }}
              >
                <i className="ti ti-database-import" />
                {gerando ? "Gerando..." : "Gerar Dados de Teste"}
              </Btn>
            </div>
          )}
        </div>
      </aside>

      {notificacao && (
        <NotificationModal
          isOpen={!!notificacao}
          onClose={() => setNotificacao(null)}
          tipo={notificacao.tipo}
          titulo={notificacao.titulo}
          mensagem={notificacao.mensagem}
        />
      )}
    </div>
  );
}
