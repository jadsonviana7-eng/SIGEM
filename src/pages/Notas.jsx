import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getAlunos } from "../services/alunosService";
import { getTurmas } from "../services/turmasService";
import { getNotasTurma, salvarNota } from "../services/notasService";
import { registrarAuditoria } from "../services/auditoriaService";
import { DISCIPLINAS, ANO_LETIVO_ATUAL, calcularMedia, situacaoAluno } from "../utils/constants";
import { Card, Badge, Spinner, Btn } from "../components/ui";

const BIMESTRES = ["b1","b2","b3","b4"];
const BIMESTRES_LABELS = ["1º Bim","2º Bim","3º Bim","4º Bim"];

export default function Notas() {
  const { user, selectedEscolaId, escolas } = useAuth();
  const activeEscolaId = user?.selectedEscolaId || "";
  const escolaAtual = (escolas || []).find(e => e.id === activeEscolaId);

  const { dados: turmas, carregando: cT } = useFirestore(useCallback(() => getTurmas(activeEscolaId), [activeEscolaId]), [activeEscolaId]);
  const { dados: todosAlunos, carregando: cA } = useFirestore(useCallback(() => getAlunos(activeEscolaId), [activeEscolaId]), [activeEscolaId]);
  const [turmaSel, setTurmaSel] = useState("");
  const [discSel, setDiscSel] = useState(DISCIPLINAS[0]);
  const [notasMap, setNotasMap] = useState({});
  const [notasOriginaisMap, setNotasOriginaisMap] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const alunos = todosAlunos.filter(a => a.turma === turmaSel);

  useEffect(() => {
    if (!turmaSel) return;
    setNotasMap({});
    setNotasOriginaisMap({});
    getNotasTurma(turmaSel, discSel, ANO_LETIVO_ATUAL, activeEscolaId).then(rows => {
      const m = {};
      rows.forEach(r => { m[r.alunoId] = r.bimestres || {}; });
      setNotasMap(m);
      // Clona o estado original para detecção precisa de diffs
      setNotasOriginaisMap(JSON.parse(JSON.stringify(m)));
    });
  }, [turmaSel, discSel, activeEscolaId]);

  function setNota(alunoId, bim, valor) {
    setNotasMap(prev => ({ ...prev, [alunoId]: { ...(prev[alunoId]||{}), [bim]: valor } }));
  }

  async function salvarTodos() {
    setSalvando(true);
    try {
      // 1. Salva as notas no Firestore
      await Promise.all(alunos.map(a =>
        salvarNota(a.id, turmaSel, discSel, ANO_LETIVO_ATUAL, notasMap[a.id] || {}, activeEscolaId)
      ));

      // 2. Registra logs de auditoria automáticos para cada nota alterada
      const logsPromises = [];
      alunos.forEach(a => {
        const notasOriginais = notasOriginaisMap[a.id] || {};
        const notasNovas = notasMap[a.id] || {};

        BIMESTRES.forEach((b, idx) => {
          const vAntigoRaw = notasOriginais[b];
          const vNovoRaw = notasNovas[b];

          const vAntigo = (vAntigoRaw !== undefined && vAntigoRaw !== null && vAntigoRaw !== "") ? String(vAntigoRaw).replace(".", ",") : null;
          const vNovo = (vNovoRaw !== undefined && vNovoRaw !== null && vNovoRaw !== "") ? String(vNovoRaw).replace(".", ",") : null;

          if (vAntigo !== vNovo && (vAntigo !== null || vNovo !== null)) {
            const anteriorFmt = vAntigo !== null ? vAntigo : "Sem nota";
            const novoFmt = vNovo !== null ? vNovo : "Sem nota";
            const bLabel = BIMESTRES_LABELS[idx];

            logsPromises.push(
              registrarAuditoria({
                usuario: user,
                escolaId: activeEscolaId,
                escolaNome: escolaAtual?.nome || "Escola Municipal",
                modulo: "Notas",
                acao: "ALTERACAO_NOTA",
                entidade: "Nota",
                entidadeId: `${a.id}_${turmaSel}_${discSel}_${b}`,
                entidadeNome: `${a.nome} (${discSel} - ${bLabel})`,
                registroAnterior: anteriorFmt,
                registroNovo: novoFmt,
                descricao: `${user?.displayName || 'Professor'} alterou a nota de ${a.nome} (${discSel} - ${bLabel}) de ${anteriorFmt} para ${novoFmt}`
              })
            );
          }
        });
      });

      if (logsPromises.length > 0) {
        await Promise.all(logsPromises);
      }

      // Atualiza o mapa original para refletir o estado recém-salvo
      setNotasOriginaisMap(JSON.parse(JSON.stringify(notasMap)));
      setSalvo(true);
      setTimeout(() => setSalvo(false), 3000);
    } catch (err) {
      console.error("Erro ao salvar notas e registrar auditoria:", err);
    } finally { 
      setSalvando(false); 
    }
  }

  if (cT || cA) return <Spinner />;

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1" }}>Turma</label>
            <select
              value={turmaSel}
              onChange={e => setTurmaSel(e.target.value)}
              style={{ border: "1px solid #33435c", borderRadius: 8, padding: "8px 12px", fontSize: 13, background: "#243144", color: "#ffffff", minWidth: 140, outline: "none", cursor: "pointer" }}
            >
              <option value="">Selecione...</option>
              {turmas.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1" }}>Disciplina</label>
            <select
              value={discSel}
              onChange={e => setDiscSel(e.target.value)}
              style={{ border: "1px solid #33435c", borderRadius: 8, padding: "8px 12px", fontSize: 13, background: "#243144", color: "#ffffff", minWidth: 160, outline: "none", cursor: "pointer" }}
            >
              {DISCIPLINAS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <Btn variant="primary" onClick={salvarTodos} disabled={!turmaSel || salvando} style={{ marginLeft: "auto" }}>
            <i className="ti ti-device-floppy" /> {salvando ? "Salvando..." : "Salvar notas"}
          </Btn>
        </div>
        {salvo && (
          <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: "#34d399", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "8px 12px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-check" /> Notas salvas com sucesso!
          </div>
        )}
      </Card>

      {!turmaSel ? (
        <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
          <i className="ti ti-clipboard-check" style={{ fontSize: 40, display: "block", marginBottom: 12, color: "#818cf8" }} />
          <p style={{ fontSize: 13 }}>Selecione uma turma e disciplina para lançar as notas.</p>
        </div>
      ) : (
        <>
          {/* Visualização Desktop: Tabela de Notas */}
          <div className="sigem-desktop-table">
            <Card style={{ padding: 0, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-color)" }}>
                    <th style={{ textAlign: "left", padding: "12px 14px", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Aluno</th>
                    {BIMESTRES_LABELS.map(b => (
                      <th key={b} style={{ padding: "12px 14px", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textAlign: "center" }}>{b}</th>
                    ))}
                    <th style={{ padding: "12px 14px", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textAlign: "center" }}>Média</th>
                    <th style={{ padding: "12px 14px", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {alunos.map(a => {
                    const n = notasMap[a.id] || {};
                    const media = calcularMedia(n);
                    const sit = situacaoAluno(media);
                    return (
                      <tr key={a.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.15s" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{a.nome}</td>
                        {BIMESTRES.map(b => (
                          <td key={b} style={{ padding: "6px 8px", textAlign: "center" }}>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={n[b] ?? ""}
                              onChange={e => setNota(a.id, b, e.target.value)}
                              placeholder="—"
                              style={{
                                width: 58,
                                border: "1px solid var(--border-color)",
                                borderRadius: 8,
                                padding: "6px 4px",
                                fontSize: 13,
                                textAlign: "center",
                                background: "var(--bg-surface)",
                                color: "var(--text-primary)",
                                fontFamily: "inherit",
                                outline: "none"
                              }}
                            />
                          </td>
                        ))}
                        <td style={{ padding: "10px 14px", textAlign: "center", fontSize: 15, fontWeight: 700, color: media !== null ? (media >= 7 ? "#34d399" : media >= 5 ? "#fbbf24" : "#f87171") : "var(--text-muted)" }}>
                          {media ?? "—"}
                        </td>
                        <td style={{ padding: "10px 14px" }}><Badge color={sit.cor}>{sit.label}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Visualização Mobile: Cards Otimizados para Lançamento */}
          <div className="sigem-mobile-cards">
            {alunos.map(a => {
              const n = notasMap[a.id] || {};
              const media = calcularMedia(n);
              const sit = situacaoAluno(media);
              return (
                <div
                  key={`mob-nota-${a.id}`}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 14,
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    boxShadow: "var(--card-shadow)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                      {a.nome}
                    </span>
                    <Badge color={sit.cor}>{sit.label}</Badge>
                  </div>

                  {/* Lançamento Bimestral por Chips */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                    {BIMESTRES.map((b, idx) => (
                      <div key={b} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>{idx + 1}º Bim</span>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={n[b] ?? ""}
                          onChange={e => setNota(a.id, b, e.target.value)}
                          placeholder="—"
                          style={{
                            width: "100%",
                            border: "1px solid var(--border-color)",
                            borderRadius: 8,
                            padding: "8px 2px",
                            fontSize: 14,
                            textAlign: "center",
                            background: "var(--bg-surface)",
                            color: "var(--text-primary)",
                            fontWeight: 600,
                            outline: "none"
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", marginRight: 6 }}>Média Final:</span>
                    <strong style={{ fontSize: 15, color: media !== null ? (media >= 7 ? "#34d399" : media >= 5 ? "#fbbf24" : "#f87171") : "var(--text-muted)" }}>
                      {media ?? "—"}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
