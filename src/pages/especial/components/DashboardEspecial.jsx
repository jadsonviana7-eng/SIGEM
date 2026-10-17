import { useMemo } from "react";
import { Card, Badge } from "../../../components/ui";

export default function DashboardEspecial({
  alunos = [],
  atendimentos = [],
  salas = [],
  profissionais = [],
  planos = [],
  acompanhamentos = [],
  onNavigateTab
}) {
  const stats = useMemo(() => {
    const totalAlunos = alunos.length;
    const alunosAtivosAEE = alunos.filter(a => a.status === "Ativo no AEE" || !a.status).length;
    const alunosComLaudo = alunos.filter(a => a.temLaudoMedico?.includes("Sim")).length;
    const alunosComApoio = alunos.filter(a => a.necessitaMediadorApoio?.includes("Sim")).length;

    const totalProfissionais = profissionais.length;
    const totalSalas = salas.length;
    const totalPlanos = planos.length;

    // Distribuição por diagnóstico
    const diagnosticos = {};
    alunos.forEach(a => {
      const diag = a.diagnosticoPrincipal || "Outros";
      diagnosticos[diag] = (diagnosticos[diag] || 0) + 1;
    });

    // Alertas de revisão de PEI e acompanhamento
    const hoje = new Date();
    const trintaDias = new Date();
    trintaDias.setDate(hoje.getDate() + 30);

    const alertas = [];
    planos.forEach(p => {
      if (p.dataProximaRevisao) {
        const dRev = new Date(p.dataProximaRevisao + "T00:00:00");
        if (dRev <= trintaDias) {
          alertas.push({
            tipo: dRev < hoje ? "danger" : "warning",
            titulo: `Revisão de PEI: ${p.alunoNome}`,
            descricao: `Data prevista de revisão: ${dRev.toLocaleDateString("pt-BR")}. Avaliar alcance das metas pedagógicas.`,
            tab: "plano"
          });
        }
      }
    });

    return {
      totalAlunos,
      alunosAtivosAEE,
      alunosComLaudo,
      alunosComApoio,
      totalProfissionais,
      totalSalas,
      totalPlanos,
      diagnosticos,
      alertas
    };
  }, [alunos, profissionais, salas, planos]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Banner de Boas-Vindas e Ações Rápidas */}
      <div style={{
        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        color: "white",
        padding: "24px 28px",
        borderRadius: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.3)"
      }}>
        <div>
          <h2 style={{ margin: "0 0 6px 0", fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
            <i className="ti ti-heart-handshake" style={{ fontSize: 26 }} /> Módulo de Educação Especial Inclusiva & AEE
          </h2>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>
            Gestão de atendimento educacional especializado, salas de recursos, tecnologia assistiva, planos de desenvolvimento individual (PEI) e controle de sigilo.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => onNavigateTab("plano")}
            style={{
              background: "white",
              color: "#4f46e5",
              border: "none",
              padding: "10px 18px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
            }}
          >
            <i className="ti ti-file-certificate" /> Planos PEI / PAI
          </button>
          <button
            onClick={() => onNavigateTab("aee")}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              padding: "10px 18px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <i className="ti ti-calendar-time" /> Cronograma AEE
          </button>
        </div>
      </div>

      {/* Grid de Cards de Estatísticas Principais */}
      <div className="sigem-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Card style={{ padding: "18px 20px", borderLeft: "4px solid #6366f1", background: "#1e293b", borderColor: "#2c3b52" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Alunos no AEE</span>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#ffffff", marginTop: 4 }}>
                {stats.alunosAtivosAEE} <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 400 }}>estudantes</span>
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#243144", color: "#818cf8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              <i className="ti ti-users" />
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#cbd5e1" }}>
            {stats.alunosComLaudo} com laudo médico homologado
          </div>
        </Card>

        <Card style={{ padding: "18px 20px", borderLeft: "4px solid #10b981", background: "#1e293b", borderColor: "#2c3b52" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Apoio / Mediadores</span>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#ffffff", marginTop: 4 }}>
                {stats.alunosComApoio} <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 400 }}>atendidos</span>
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#243144", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              <i className="ti ti-user-heart" />
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#cbd5e1" }}>
            Mediação pedagógica e suporte integral em sala
          </div>
        </Card>

        <Card style={{ padding: "18px 20px", borderLeft: "4px solid #f59e0b", background: "#1e293b", borderColor: "#2c3b52" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Salas de Recursos</span>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#ffffff", marginTop: 4 }}>
                {stats.totalSalas} <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 400 }}>SRM ativas</span>
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#243144", color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              <i className="ti ti-chalkboard" />
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#cbd5e1" }}>
            Equipadas com Tecnologia Assistiva e CAA
          </div>
        </Card>

        <Card style={{ padding: "18px 20px", borderLeft: "4px solid #8b5cf6", background: "#1e293b", borderColor: "#2c3b52" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Equipe Especializada</span>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#ffffff", marginTop: 4 }}>
                {stats.totalProfissionais} <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 400 }}>profissionais</span>
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#243144", color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              <i className="ti ti-certificate" />
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#cbd5e1" }}>
            Professores de AEE, TILS e Psicopedagoga
          </div>
        </Card>
      </div>

      {/* Seção Central: Diagnósticos Atendidos & Alertas de PEI (Responsivo: 2 colunas no desktop, 1 no mobile) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        {/* Distribuição de Alunos por Diagnóstico / Necessidade */}
        <Card style={{ background: "#1e293b", borderColor: "#2c3b52" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-chart-pie" style={{ color: "#818cf8" }} /> Perfil dos Estudantes Atendidos
            </h3>
            <button
              onClick={() => onNavigateTab("alunos")}
              style={{ background: "none", border: "none", color: "#818cf8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Ver Lista <i className="ti ti-chevron-right" />
            </button>
          </div>

          {Object.keys(stats.diagnosticos).length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
              Nenhum aluno cadastrado no momento.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(stats.diagnosticos).map(([diag, qtd], idx) => {
                const pct = Math.round((qtd / stats.totalAlunos) * 100);
                return (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: "#cbd5e1" }}>{diag}</span>
                      <strong style={{ color: "#a5b4fc" }}>{qtd} aluno(s) ({pct}%)</strong>
                    </div>
                    <div style={{ width: "100%", height: 7, background: "#0f172a", borderRadius: 4, overflow: "hidden", border: "1px solid #33435c" }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                          borderRadius: 4
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Prazos & Revisão de PEIs */}
        <Card style={{ display: "flex", flexDirection: "column", background: "#1e293b", borderColor: "#2c3b52" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-clock-hour-4" style={{ color: "#fbbf24" }} /> Revisões de PEI & Prazos
            </h3>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              {stats.alertas.length} pendência(s)
            </span>
          </div>

          {stats.alertas.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "#34d399", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 8, margin: "auto 0" }}>
              <i className="ti ti-circle-check" style={{ fontSize: 32, display: "block", marginBottom: 8 }} />
              <div style={{ fontWeight: 600, fontSize: 14 }}>Planos de Atendimento em Dia!</div>
              <div style={{ fontSize: 12, color: "#6ee7b7" }}>Todos os PEIs e avaliações pedagógicas estão dentro do prazo de vigência.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 260, overflowY: "auto" }}>
              {stats.alertas.map((al, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigateTab(al.tab)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    background: al.tipo === "danger" ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    borderLeft: `4px solid ${al.tipo === "danger" ? "#ef4444" : "#f59e0b"}`,
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: al.tipo === "danger" ? "#fca5a5" : "#fde68a" }}>
                      {al.titulo}
                    </span>
                    <Badge color={al.tipo === "danger" ? "red" : "amber"}>Ação</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                    {al.descricao}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Aviso de Sigilo e LGPD */}
      <div style={{
        background: "#1e293b",
        border: "1px solid #2c3b52",
        borderRadius: 12,
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <i className="ti ti-shield-lock" style={{ fontSize: 24, color: "#818cf8" }} />
          <div>
            <strong style={{ fontSize: 13, color: "#f8fafc" }}>Proteção de Dados Sensíveis de Saúde & Educação (LGPD)</strong>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Todos os acessos aos laudos médicos e prontuários pedagógicos são auditados com registro de data, hora e usuário logado.
            </div>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab("sigilo")}
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)"
          }}
        >
          Ver Logs de Acesso
        </button>
      </div>
    </div>
  );
}
