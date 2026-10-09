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
      <Card style={{ marginBottom:16 }}>
        <div style={{ display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end" }}>
          <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
            <label style={{ fontSize:12,fontWeight:500,color:"#374151" }}>Turma</label>
            <select value={turmaSel} onChange={e=>setTurmaSel(e.target.value)}
              style={{ border:"1px solid #d1d5db",borderRadius:6,padding:"7px 10px",fontSize:13,background:"white",minWidth:120 }}>
              <option value="">Selecione...</option>
              {turmas.map(t=><option key={t.id} value={t.nome}>{t.nome}</option>)}
            </select>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
            <label style={{ fontSize:12,fontWeight:500,color:"#374151" }}>Disciplina</label>
            <select value={discSel} onChange={e=>setDiscSel(e.target.value)}
              style={{ border:"1px solid #d1d5db",borderRadius:6,padding:"7px 10px",fontSize:13,background:"white",minWidth:150 }}>
              {DISCIPLINAS.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <Btn variant="primary" onClick={salvarTodos} disabled={!turmaSel||salvando} style={{ marginLeft:"auto" }}>
            <i className="ti ti-device-floppy" /> {salvando?"Salvando...":"Salvar notas"}
          </Btn>
        </div>
        {salvo && <div style={{ marginTop:10,fontSize:12,color:"#166534",background:"#dcfce7",padding:"6px 10px",borderRadius:6 }}>✓ Notas salvas com sucesso!</div>}
      </Card>

      {!turmaSel ? (
        <div style={{ textAlign:"center",padding:48,color:"#9ca3af" }}>
          <i className="ti ti-clipboard-check" style={{ fontSize:40,display:"block",marginBottom:12 }} />
          <p>Selecione uma turma e disciplina para lançar as notas.</p>
        </div>
      ) : (
        <Card style={{ padding:0,overflow:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign:"left",padding:"10px 12px",fontSize:11,fontWeight:600,color:"#888",borderBottom:"1px solid #e5e5e4" }}>Aluno</th>
                {BIMESTRES_LABELS.map(b=><th key={b} style={{ padding:"10px 12px",fontSize:11,fontWeight:600,color:"#888",borderBottom:"1px solid #e5e5e4",textAlign:"center" }}>{b}</th>)}
                <th style={{ padding:"10px 12px",fontSize:11,fontWeight:600,color:"#888",borderBottom:"1px solid #e5e5e4",textAlign:"center" }}>Média</th>
                <th style={{ padding:"10px 12px",fontSize:11,fontWeight:600,color:"#888",borderBottom:"1px solid #e5e5e4" }}>Situação</th>
              </tr>
            </thead>
            <tbody>
              {alunos.map(a => {
                const n = notasMap[a.id] || {};
                const media = calcularMedia(n);
                const sit = situacaoAluno(media);
                return (
                  <tr key={a.id} style={{ borderBottom:"1px solid #f3f4f6" }}>
                    <td style={{ padding:"8px 12px",fontWeight:500,fontSize:13 }}>{a.nome}</td>
                    {BIMESTRES.map(b=>(
                      <td key={b} style={{ padding:"6px 8px",textAlign:"center" }}>
                        <input type="number" min="0" max="10" step="0.1"
                          value={n[b]??""} onChange={e=>setNota(a.id,b,e.target.value)}
                          placeholder="—"
                          style={{ width:54,border:"1px solid #d1d5db",borderRadius:6,padding:"5px 4px",fontSize:13,textAlign:"center",background:"white",fontFamily:"inherit" }} />
                      </td>
                    ))}
                    <td style={{ padding:"8px 12px",textAlign:"center",fontSize:16,fontWeight:700 }}>{media??'—'}</td>
                    <td style={{ padding:"8px 12px" }}><Badge color={sit.cor}>{sit.label}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
