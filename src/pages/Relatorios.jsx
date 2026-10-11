import { useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getAlunos } from "../services/alunosService";
import { getProfessores } from "../services/professoresService";
import { getTurmas } from "../services/turmasService";
import { ANOS_LETIVOS, TURNOS } from "../utils/constants";
import { Card, Badge, Spinner, ProgressBar } from "../components/ui";

function Stat({ label, value, cor, numCor, borderCor }) {
  return (
    <div
      style={{
        background: cor || "#1e293b",
        borderRadius: 8,
        padding: "14px 16px",
        border: `1px solid ${borderCor || "#33435c"}`,
        textAlign: "center"
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color: numCor || "#ffffff", marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function Relatorios() {
  const { user, selectedEscolaId } = useAuth();
  const activeEscolaId = user?.selectedEscolaId || "";

  const { dados: alunos, carregando: cA } = useFirestore(useCallback(() => getAlunos(activeEscolaId), [activeEscolaId]), [activeEscolaId]);
  const { dados: professores, carregando: cP } = useFirestore(useCallback(() => getProfessores(activeEscolaId), [activeEscolaId]), [activeEscolaId]);
  const { dados: turmas, carregando: cT } = useFirestore(useCallback(() => getTurmas(activeEscolaId), [activeEscolaId]), [activeEscolaId]);

  if (cA || cP || cT) return <Spinner />;

  const ativos = alunos.filter(a => a.status === "Ativo").length;
  const transf = alunos.filter(a => a.status === "Transferido").length;
  const inativos = alunos.filter(a => a.status === "Inativo").length;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        <Stat
          label="Total de alunos"
          value={alunos.length}
          cor="rgba(59, 130, 246, 0.1)"
          numCor="#60a5fa"
          borderCor="rgba(59, 130, 246, 0.25)"
        />
        <Stat
          label="Ativos"
          value={ativos}
          cor="rgba(16, 185, 129, 0.1)"
          numCor="#34d399"
          borderCor="rgba(16, 185, 129, 0.25)"
        />
        <Stat
          label="Transferidos"
          value={transf}
          cor="rgba(245, 158, 11, 0.1)"
          numCor="#fbbf24"
          borderCor="rgba(245, 158, 11, 0.25)"
        />
        <Stat
          label="Inativos"
          value={inativos}
          cor="rgba(148, 163, 184, 0.1)"
          numCor="#94a3b8"
          borderCor="rgba(148, 163, 184, 0.25)"
        />
        <Stat
          label="Professores"
          value={professores.length}
          cor="rgba(139, 92, 246, 0.1)"
          numCor="#a78bfa"
          borderCor="rgba(139, 92, 246, 0.25)"
        />
        <Stat
          label="Turmas"
          value={turmas.length}
          cor="rgba(14, 165, 233, 0.1)"
          numCor="#38bdf8"
          borderCor="rgba(14, 165, 233, 0.25)"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "#ffffff" }}>Alunos por ano letivo</h3>
          {ANOS_LETIVOS.map(ano => {
            const q = alunos.filter(a => a.ano === ano).length;
            const pct = alunos.length ? Math.round((q / alunos.length) * 100) : 0;
            return (
              <div key={ano} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500, color: "#f8fafc" }}>{ano}</span>
                  <span style={{ color: "#94a3b8" }}>{q} alunos · {pct}%</span>
                </div>
                <ProgressBar valor={pct} />
              </div>
            );
          })}
        </Card>

        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "#ffffff" }}>Alunos por turno</h3>
          {TURNOS.map(turno => {
            const q = alunos.filter(a => a.turno === turno).length;
            const pct = alunos.length ? Math.round((q / alunos.length) * 100) : 0;
            return (
              <div key={turno} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontWeight: 500, color: "#f8fafc" }}>{turno}</span>
                  <span style={{ fontWeight: 700, fontSize: 16, color: "#ffffff" }}>{q}</span>
                </div>
                <ProgressBar valor={pct} />
              </div>
            );
          })}

          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "20px 0 12px", color: "#ffffff" }}>Por status</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {["Ativo", "Transferido", "Inativo", "Concluído"].map(s => {
              const q = alunos.filter(a => a.status === s).length;
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Badge color={s === "Ativo" ? "green" : s === "Transferido" ? "amber" : "gray"}>{s}</Badge>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>{q}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #33435c" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#ffffff" }}>Professores e disciplinas</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#243144", borderBottom: "1px solid #33435c" }}>
              {["Professor(a)", "Disciplinas", "Turno", "Contato", "Status"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#cbd5e1", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {professores.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid #2c3b52" }}>
                <td style={{ padding: "10px 14px", fontWeight: 500, color: "#f8fafc" }}>{p.nome}</td>
                <td style={{ padding: "10px 14px" }}>{(p.disciplinas || []).map(d => <Badge key={d} color="blue" style={{ marginRight: 4 }}>{d}</Badge>)}</td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: "#cbd5e1" }}>{p.turno}</td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "#94a3b8" }}>{p.email}</td>
                <td style={{ padding: "10px 14px" }}><Badge color={p.status === "Ativo" ? "green" : "amber"}>{p.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
