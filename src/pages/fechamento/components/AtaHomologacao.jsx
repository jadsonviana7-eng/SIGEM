import { Btn } from "../../../components/ui";
import styles from "./AtaHomologacao.module.css";

export default function AtaHomologacao({
  bimestre = "1º Bimestre",
  anoLetivo = "2026",
  escolaAtual = {},
  listaFechamentos = [],
  totalGeral = 1,
  totalFechadas = 0,
  STATUS_FECHAMENTO = {}
}) {
  return (
    <div className={styles.container}>
      {/* Barra de Controles e Impressão */}
      <div className={styles.controlsCard}>
        <div className={styles.controlsLeft}>
          <h2 className={styles.controlsTitle}>
            <i className="ti ti-printer" style={{ color: "#38bdf8" }} />
            Ata Oficial de Homologação de Período Letivo
          </h2>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            {bimestre} · Ano Letivo {anoLetivo}
          </span>
        </div>

        <Btn
          variant="primary"
          onClick={() => window.print()}
          style={{ fontWeight: 700 }}
        >
          <i className="ti ti-printer" /> Imprimir Documento Oficial
        </Btn>
      </div>

      {/* Visualização da Folha Oficial de Impressão */}
      <div className={styles.paperWrap}>
        <div className={styles.paper}>
          {/* Cabeçalho */}
          <div className={styles.paperHeader}>
            <div className={styles.govTitle}>
              ESTADO DE ALAGOAS · PREFEITURA MUNICIPAL DE PORTO CALVO
            </div>
            <div className={styles.secTitle}>SECRETARIA MUNICIPAL DE EDUCAÇÃO</div>
            <div className={styles.schoolTitle}>
              {escolaAtual.nome || "ESCOLA MUNICIPAL"} · CÓDIGO INEP: {escolaAtual.inep || "27000000"}
            </div>
            <div className={styles.badgeAta}>
              ATA DE FECHAMENTO E HOMOLOGAÇÃO DO {bimestre.toUpperCase()} · ANO LETIVO {anoLetivo}
            </div>
          </div>

          {/* Texto Legal da Ata */}
          <p className={styles.legalText}>
            Aos{" "}
            {new Date().toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric"
            })}
            , nesta Unidade Escolar, reuniu-se a Coordenação Pedagógica e Direção Escolar para a
            homologação dos diários eletrônicos de classe correspondentes ao{" "}
            <strong>{bimestre}</strong>. Registra-se que das <strong>{totalGeral}</strong> turmas
            matriculadas, <strong>{totalFechadas}</strong> turmas foram devidamente fechadas e
            trancadas 🔒 no sistema digital, estando em conformidade com as diretrizes curriculares e
            registros de frequência, notas e conteúdos ministrados.
          </p>

          {/* Tabela Resumo */}
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Turma</th>
                <th className={styles.th}>Professor</th>
                <th className={styles.th} style={{ textAlign: "center", width: 80 }}>
                  Aulas
                </th>
                <th className={styles.th} style={{ textAlign: "center", width: 130 }}>
                  Status
                </th>
                <th className={styles.th}>Validação / Parecer</th>
              </tr>
            </thead>
            <tbody>
              {listaFechamentos.map((f) => (
                <tr key={f.id}>
                  <td className={styles.td} style={{ fontWeight: "bold" }}>
                    {f.turma} ({f.turno})
                  </td>
                  <td className={styles.td}>{f.professor || "Não atribuído"}</td>
                  <td className={styles.td} style={{ textAlign: "center" }}>
                    {f.totalAulasDadas || 0} h/a
                  </td>
                  <td className={styles.td} style={{ textAlign: "center" }}>
                    {f.status === STATUS_FECHAMENTO.FECHADO ? (
                      <span style={{ fontWeight: 700, color: "#15803d" }}>FECHADO 🔒</span>
                    ) : (
                      <span style={{ fontWeight: 600 }}>{f.status.toUpperCase()}</span>
                    )}
                  </td>
                  <td className={styles.td}>
                    {f.validadoPor
                      ? `Validado por ${f.validadoPor}`
                      : f.status === STATUS_FECHAMENTO.AGUARDANDO_VALIDACAO
                      ? "Aguardando homologação"
                      : "Em lançamento"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Assinaturas */}
          <div className={styles.signatures}>
            <div>
              <div style={{ width: 220, borderTop: "1px solid #000", margin: "0 auto 4px" }} />
              <div className={styles.sigLine}>Coordenação Pedagógica</div>
              <div style={{ fontSize: 9, color: "#475569" }}>Porto Calvo / AL</div>
            </div>
            <div>
              <div style={{ width: 220, borderTop: "1px solid #000", margin: "0 auto 4px" }} />
              <div className={styles.sigLine}>Direção Escolar</div>
              <div style={{ fontSize: 9, color: "#475569" }}>Porto Calvo / AL</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
