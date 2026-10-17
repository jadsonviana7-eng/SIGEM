import React, { useState, useMemo } from "react";
import {
  addMensagem,
  deleteMensagem
} from "../../../services/comunicacaoService";
import {
  Btn,
  Modal,
  Input,
  Select,
  Alert
} from "../../../components/ui";
import styles from "./MensagensEscola.module.css";

const MODELOS_MENSAGEM = [
  {
    id: "elogio",
    titulo: "🌟 Elogio de Desempenho",
    texto: "Prezado(a) responsável, gostaríamos de parabenizá-lo(a) pelo excelente desempenho e dedicação demonstrados pelo(a) estudante nas atividades escolares desta semana. Continuem incentivando!"
  },
  {
    id: "material",
    titulo: "🎒 Lembrete de Material",
    texto: "Prezado(a) responsável, solicitamos a gentileza de verificar os materiais escolares e uso diário do uniforme completo do estudante para o melhor aproveitamento das atividades pedagógicas."
  },
  {
    id: "comparecimento",
    titulo: "🏫 Comparecimento à Coordenação",
    texto: "Prezado(a) responsável, solicitamos o seu comparecimento à coordenação pedagógica da escola em data oportuna para tratarmos do acompanhamento acadêmico do estudante."
  },
  {
    id: "saude",
    titulo: "💊 Notificação de Saúde",
    texto: "Prezado(a) responsável, informamos que o(a) estudante apresentou leve indisposição durante o turno de aulas. Ele(a) está acolhido(a) na secretaria sob cuidados."
  },
  {
    id: "documentacao",
    titulo: "📑 Regularização de Documentos",
    texto: "Prezado(a) responsável, solicitamos o envio das cópias dos documentos pendentes para atualização cadastral da pasta do estudante na secretaria escolar."
  }
];

