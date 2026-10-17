import { Btn, Select } from "../../../components/ui";
import { ANO_LETIVO_ATUAL } from "../../../utils/constants";
import styles from "./CadernetaOficial.module.css";

export default function CadernetaOficial({
  turmaSelecionada = "",
  dadosTurmaAtual,
  disciplinaSelecionada = "",
  setDisciplinaSelecionada,
  bimestreSelecionado = "",
  setBimestreSelecionado,
  conteudosFiltrados = [],
  totalAulasRegistradas = 0,
  escolaAtual = {},
  DISCIPLINAS = [],
  BIMESTRES = []
}) {
  return (
    <div className={styles.container}>
      {/* Barra de Controles e Impressão */}
      <div className={styles.controlsCard}>
        <div className={styles.controlsLeft}>
          <h2 className={styles.controlsTitle}>
            <i className="ti ti-printer" style={{ color: "#818cf8" }} />
            Caderneta Oficial de Diário de Classe
          </h2>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Select
              value={disciplinaSelecionada}
              onChange={(e) => setDisciplinaSelecionada(e.target.value)}
              style={{ minWidth: 140 }}
            >
              <option value="">Todas as Disciplinas</option>
              {DISCIPLINAS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>

            <Select
              value={bimestreSelecionado}
              onChange={(e) => setBimestreSelecionado(e.target.value)}
              style={{ minWidth: 140 }}
            >
              <option value="">Todos os Bimestres</option>
              {BIMESTRES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <Btn
          variant="primary"
          onClick={() => window.print()}
          disabled={!conteudosFiltrados.length}
          style={{ fontWeight: 700 }}
        >
          <i className="ti ti-printer" /> Imprimir Folha Oficial
        </Btn>
      </div>

      {/* Visualização da Folha Oficial de Impressão */}
      <div className={styles.paperWrap}>
        <div className={styles.paper}>
          {/* Cabeçalho Oficial */}
          <div className={styles.paperHeader}>
            <div className={styles.headerGov}>
              ESTADO DE ALAGOAS · SECRETARIA MUNICIPAL DE EDUCAÇÃO
            </div>
            <div className={styles.headerSchool}>
              {escolaAtual.nome || "ESCOLA MUNICIPAL"}
            </div>
            <div className={styles.headerDoc}>
              CADERNETA DIGITAL · DIÁRIO OFICIAL DE REGISTRO DE CONTEÚDOS E HABILIDADES (BNCC) · ANO LETIVO {ANO_LETIVO_ATUAL}
            </div>
          </div>

          {/* Quadro de Identificação */}
          <div className={styles.idGrid}>
            <div>
              <strong>Turma:</strong> {turmaSelecionada} ({dadosTurmaAtual?.ano || "—"})
            </div>
            <div>
              <strong>Turno:</strong> {dadosTurmaAtual?.turno || "Matutino"}
            </div>
            <div>
              <strong>Componente:</strong> {disciplinaSelecionada || "Todas as Disciplinas"}
            </div>
            <div>
              <strong>Bimestre:</strong> {bimestreSelecionado || "Todos os Bimestres"}
            </div>
            <div>
              <strong>Carga Horária Cumprida:</strong> {totalAulasRegistradas} hora(s)-aula
            </div>
            <div>
              <strong>Emissão:</strong> {new Date().toLocaleDateString("pt-BR")}
            </div>
          </div>

          {/* Tabela de Aulas Registradas */}
          {!conteudosFiltrados.length ? (
            <div style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
              Nenhum registro de aula localizado para impressão com os filtros selecionados.
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} style={{ textAlign: "left", width: 75 }}>
                    Data
                  </th>
                  <th className={styles.th} style={{ textAlign: "center", width: 45 }}>
                    Aulas
                  </th>
                  <th className={styles.th} style={{ textAlign: "left", width: 100 }}>
                    Disciplina
                  </th>
                  <th className={styles.th} style={{ textAlign: "left" }}>
                    Conteúdo Ministrado
                  </th>
                  <th className={styles.th} style={{ textAlign: "left", width: 140 }}>
                    Habilidade (BNCC)
                  </th>
                  <th className={styles.th} style={{ textAlign: "left", width: 110 }}>
                    Docente
                  </th>
                </tr>
              </thead>
              <tbody>
                {conteudosFiltrados.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className={styles.td} style={{ whiteSpace: "nowrap" }}>
                      {item.data
                        ? new Date(item.data + "T12:00:00").toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td className={styles.td} style={{ textAlign: "center", fontWeight: 700 }}>
                      {item.aulasQtd || 1}
                    </td>
                    <td className={styles.td} style={{ fontWeight: 600 }}>
                      {item.disciplina}
                    </td>
                    <td className={styles.td}>
                      <div>{item.conteudo}</div>
                      {item.observacao && (
                        <div
                          style={{
                            fontSize: 9,
                            color: "#64748b",
                            fontStyle: "italic",
                            marginTop: 2
                          }}
                        >
                          Obs: {item.observacao}
                        </div>
                      )}
                    </td>
                    <td className={styles.td} style={{ fontSize: 9.5 }}>
                      {item.habilidades || "—"}
                    </td>
                    <td className={styles.td} style={{ fontSize: 9.5 }}>
                      {item.professor || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Assinaturas Oficiais */}
          <div className={styles.signatures}>
            <div>
              <div className={styles.sigLine}>Assinatura do(a) Professor(a) Regente</div>
            </div>
            <div>
              <div className={styles.sigLine}>Coordenação Pedagógica / Visto</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
