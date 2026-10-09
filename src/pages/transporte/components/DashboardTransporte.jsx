import { useMemo } from "react";
import { Card, Badge, Btn } from "../../../components/ui";

export default function DashboardTransporte({
  rotas = [],
  veiculos = [],
  motoristas = [],
  alunos = [],
  pontos = [],
  manutencoes = [],
  custos = [],
  viagens = [],
  onNavigateTab
}) {
  // Cálculos e Estatísticas
  const stats = useMemo(() => {
    const totalRotasAtivas = rotas.filter(r => r.status === "Ativa" || !r.status).length;
    const totalVeiculosOperacionais = veiculos.filter(v => v.status === "Operacional" || !v.status).length;
    const totalAlunosAtivos = alunos.filter(a => a.status === "Ativo" || !a.status).length;
    const totalMotoristasAtivos = motoristas.filter(m => (m.status === "Ativo" || !m.status) && m.tipo !== "Monitor(a)").length;
    const totalMonitoresAtivos = motoristas.filter(m => (m.status === "Ativo" || !m.status) && m.tipo === "Monitor(a)").length;

    // Custos totais
    const custoAbastecimento = custos
      .filter(c => c.tipo === "Abastecimento" || c.categoria === "Combustível")
      .reduce((acc, c) => acc + (Number(c.valorTotal) || 0), 0);
    
    const custoManutencao = manutencoes
      .reduce((acc, m) => acc + (Number(m.custoTotal) || 0), 0);

    const outrosCustos = custos
      .filter(c => c.tipo !== "Abastecimento" && c.categoria !== "Combustível")
      .reduce((acc, c) => acc + (Number(c.valorTotal) || 0), 0);

    const custoGeral = custoAbastecimento + custoManutencao + outrosCustos;

    // Alertas
    const hoje = new Date();
    const trintaDias = new Date();
    trintaDias.setDate(hoje.getDate() + 30);

    const alertas = [];

    // Alerta de CNH vencendo ou vencida
    motoristas.forEach(m => {
      if (m.validadeCnh && m.validadeCnh !== "-") {
        const dVal = new Date(m.validadeCnh);
        if (dVal < hoje) {
          alertas.push({
            tipo: "danger",
            icone: "license",
            titulo: `CNH Vencida: ${m.nome}`,
            descricao: `A CNH (${m.categoriaCnh}) venceu em ${new Date(m.validadeCnh + "T00:00:00").toLocaleDateString("pt-BR")}.`,
            tab: "motoristas"
          });
        } else if (dVal <= trintaDias) {
          alertas.push({
            tipo: "warning",
            icone: "clock-hour-4",
            titulo: `CNH a Vencer: ${m.nome}`,
            descricao: `Vencimento em ${new Date(m.validadeCnh + "T00:00:00").toLocaleDateString("pt-BR")}.`,
            tab: "motoristas"
          });
        }
      }
    });

    // Alerta de Vistorias de veículos
    veiculos.forEach(v => {
      if (v.vistoriaVencimento) {
        const dVist = new Date(v.vistoriaVencimento);
        if (dVist < hoje) {
          alertas.push({
            tipo: "danger",
            icone: "bus",
            titulo: `Vistoria Vencida: ${v.placa} (${v.tipo})`,
            descricao: `A vistoria obrigatória do DETRAN expirou em ${new Date(v.vistoriaVencimento + "T00:00:00").toLocaleDateString("pt-BR")}.`,
            tab: "veiculos"
          });
        } else if (dVist <= trintaDias) {
          alertas.push({
            tipo: "warning",
            icone: "bus",
            titulo: `Vistoria a Renovar: ${v.placa}`,
            descricao: `Vistoria vence em ${new Date(v.vistoriaVencimento + "T00:00:00").toLocaleDateString("pt-BR")}.`,
            tab: "veiculos"
          });
        }
      }
    });

    // Alerta de Lotação de Rotas
    rotas.forEach(r => {
      const alunosNaRota = alunos.filter(a => a.rotaId === r.id && (a.status === "Ativo" || !a.status)).length;
      const veiculoRota = veiculos.find(v => v.id === r.veiculoId);
      if (veiculoRota && veiculoRota.capacidade && alunosNaRota > Number(veiculoRota.capacidade)) {
        alertas.push({
          tipo: "danger",
          icone: "alert-triangle",
          titulo: `Superlotação na Rota: ${r.nome}`,
          descricao: `A rota tem ${alunosNaRota} alunos para um veículo com capacidade de ${veiculoRota.capacidade} lugares!`,
          tab: "rotas"
        });
      }
    });

    return {
      totalRotasAtivas,
      totalVeiculosOperacionais,
      totalAlunosAtivos,
      totalMotoristasAtivos,
      totalMonitoresAtivos,
      custoAbastecimento,
      custoManutencao,
      outrosCustos,
      custoGeral,
      alertas
    };
  }, [rotas, veiculos, motoristas, alunos, manutencoes, custos]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Banner de Boas-Vindas e Ações Rápidas */}
      <div style={{
        background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
        color: "white",
        padding: "24px 28px",
        borderRadius: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        boxShadow: "0 10px 25px -5px rgba(30, 64, 175, 0.3)"
      }}>
        <div>
          <h2 style={{ margin: "0 0 6px 0", fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
            <i className="ti ti-bus" style={{ fontSize: 26 }} /> Módulo de Transporte Escolar Integrado
          </h2>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>
            Gerenciamento completo de rotas, veículos, motoristas, segurança dos estudantes, diário de bordo e despesas operacionais.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => onNavigateTab("frequencia")}
            style={{
              background: "white",
              color: "#1e40af",
              border: "none",
              padding: "10px 18px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 2px 5px rgba(0,0,0,0.15)"
            }}
          >
            <i className="ti ti-clipboard-check" /> Fazer Chamada / Diário
          </button>
          <button
            onClick={() => onNavigateTab("alunos")}
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
            <i className="ti ti-users" /> Lista de Alunos
          </button>
        </div>
      </div>

      {/* Grid de Cards de Estatísticas Principais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Card style={{ padding: "18px 20px", borderLeft: "4px solid #3b82f6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Rotas Ativas</span>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#1f2937", marginTop: 4 }}>
                {stats.totalRotasAtivas} <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>de {rotas.length}</span>
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              <i className="ti ti-route" />
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#4b5563" }}>
            Total de {pontos.length} pontos de embarque cadastrados
          </div>
        </Card>

        <Card style={{ padding: "18px 20px", borderLeft: "4px solid #10b981" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Frota em Operação</span>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#1f2937", marginTop: 4 }}>
                {stats.totalVeiculosOperacionais} <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>veículos</span>
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              <i className="ti ti-bus" />
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#4b5563" }}>
            {veiculos.filter(v => v.acessibilidade).length} adaptados com acessibilidade PCD
          </div>
        </Card>

        <Card style={{ padding: "18px 20px", borderLeft: "4px solid #8b5cf6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Alunos Atendidos</span>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#1f2937", marginTop: 4 }}>
                {stats.totalAlunosAtivos}
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f5f3ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              <i className="ti ti-users" />
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#4b5563" }}>
            {alunos.filter(a => a.necessidadeEspecial && a.necessidadeEspecial !== "Nenhuma").length} com atendimento prioritário/PCD
          </div>
        </Card>

        <Card style={{ padding: "18px 20px", borderLeft: "4px solid #f59e0b" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Equipe de Transporte</span>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#1f2937", marginTop: 4 }}>
                {stats.totalMotoristasAtivos} <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>motoristas</span>
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fffbeb", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              <i className="ti ti-steering-wheel" />
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#4b5563" }}>
            + {stats.totalMonitoresAtivos} monitores(as) de apoio
          </div>
        </Card>

        <Card style={{ padding: "18px 20px", borderLeft: "4px solid #ef4444" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Custos Acumulados</span>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#991b1b", marginTop: 4 }}>
                {stats.custoGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              <i className="ti ti-receipt-tax" />
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#4b5563" }}>
            Combustível: {stats.custoAbastecimento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </Card>
      </div>

      {/* Seção Central: Alertas & Ocupação das Linhas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Painel de Alertas e Vistorias */}
        <Card style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1f2937", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-bell-ringing" style={{ color: "#ef4444" }} /> Alertas & Prazos Importantes
            </h3>
            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
              {stats.alertas.length} pendências
            </span>
          </div>

          {stats.alertas.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "#10b981", background: "#f0fdf4", borderRadius: 8, margin: "auto 0" }}>
              <i className="ti ti-circle-check" style={{ fontSize: 32, display: "block", marginBottom: 8 }} />
              <div style={{ fontWeight: 600, fontSize: 14 }}>Tudo em dia!</div>
              <div style={{ fontSize: 12, color: "#047857" }}>Nenhuma pendência de CNH, vistoria veicular ou superlotação identificada.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto" }}>
              {stats.alertas.map((al, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigateTab(al.tab)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    background: al.tipo === "danger" ? "#fef2f2" : "#fffbeb",
                    borderLeft: `4px solid ${al.tipo === "danger" ? "#ef4444" : "#f59e0b"}`,
                    cursor: "pointer",
                    transition: "transform 0.1s ease"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = "translateX(3px)"}
                  onMouseOut={(e) => e.currentTarget.style.transform = "translateX(0)"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: al.tipo === "danger" ? "#991b1b" : "#92400e" }}>
                      {al.titulo}
                    </span>
                    <Badge color={al.tipo === "danger" ? "red" : "amber"}>Ação Necessária</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: "#4b5563" }}>
                    {al.descricao}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Lotação e Capacidade das Rotas */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1f2937", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-chart-donut" style={{ color: "#2563eb" }} /> Lotação das Rotas Escolares
            </h3>
            <button
              onClick={() => onNavigateTab("rotas")}
              style={{ background: "none", border: "none", color: "#2563eb", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Ver Rotas <i className="ti ti-chevron-right" />
            </button>
          </div>

          {rotas.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "#9ca3af" }}>
              Nenhuma rota cadastrada no momento.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {rotas.slice(0, 5).map(rota => {
                const totalAlunosNaRota = alunos.filter(a => a.rotaId === rota.id && (a.status === "Ativo" || !a.status)).length;
                const veiculo = veiculos.find(v => v.id === rota.veiculoId);
                const cap = Number(veiculo?.capacidade) || 30;
                const pct = Math.min(Math.round((totalAlunosNaRota / cap) * 100), 100);
                const isOver = totalAlunosNaRota > cap;

                return (
                  <div key={rota.id} style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{rota.nome}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: isOver ? "#dc2626" : pct > 80 ? "#d97706" : "#059669" }}>
                        {totalAlunosNaRota} / {cap} assentos ({pct}%)
                      </div>
                    </div>
                    <div style={{ width: "100%", height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: isOver ? "#ef4444" : pct > 80 ? "#f59e0b" : "#10b981",
                          borderRadius: 4,
                          transition: "width 0.3s ease"
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginTop: 6 }}>
                      <span><i className="ti ti-bus" /> {veiculo ? `${veiculo.placa} (${veiculo.tipo})` : "Veículo não atribuído"}</span>
                      <span><i className="ti ti-steering-wheel" /> {rota.motoristaNome || "Sem motorista"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Resumo de Viagens Recentes / Diário de Bordo */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1f2937", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-road" style={{ color: "#7c3aed" }} /> Últimos Registros do Diário de Bordo
          </h3>
          <button
            onClick={() => onNavigateTab("frequencia")}
            style={{ background: "none", border: "none", color: "#2563eb", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Abrir Diário Completo <i className="ti ti-chevron-right" />
          </button>
        </div>

        {viagens.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
            Nenhum registro de viagem recente. Registre viagens e ocorrências na aba Frequência & Diário.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "10px 12px" }}>Data / Turno</th>
                  <th style={{ padding: "10px 12px" }}>Linha / Rota</th>
                  <th style={{ padding: "10px 12px" }}>Veículo / Placa</th>
                  <th style={{ padding: "10px 12px" }}>Motorista</th>
                  <th style={{ padding: "10px 12px" }}>KM Percorrido</th>
                  <th style={{ padding: "10px 12px" }}>Passageiros</th>
                  <th style={{ padding: "10px 12px" }}>Status / Ocorrências</th>
                </tr>
              </thead>
              <tbody>
                {viagens.slice(0, 5).map(v => (
                  <tr key={v.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#1e293b" }}>
                      {new Date(v.data + "T00:00:00").toLocaleDateString("pt-BR")} <span style={{ fontSize: 11, color: "#64748b" }}>({v.turno})</span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>{v.rotaNome}</td>
                    <td style={{ padding: "10px 12px" }}><Badge color="blue">{v.veiculoPlaca}</Badge></td>
                    <td style={{ padding: "10px 12px" }}>{v.motoristaNome}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{v.kmPercorrido ? `${v.kmPercorrido} km` : "-"}</td>
                    <td style={{ padding: "10px 12px" }}>{v.alunosEmbarcados || 0} alunos</td>
                    <td style={{ padding: "10px 12px", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#64748b" }}>
                      {v.ocorrencias || "Sem ocorrências"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
