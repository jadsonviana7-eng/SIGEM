import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getAlunos } from "../services/alunosService";
import { getTurmas } from "../services/turmasService";
import { getFrequenciasTurma, salvarFrequencia, salvarDiarioDeClasse } from "../services/frequenciaService";
import { registrarAuditoria } from "../services/auditoriaService";
import { MESES, ANO_LETIVO_ATUAL, calcularFrequencia, DISCIPLINAS } from "../utils/constants";
import { Card, Badge, Spinner, Btn, Input, Alert } from "../components/ui";

export default function Frequencia() {
  const { user, selectedEscolaId, escolas } = useAuth();
  const activeEscolaId = user?.selectedEscolaId || "";
  const escolaAtual = (escolas || []).find(e => e.id === activeEscolaId);

  const { dados: turmas, carregando: cT } = useFirestore(useCallback(() => getTurmas(activeEscolaId), [activeEscolaId]), [activeEscolaId]);
  const { dados: todosAlunos, carregando: cA } = useFirestore(useCallback(() => getAlunos(activeEscolaId), [activeEscolaId]), [activeEscolaId]);
  
  const [abaAtiva, setAbaAtiva] = useState("diario");
  const [salvando, setSalvando] = useState(false);
  const [alerta, setAlerta] = useState(null);

  // Estados do Mapa de Frequência
  const [turmaSel, setTurmaSel] = useState("");
  const [mesSel, setMesSel] = useState(new Date().getMonth());
  const [freqMap, setFreqMap] = useState({});

  // Estados do Diário de Classe
  const [diarioTurma, setDiarioTurma] = useState("");
  const [diarioData, setDiarioData] = useState(new Date().toISOString().split('T')[0]);
  const [diarioDisciplina, setDiarioDisciplina] = useState("");
  const [diarioAulas, setDiarioAulas] = useState(1);
  const [diarioConteudo, setDiarioConteudo] = useState("");
  const [frequenciaDiaria, setFrequenciaDiaria] = useState({}); // { alunoId: "P" | "F" }

  const alunosMapa = todosAlunos.filter(a => a.turma === turmaSel);
  const alunosDiario = todosAlunos.filter(a => a.turma === diarioTurma);
  const diasNoMes = new Date(ANO_LETIVO_ATUAL, mesSel + 1, 0).getDate();
  const dias = Array.from({ length: diasNoMes }, (_, i) => i + 1);

  const isAnosFinais = ["5º", "6º", "7º", "8º", "9º"].some(ano => diarioTurma.includes(ano));

  // Atualiza o mapa mensal
  useEffect(() => {
    if (!turmaSel) return;
    setFreqMap({});
    getFrequenciasTurma(turmaSel, ANO_LETIVO_ATUAL, mesSel, activeEscolaId).then(rows => {
      const m = {};
      rows.forEach(r => { m[r.alunoId] = r.dias || {}; });
      setFreqMap(m);
    });
  }, [turmaSel, mesSel, activeEscolaId]);

  // Atualiza checkboxes do diário quando troca de turma
  useEffect(() => {
    const f = {};
    alunosDiario.forEach(a => {
      f[a.id] = "F"; // Checkboxes começam desmarcados (Falta por padrão)
    });
    setFrequenciaDiaria(f);
    if (!isAnosFinais) {
      setDiarioDisciplina("Geral");
    } else {
      setDiarioDisciplina("");
    }
  }, [diarioTurma, todosAlunos, isAnosFinais]); // eslint-disable-line

  function toggleMapa(alunoId, dia) {
    setFreqMap(prev => {
      const atual = (prev[alunoId] || {})[dia];
      const prox = atual === undefined ? "P" : atual === "P" ? "F" : undefined;
      const novo = { ...(prev[alunoId] || {}), [dia]: prox };
      if (prox === undefined) delete novo[dia];
      return { ...prev, [alunoId]: novo };
    });
  }

  async function salvarMapa() {
    if (!turmaSel) return;
    setSalvando(true);
    try {
      await Promise.all(alunosMapa.map(a =>
        salvarFrequencia(a.id, turmaSel, ANO_LETIVO_ATUAL, mesSel, freqMap[a.id] || {}, activeEscolaId)
      ));

      await registrarAuditoria({
        usuario: user,
        escolaId: activeEscolaId,
        escolaNome: escolaAtual?.nome || "Escola Municipal",
        modulo: "Frequência",
        acao: "ALTERACAO_FREQUENCIA",
        entidade: "Frequência Mensal",
        entidadeId: `${turmaSel}_${mesSel}`,
        entidadeNome: `Mapa de Frequência - ${turmaSel} (${MESES[mesSel]})`,
        registroAnterior: "Versão Anterior",
        registroNovo: "Mapa Atualizado",
        descricao: `${user?.displayName || 'Professor'} atualizou o mapa de frequência da turma ${turmaSel} para o mês de ${MESES[mesSel]}`
      });

      setAlerta({ msg: "Mapa de frequência salvo com sucesso!", tipo: "success" });
      setTimeout(() => setAlerta(null), 3000);
    } catch (e) {
      setAlerta({ msg: "Erro: " + e.message, tipo: "error" });
    } finally { setSalvando(false); }
  }

  async function salvarDiario() {
    if (!diarioTurma) { alert("Selecione uma turma."); return; }
    if (!diarioData) { alert("Informe a data."); return; }
    if (isAnosFinais && !diarioDisciplina) { alert("Selecione a disciplina."); return; }
    if (!diarioConteudo) { alert("Preencha o conteúdo ministrado."); return; }

    setSalvando(true);
    try {
      const diario = {
        turma: diarioTurma,
        data: diarioData,
        disciplina: isAnosFinais ? diarioDisciplina : "Geral",
        aulasDadas: diarioAulas,
        conteudo: diarioConteudo,
        professor: user?.displayName || "Desconhecido"
      };

      const docId = await salvarDiarioDeClasse(diario, frequenciaDiaria, activeEscolaId);

      // Total de faltas e presenças
      const totalPresentes = Object.values(frequenciaDiaria).filter(v => v === "P").length;
      const totalFaltas = Object.values(frequenciaDiaria).filter(v => v === "F").length;

      await registrarAuditoria({
        usuario: user,
        escolaId: activeEscolaId,
        escolaNome: escolaAtual?.nome || "Escola Municipal",
        modulo: "Frequência",
        acao: "LANCAMENTO_FREQUENCIA",
        entidade: "Diário de Classe",
        entidadeId: docId || "",
        entidadeNome: `Diário - ${diarioTurma} (${diario.disciplina})`,
        registroAnterior: "Não Lançado",
        registroNovo: `${totalPresentes} Presentes / ${totalFaltas} Faltas (Data: ${diarioData})`,
        descricao: `${user?.displayName || 'Professor'} lançou o diário de classe da turma ${diarioTurma} em ${diarioData}: ${totalPresentes} presentes e ${totalFaltas} faltas`
      });
      
      setAlerta({ msg: "Diário salvo com sucesso!", tipo: "success" });
      setTimeout(() => setAlerta(null), 3000);
      
      // Reseta os campos após salvar
      setDiarioConteudo("");
      if (isAnosFinais) setDiarioDisciplina("");
      setDiarioAulas(1);
      // Reinicia os checkboxes como faltas
      const f = {};
      alunosDiario.forEach(a => { f[a.id] = "F"; });
      setFrequenciaDiaria(f);
    } catch (e) {
      setAlerta({ msg: "Erro ao salvar diário: " + e.message, tipo: "error" });
    } finally {
      setSalvando(false);
    }
  }

  if (cT || cA) return <Spinner />;

  return (
    <div>
      {alerta && <Alert tipo={alerta.tipo}>{alerta.msg}</Alert>}

      <div style={{ display: "flex", borderBottom: "1px solid #e5e5e4", marginBottom: 16, gap: 8 }}>
        <button
          onClick={() => setAbaAtiva("diario")}
          style={{
            padding: "10px 16px", background: "none", border: "none", fontSize: 14, fontWeight: 600,
            borderBottom: abaAtiva === "diario" ? "2px solid #1a56db" : "2px solid transparent",
            color: abaAtiva === "diario" ? "#1a56db" : "#6b7280", cursor: "pointer"
          }}
        >
          <i className="ti ti-book" style={{ marginRight: 6 }} />
          Diário de Classe
        </button>
        <button
          onClick={() => setAbaAtiva("mapa")}
          style={{
            padding: "10px 16px", background: "none", border: "none", fontSize: 14, fontWeight: 600,
            borderBottom: abaAtiva === "mapa" ? "2px solid #1a56db" : "2px solid transparent",
            color: abaAtiva === "mapa" ? "#1a56db" : "#6b7280", cursor: "pointer"
          }}
        >
          <i className="ti ti-calendar-check" style={{ marginRight: 6 }} />
          Mapa Mensal
        </button>
      </div>

      {abaAtiva === "diario" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>Turma *</label>
                <select value={diarioTurma} onChange={e => setDiarioTurma(e.target.value)} style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 10px", fontSize: 13, background: "white" }}>
                  <option value="">Selecione...</option>
                  {turmas.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                </select>
              </div>
              <Input label="Data da Aula *" type="date" value={diarioData} onChange={e => setDiarioData(e.target.value)} />
              {isAnosFinais && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>Disciplina *</label>
                  <select value={diarioDisciplina} onChange={e => setDiarioDisciplina(e.target.value)} style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 10px", fontSize: 13, background: "white" }}>
                    <option value="">Selecione...</option>
                    {DISCIPLINAS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
              <Input label="Aulas Dadas *" type="number" min={1} value={diarioAulas} onChange={e => setDiarioAulas(+e.target.value)} />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Conteúdo Ministrado *</label>
              <textarea
                value={diarioConteudo}
                onChange={e => setDiarioConteudo(e.target.value)}
                placeholder="Descreva o conteúdo ministrado nesta aula..."
                style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "10px", fontSize: 13, background: "white", minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
              />
            </div>
          </Card>

          {!diarioTurma ? (
            <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
              <i className="ti ti-users" style={{ fontSize: 40, display: "block", marginBottom: 12 }} />
              <p>Selecione uma turma para realizar a chamada.</p>
            </div>
          ) : !alunosDiario.length ? (
            <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}><p>Nenhum aluno nesta turma.</p></div>
          ) : (
            <Card style={{ padding: 0, overflow: "auto" }}>
              <div style={{ padding: "12px 16px", background: "#f9fafb", borderBottom: "1px solid #e5e5e4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#4b5563" }}>Lista de Alunos ({alunosDiario.length})</span>
                <Btn variant="primary" onClick={salvarDiario} disabled={salvando}>
                  <i className="ti ti-device-floppy" /> {salvando ? "Salvando..." : "Salvar Diário de Classe"}
                </Btn>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ width: 60, textAlign: "center", padding: "12px", fontSize: 11, fontWeight: 600, color: "#888", borderBottom: "1px solid #e5e5e4" }}>Presença</th>
                    <th style={{ textAlign: "left", padding: "12px", fontSize: 11, fontWeight: 600, color: "#888", borderBottom: "1px solid #e5e5e4" }}>Aluno</th>
                  </tr>
                </thead>
                <tbody>
                  {alunosDiario.map(a => {
                    const presente = frequenciaDiaria[a.id] === "P";
                    return (
                      <tr key={a.id} style={{ borderBottom: "1px solid #f3f4f6", background: presente ? "white" : "#fff1f2" }}>
                        <td style={{ textAlign: "center", padding: "12px" }}>
                          <input
                            type="checkbox"
                            checked={presente}
                            onChange={(e) => setFrequenciaDiaria({ ...frequenciaDiaria, [a.id]: e.target.checked ? "P" : "F" })}
                            style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#16a34a" }}
                          />
                        </td>
                        <td style={{ padding: "12px", fontSize: 13, fontWeight: 500, color: presente ? "#1f2937" : "#991b1b" }}>
                          {a.nome}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {abaAtiva === "mapa" && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>Turma</label>
                <select value={turmaSel} onChange={e => setTurmaSel(e.target.value)}
                  style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "7px 10px", fontSize: 13, background: "white", minWidth: 120 }}>
                  <option value="">Selecione...</option>
                  {turmas.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>Mês</label>
                <select value={mesSel} onChange={e => setMesSel(+e.target.value)}
                  style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "7px 10px", fontSize: 13, background: "white", minWidth: 130 }}>
                  {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <Btn variant="primary" onClick={salvarMapa} disabled={!turmaSel || salvando} style={{ marginLeft: "auto" }}>
                <i className="ti ti-device-floppy" /> {salvando ? "Salvando..." : "Salvar mapa"}
              </Btn>
            </div>
          </Card>

          {!turmaSel ? (
            <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
              <i className="ti ti-calendar-check" style={{ fontSize: 40, display: "block", marginBottom: 12 }} />
              <p>Selecione uma turma para consultar o mapa.</p>
            </div>
          ) : !alunosMapa.length ? (
            <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}><p>Nenhum aluno nesta turma.</p></div>
          ) : (
            <Card style={{ padding: 0, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                <thead>
                  <tr>
                    <th style={{ position: "sticky", left: 0, background: "white", textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#888", borderBottom: "1px solid #e5e5e4", whiteSpace: "nowrap" }}>Aluno</th>
                    {dias.map(d => <th key={d} style={{ padding: "6px 2px", fontSize: 10, fontWeight: 600, color: "#888", textAlign: "center", borderBottom: "1px solid #e5e5e4", minWidth: 28 }}>{d}</th>)}
                    <th style={{ padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#888", borderBottom: "1px solid #e5e5e4", textAlign: "center" }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {alunosMapa.map(a => {
                    const dias_aluno = freqMap[a.id] || {};
                    const pct = calcularFrequencia(dias_aluno);
                    const [primeiro, ...resto] = a.nome.split(" ");
                    const nomeExib = `${primeiro} ${resto[resto.length - 1] || ""}`.trim();
                    return (
                      <tr key={a.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ position: "sticky", left: 0, background: "white", padding: "8px 12px", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap" }}>{nomeExib}</td>
                        {dias.map(d => {
                          const v = dias_aluno[d];
                          const bg = v === "P" ? "#dcfce7" : v === "F" ? "#fee2e2" : "#f9fafb";
                          const cor = v === "P" ? "#166534" : v === "F" ? "#991b1b" : "#9ca3af";
                          return (
                            <td key={d} style={{ padding: "2px", textAlign: "center" }}>
                              <div onClick={() => toggleMapa(a.id, d)} title="Clique para alternar"
                                style={{ width: 24, height: 24, borderRadius: 4, background: bg, color: cor, display: "flex", alignItems: "center", justifyContent: "center", margin: "auto", cursor: "pointer", fontSize: 10, fontWeight: 600, border: `1px solid ${v === "P" ? "#86efac" : v === "F" ? "#fca5a5" : "#e5e5e4"}` }}>
                                {v || "·"}
                              </div>
                            </td>
                          );
                        })}
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                          <Badge color={pct >= 75 ? "green" : "red"}>{pct}%</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
