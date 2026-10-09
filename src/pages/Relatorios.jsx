import { useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import { getAlunos } from "../services/alunosService";
import { getProfessores } from "../services/professoresService";
import { getTurmas } from "../services/turmasService";
import { ANOS_LETIVOS, TURNOS } from "../utils/constants";
import { Card, Badge, Spinner, ProgressBar } from "../components/ui";

function Stat({ label, value, cor }) {
  return (
    <div style={{ background:cor||"#f8f8f7",borderRadius:8,padding:"14px 16px",border:"1px solid #e5e5e4",textAlign:"center" }}>
      <div style={{ fontSize:28,fontWeight:700,color:"#1a1a18",marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:12,color:"#888" }}>{label}</div>
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

  const ativos = alunos.filter(a=>a.status==="Ativo").length;
  const transf = alunos.filter(a=>a.status==="Transferido").length;
  const inativos = alunos.filter(a=>a.status==="Inativo").length;

  return (
    <div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24 }}>
        <Stat label="Total de alunos" value={alunos.length} />
        <Stat label="Ativos" value={ativos} cor="#dcfce7" />
        <Stat label="Transferidos" value={transf} cor="#fef9c3" />
        <Stat label="Inativos" value={inativos} cor="#f3f4f6" />
        <Stat label="Professores" value={professores.length} />
        <Stat label="Turmas" value={turmas.length} />
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16 }}>
        <Card>
          <h3 style={{ fontSize:14,fontWeight:600,marginBottom:16 }}>Alunos por ano letivo</h3>
          {ANOS_LETIVOS.map(ano => {
            const q = alunos.filter(a=>a.ano===ano).length;
            const pct = alunos.length ? Math.round(q/alunos.length*100) : 0;
            return (
              <div key={ano} style={{ marginBottom:10 }}>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3 }}>
                  <span style={{ fontWeight:500 }}>{ano}</span>
                  <span style={{ color:"#888" }}>{q} alunos · {pct}%</span>
                </div>
                <ProgressBar valor={pct} />
              </div>
            );
          })}
        </Card>

        <Card>
          <h3 style={{ fontSize:14,fontWeight:600,marginBottom:16 }}>Alunos por turno</h3>
          {TURNOS.map(turno => {
            const q = alunos.filter(a=>a.turno===turno).length;
            const pct = alunos.length ? Math.round(q/alunos.length*100) : 0;
            return (
              <div key={turno} style={{ marginBottom:16 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                  <span style={{ fontWeight:500 }}>{turno}</span>
                  <span style={{ fontWeight:700,fontSize:16 }}>{q}</span>
                </div>
                <ProgressBar valor={pct} />
              </div>
            );
          })}

          <h3 style={{ fontSize:14,fontWeight:600,margin:"20px 0 12px" }}>Por status</h3>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            {["Ativo","Transferido","Inativo","Concluído"].map(s=>{
              const q=alunos.filter(a=>a.status===s).length;
              return <div key={s} style={{ display:"flex",alignItems:"center",gap:6 }}>
                <Badge color={s==="Ativo"?"green":s==="Transferido"?"amber":"gray"}>{s}</Badge>
                <span style={{ fontSize:13,fontWeight:600 }}>{q}</span>
              </div>;
            })}
          </div>
        </Card>
      </div>

      <Card>
        <h3 style={{ fontSize:14,fontWeight:600,marginBottom:16 }}>Professores e disciplinas</h3>
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead><tr>
            {["Professor(a)","Disciplinas","Turno","Contato","Status"].map(h=>(
              <th key={h} style={{ textAlign:"left",padding:"8px 12px",fontSize:11,fontWeight:600,color:"#888",textTransform:"uppercase",borderBottom:"1px solid #e5e5e4" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {professores.map(p=>(
              <tr key={p.id} style={{ borderBottom:"1px solid #f3f4f6" }}>
                <td style={{ padding:"10px 12px",fontWeight:500 }}>{p.nome}</td>
                <td style={{ padding:"10px 12px" }}>{(p.disciplinas||[]).map(d=><Badge key={d} color="blue" style={{ marginRight:3 }}>{d}</Badge>)}</td>
                <td style={{ padding:"10px 12px",fontSize:13 }}>{p.turno}</td>
                <td style={{ padding:"10px 12px",fontSize:12,color:"#555" }}>{p.email}</td>
                <td style={{ padding:"10px 12px" }}><Badge color={p.status==="Ativo"?"green":"amber"}>{p.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