export default function MensagensEscola({
  mensagens = [],
  alunos = [],
  turmas = [],
  escolaId,
  selectedEscola,
  onRefresh
}) {
  const [busca, setBusca] = useState("");
  const [filtroCanal, setFiltroCanal] = useState("");
  const [modalNovaMensagem, setModalNovaMensagem] = useState(false);
  const [modalExclusao, setModalExclusao] = useState(null);

  const [tipoEnvio, setTipoEnvio] = useState("INDIVIDUAL"); // INDIVIDUAL | TURMA | GERAL
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState("");
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState("");
  const [assunto, setAssunto] = useState("");
  const [corpoMensagem, setCorpoMensagem] = useState("");
  const [canal, setCanal] = useState("WhatsApp & Mural");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(null);

  const alunoObj = useMemo(() => {
    return alunos.find((a) => a.id === alunoSelecionadoId);
  }, [alunos, alunoSelecionadoId]);

  // KPIs
  const kpis = useMemo(() => {
    const total = mensagens.length;
    const individuais = mensagens.filter(m => m.destinatarioTipo === "Individual" || m.alunoNome).length;
    const turmasGeral = mensagens.filter(m => m.destinatarioTipo === "Turma Completa" || m.destinatarioTipo === "Toda a Escola").length;
    const viaWhatsApp = mensagens.filter(m => (m.canal || "").includes("WhatsApp")).length;

    return {
      total,
      individuais,
      turmasGeral,
      viaWhatsApp
    };
  }, [mensagens]);

  const aplicarModelo = (modelo) => {
    setAssunto(modelo.titulo.replace(/[^\w\sÀ-ú]/g, "").trim());
    setCorpoMensagem(modelo.texto);
    setModalNovaMensagem(true);
  };

  const handleEnviarMensagem = async (e) => {
    e.preventDefault();
    if (!corpoMensagem.trim() || !assunto.trim()) {
      alert("Por favor, preencha o assunto e o texto da mensagem.");
      return;
    }

    if (tipoEnvio === "INDIVIDUAL" && !alunoSelecionadoId) {
      alert("Por favor, selecione o aluno destinatário.");
      return;
    }

    setEnviando(true);
    try {
      let destInfo = {};
      if (tipoEnvio === "INDIVIDUAL" && alunoObj) {
        destInfo = {
          destinatarioTipo: "Individual",
          alunoNome: alunoObj.nome,
          alunoId: alunoObj.id,
          responsavelNome: alunoObj.responsavelNome || alunoObj.responsavel || "Responsável Legal",
          responsavelTelefone: alunoObj.responsavelTelefone || alunoObj.telefone || "(87) 98845-1234"
        };
      } else if (tipoEnvio === "TURMA") {
        const tObj = turmas.find((t) => t.id === turmaSelecionadaId || t.nome === turmaSelecionadaId);
        destInfo = {
          destinatarioTipo: "Turma Completa",
          turmaNome: tObj?.nome || turmaSelecionadaId || "Turma"
        };
      } else {
        destInfo = {
          destinatarioTipo: "Toda a Escola",
          publico: "Todos os Responsáveis"
        };
      }

      const novaMsg = {
        ...destInfo,
        tipo: "Mensagem Direta",
        assunto,
        conteudo: corpoMensagem,
        canal,
        autor: "Secretaria / Gestão Escolar",
        status: "Enviada"
      };

      await addMensagem(novaMsg, escolaId);

      // Se for individual e canal envolver WhatsApp, abrir link
      if (tipoEnvio === "INDIVIDUAL" && alunoObj && canal.includes("WhatsApp")) {
        const nomeEscola = selectedEscola?.nome || "Escola Municipal";
        const textoWA = `*${assunto.toUpperCase()}*\n🏫 *${nomeEscola}*\n\n` +
          `Olá, *${destInfo.responsavelNome}* (Responsável por *${destInfo.alunoNome}*),\n\n` +
          `${corpoMensagem}\n\n` +
          `_Atenciosamente, Gestão Escolar · SIGEM_`;

        const foneLimpo = (destInfo.responsavelTelefone || "").replace(/\D/g, "");
        if (foneLimpo) {
          window.open(`https://api.whatsapp.com/send?phone=55${foneLimpo}&text=${encodeURIComponent(textoWA)}`, "_blank");
        }
      }

      setSucesso("Mensagem registrada e enviada com sucesso!");
      setModalNovaMensagem(false);
      setAssunto("");
      setCorpoMensagem("");
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar mensagem: " + err.message);
    } finally {
      setEnviando(false);
    }
  };

  const handleExcluir = async () => {
    if (!modalExclusao) return;
    try {
      await deleteMensagem(modalExclusao.id);
      setModalExclusao(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir: " + err.message);
    }
  };

  const handleReenviarWhatsApp = (msg) => {
    const nomeEscola = selectedEscola?.nome || "Escola Municipal";
    const textoWA = `*${(msg.assunto || msg.tipo || "COMUNICADO").toUpperCase()}*\n🏫 *${nomeEscola}*\n\n` +
      `Olá, *${msg.responsavelNome || "Família"}* (Estudante: *${msg.alunoNome || "Aluno"}*),\n\n` +
      `${msg.conteudo}\n\n` +
      `_Atenciosamente, Equipe Gestora · SIGEM_`;

    const foneLimpo = (msg.responsavelTelefone || "").replace(/\D/g, "");
    if (foneLimpo) {
      window.open(`https://api.whatsapp.com/send?phone=55${foneLimpo}&text=${encodeURIComponent(textoWA)}`, "_blank");
    } else {
      navigator.clipboard.writeText(textoWA);
      alert("Texto formatado copiado para a área de transferência!");
    }
  };

  // Filtragem
  const mensagensFiltradas = useMemo(() => {
    return mensagens.filter((m) => {
      const q = busca.toLowerCase();
      const matchBusca =
        !busca ||
        (m.assunto || "").toLowerCase().includes(q) ||
        (m.conteudo || "").toLowerCase().includes(q) ||
        (m.alunoNome || "").toLowerCase().includes(q) ||
        (m.responsavelNome || "").toLowerCase().includes(q) ||
        (m.turmaNome || "").toLowerCase().includes(q);
      const matchCanal = !filtroCanal || (m.canal || "").includes(filtroCanal);
      return matchBusca && matchCanal;
    });
  }, [mensagens, busca, filtroCanal]);

  const limparFiltros = () => {
    setBusca("");
    setFiltroCanal("");
  };

  return (
    <div className={styles.container}>
      {/* 1. INDICADORES RÁPIDOS (KPIS) */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
            <i className="ti ti-messages" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.total}</span>
            <span className={styles.statLabel}>Mensagens Enviadas</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(2, 132, 199, 0.15)", color: "#38bdf8" }}>
            <i className="ti ti-user-check" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.individuais}</span>
            <span className={styles.statLabel}>Atendimentos Individuais</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa" }}>
            <i className="ti ti-users-group" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.turmasGeral}</span>
            <span className={styles.statLabel}>Disparos por Turma</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(34, 197, 94, 0.15)", color: "#4ade80" }}>
            <i className="ti ti-brand-whatsapp" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{kpis.viaWhatsApp}</span>
            <span className={styles.statLabel}>WhatsApp Integrado</span>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE CABEÇALHO */}
      <div className={styles.headerBar}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <i className="ti ti-message-dots" style={{ color: "#34d399" }} />
            Mensagens da Escola & Atendimento
          </div>
          <p className={styles.headerSubtitle}>
            Envio ágil de recados, elogios pedagógicos e convocações para os responsáveis legais via WhatsApp e Mural Online.
          </p>
        </div>

        <button
          type="button"
          className={styles.btnNovo}
          onClick={() => {
            setAssunto("");
            setCorpoMensagem("");
            setModalNovaMensagem(true);
          }}
        >
          <i className="ti ti-message-plus" />
          Nova Mensagem Direta
        </button>
      </div>

      {sucesso && (
        <Alert tipo="success">
          {sucesso}
        </Alert>
      )}

      {/* ATALHOS RÁPIDOS DE MENSAGENS */}
      <div className={styles.templatesCard}>
        <h4 className={styles.templatesTitle}>
          <i className="ti ti-bolt" style={{ color: "#fbbf24" }} />
          Modelos Prontos de Comunicação:
        </h4>
        <div className={styles.templatesWrap}>
          {MODELOS_MENSAGEM.map((mod) => (
            <button
              key={mod.id}
              type="button"
              className={styles.templateChip}
              onClick={() => aplicarModelo(mod)}
            >
              {mod.titulo}
            </button>
          ))}
        </div>
      </div>

      {/* 3. BARRA DE FILTROS */}
      <div className={styles.filtersBar}>
        <Input
          placeholder="Buscar histórico por assunto, estudante, responsável ou texto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          icon="ti ti-search"
        />

        <Select
          value={filtroCanal}
          onChange={(e) => setFiltroCanal(e.target.value)}
        >
          <option value="">Todos os Canais</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Mural">Mural do Responsável</option>
        </Select>

        {(busca || filtroCanal) && (
          <button type="button" className={styles.btnClearFilters} onClick={limparFiltros}>
            <i className="ti ti-x" />
            Limpar Filtros
          </button>
        )}
      </div>

      {/* 4. CABEÇALHO DA SEÇÃO */}
      <div className={styles.sectionHeader}>
        <div>
          <h3 className={styles.sectionTitle}>
            <i className="ti ti-history" style={{ color: "#34d399" }} />
            Histórico de Mensagens ({mensagensFiltradas.length})
          </h3>
          <p className={styles.sectionSubtitle}>
            Registro cronológico das notificações enviadas pela equipe gestora
          </p>
        </div>
      </div>

      {/* 5. GRADE DE CARDS */}
      <div className={styles.mensagensGrid}>
        {mensagensFiltradas.length === 0 ? (
          <div style={{
            gridColumn: "1 / -1",
            textAlign: "center",
            padding: "48px 20px",
            background: "var(--bg-card, #1e293b)",
            border: "1px dashed var(--border-color, #2c3b52)",
            borderRadius: 16
          }}>
            <i className="ti ti-messages-off" style={{ fontSize: 40, color: "#64748b", marginBottom: 12, display: "inline-block" }} />
            <h4 style={{ margin: "0 0 6px 0", color: "#f8fafc", fontSize: 16 }}>Nenhuma mensagem registrada</h4>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>
              {busca || filtroCanal
                ? "Tente ajustar os termos de busca ou remover os filtros."
                : "Clique em 'Nova Mensagem Direta' ou use um dos modelos prontos acima."}
            </p>
          </div>
        ) : (
          mensagensFiltradas.map((msg) => {
            const dataFmt = msg.enviadoEm
              ? new Date(msg.enviadoEm).toLocaleDateString("pt-BR") + " às " + new Date(msg.enviadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
              : "Hoje";

            return (
              <div key={msg.id} className={styles.msgCard}>
                <div>
                  <div className={styles.cardTop}>
                    <span className={styles.badgeDest}>
                      <i className="ti ti-send" />
                      {msg.alunoNome ? "Individual" : msg.turmaNome ? `Turma: ${msg.turmaNome}` : "Toda a Escola"}
                    </span>
                    <span className={styles.badgeCanal}>
                      <i className="ti ti-brand-whatsapp" style={{ marginRight: 4 }} />
                      {msg.canal || "WhatsApp"}
                    </span>
                  </div>

                  <h3 className={styles.cardTitle}>{msg.assunto || msg.tipo || "Mensagem Escolar"}</h3>

                  <div className={styles.infoBox}>
                    <div className={styles.infoRow}>
                      <span>📅</span>
                      <span><strong>Enviado em:</strong> {dataFmt}</span>
                    </div>
                    {msg.alunoNome && (
                      <div className={styles.infoRow}>
                        <span>👤</span>
                        <span><strong>Estudante:</strong> {msg.alunoNome}</span>
                      </div>
                    )}
                    {msg.responsavelNome && (
                      <div className={styles.infoRow}>
                        <span>👨‍👩‍👧</span>
                        <span><strong>Responsável:</strong> {msg.responsavelNome}</span>
                      </div>
                    )}
                    {msg.turmaNome && (
                      <div className={styles.infoRow}>
                        <span>🏫</span>
                        <span><strong>Turma:</strong> {msg.turmaNome}</span>
                      </div>
                    )}
                  </div>

                  <p className={styles.msgBody} title={msg.conteudo}>
                    {msg.conteudo}
                  </p>
                </div>

                <div className={styles.cardFooter}>
                  <span style={{ fontSize: 11.5, color: "#34d399", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    <i className="ti ti-circle-check" /> Enviada com sucesso
                  </span>

                  <div className={styles.actionBtnGroup}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => handleReenviarWhatsApp(msg)}
                      title="Reenviar ou Copiar para WhatsApp"
                    >
                      <i className="ti ti-brand-whatsapp" />
                    </button>

                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      onClick={() => setModalExclusao(msg)}
                      title="Excluir Registro"
                    >
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================
          MODAL DE NOVA MENSAGEM (CAMPOS UM ABAIXO DO OUTRO)
          ========================================================= */}
      {modalNovaMensagem && (
        <Modal
          isOpen={modalNovaMensagem}
          titulo="Enviar Nova Mensagem da Escola"
          onClose={() => setModalNovaMensagem(false)}
          width={640}
          esconderRodape
        >
          <form onSubmit={handleEnviarMensagem} className={styles.modalForm}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Modalidade de Destinatário <span className={styles.fieldRequired}>*</span>
              </label>
              <div className={styles.tipoEnvioGroup}>
                <button
                  type="button"
                  className={`${styles.btnTipoEnvio} ${tipoEnvio === "INDIVIDUAL" ? styles.btnTipoEnvioActive : ""}`}
                  onClick={() => setTipoEnvio("INDIVIDUAL")}
                >
                  <i className="ti ti-user" /> Estudante Específico
                </button>
                <button
                  type="button"
                  className={`${styles.btnTipoEnvio} ${tipoEnvio === "TURMA" ? styles.btnTipoEnvioActive : ""}`}
                  onClick={() => setTipoEnvio("TURMA")}
                >
                  <i className="ti ti-users" /> Turma Completa
                </button>
                <button
                  type="button"
                  className={`${styles.btnTipoEnvio} ${tipoEnvio === "GERAL" ? styles.btnTipoEnvioActive : ""}`}
                  onClick={() => setTipoEnvio("GERAL")}
                >
                  <i className="ti ti-building" /> Toda a Escola
                </button>
              </div>
            </div>

            {tipoEnvio === "INDIVIDUAL" && (
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  Selecione o Estudante Destinatário <span className={styles.fieldRequired}>*</span>
                </label>
                <Select
                  value={alunoSelecionadoId}
                  onChange={(e) => setAlunoSelecionadoId(e.target.value)}
                  required
                >
                  <option value="">-- Escolha o Estudante da Unidade --</option>
                  {alunos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} (Resp: {a.responsavelNome || a.responsavel || "Pais"})
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {tipoEnvio === "TURMA" && (
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  Selecione a Turma Destinatária <span className={styles.fieldRequired}>*</span>
                </label>
                <Select
                  value={turmaSelecionadaId}
                  onChange={(e) => setTurmaSelecionadaId(e.target.value)}
                  required
                >
                  <option value="">-- Escolha a Turma --</option>
                  {turmas.map((t) => (
                    <option key={t.id || t.nome} value={t.id || t.nome}>
                      {t.nome} ({t.turno || "Geral"})
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Assunto do Recado / Comunicado <span className={styles.fieldRequired}>*</span>
              </label>
              <Input
                placeholder="Ex: Elogio de Comportamento e Desempenho Pedagógico"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Canal de Transmissão <span className={styles.fieldRequired}>*</span>
              </label>
              <Select
                value={canal}
                onChange={(e) => setCanal(e.target.value)}
              >
                <option value="WhatsApp & Mural">WhatsApp & Mural do Responsável</option>
                <option value="Somente WhatsApp">Somente WhatsApp Direto</option>
                <option value="Mural do Responsável">Mural Online</option>
              </Select>
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Texto da Mensagem <span className={styles.fieldRequired}>*</span>
              </label>
              <textarea
                rows={5}
                className={styles.formTextarea}
                placeholder="Escreva a mensagem clara e acolhedora destinada à família..."
                value={corpoMensagem}
                onChange={(e) => setCorpoMensagem(e.target.value)}
                required
              />
            </div>

            <div className={styles.modalFooter}>
              <Btn onClick={() => setModalNovaMensagem(false)}>
                Cancelar
              </Btn>
              <Btn variant="primary" type="submit" disabled={enviando} style={{ background: "#059669", border: "1px solid #34d399" }}>
                <i className="ti ti-send" />
                {enviando ? "Enviando..." : "Enviar Mensagem"}
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================
          MODAL DE CONFIRMAÇÃO DE EXCLUSÃO
          ========================================================= */}
      {modalExclusao && (
        <Modal
          isOpen={!!modalExclusao}
          titulo="Confirmar Exclusão de Mensagem"
          onClose={() => setModalExclusao(null)}
          width={460}
          esconderRodape
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary, #cbd5e1)", margin: 0, lineHeight: 1.5 }}>
              Deseja realmente remover o registro da mensagem <strong>"{modalExclusao.assunto || modalExclusao.tipo}"</strong> do histórico escolar?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Btn onClick={() => setModalExclusao(null)}>
                Cancelar
              </Btn>
              <Btn variant="danger" onClick={handleExcluir}>
                Sim, Remover do Histórico
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
