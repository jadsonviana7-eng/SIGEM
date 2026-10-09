import { useState, useEffect } from "react";
import { getEscolas } from "../services/escolasService";
import {
  addSolicitacaoMatricula,
  getSolicitacaoPorProtocolo
} from "../services/matriculaOnlineService";
import { Btn, Input, Select, Alert } from "../components/ui";

const SERIES_OPCOES = [
  "Creche I (0 a 1 ano)",
  "Creche II (2 anos)",
  "Creche III (3 anos)",
  "Pré-Escola I (4 anos)",
  "Pré-Escola II (5 anos)",
  "1º Ano (Ensino Fundamental)",
  "2º Ano (Ensino Fundamental)",
  "3º Ano (Ensino Fundamental)",
  "4º Ano (Ensino Fundamental)",
  "5º Ano (Ensino Fundamental)",
  "6º Ano (Ensino Fundamental)",
  "7º Ano (Ensino Fundamental)",
  "8º Ano (Ensino Fundamental)",
  "9º Ano (Ensino Fundamental)",
  "EJA - Educação de Jovens e Adultos"
];

const TURNOS_OPCOES = ["Matutino", "Vespertino", "Integral"];

export default function MatriculaOnlinePublica() {
  const [escolas, setEscolas] = useState([]);

  const [modoAba, setModoAba] = useState("solicitar"); // "solicitar" ou "consultar"
  const [etapaAtual, setEtapaAtual] = useState(1);

  // Formulário de Solicitação
  const [form, setForm] = useState({
    // Aluno
    alunoNome: "",
    alunoCpf: "",
    alunoDataNasc: "",
    alunoSexo: "Masculino",
    alunoCorRaca: "Parda",
    alunoPcd: false,
    alunoTipoPcd: "",
    alunoCertidao: "",
    
    // Responsável
    responsavelNome: "",
    responsavelParentesco: "Mãe",
    responsavelCpf: "",
    responsavelTelefone: "",
    responsavelEmail: "",
    responsavelProfissao: "",
    
    // Endereço
    enderecoRua: "",
    enderecoNumero: "",
    enderecoBairro: "",
    enderecoCidade: "São José da Tapera",
    enderecoUf: "AL",
    enderecoCep: "",
    
    // Escola e Série
    escolaId: "",
    escolaNome: "",
    serieAno: "1º Ano (Ensino Fundamental)",
    serieTurno: "Matutino",
    escolaOrigem: "",
    
    // Documentos anexados
    documentos: []
  });

  const [documentosArquivos, setDocumentosArquivos] = useState([
    { tipo: "Certidão de Nascimento do Aluno", obrigatorio: true, nome: "", status: "Pendente" },
    { tipo: "Comprovante de Residência (Conta de Luz/Água)", obrigatorio: true, nome: "", status: "Pendente" },
    { tipo: "Cartão de Vacinação Atualizado", obrigatorio: true, nome: "", status: "Pendente" },
    { tipo: "RG/CPF do Responsável Legal", obrigatorio: true, nome: "", status: "Pendente" },
    { tipo: "Histórico Escolar / Declaração de Transferência", obrigatorio: false, nome: "", status: "Pendente" },
    { tipo: "Laudo Médico ou Documento AEE (se PCD)", obrigatorio: false, nome: "", status: "Pendente" }
  ]);

  const [enviando, setEnviando] = useState(false);
  const [solicitacaoSucesso, setSolicitacaoSucesso] = useState(null);
  const [erro, setErro] = useState("");

  // Consulta de Protocolo
  const [buscaProtocolo, setBuscaProtocolo] = useState("");
  const [buscaCpf, setBuscaCpf] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [resultadoConsulta, setResultadoConsulta] = useState(null);
  const [erroConsulta, setErroConsulta] = useState("");

  useEffect(() => {
    async function loadEscolas() {
      try {
        const lista = await getEscolas();
        setEscolas(lista);
        if (lista.length > 0) {
          setForm(prev => ({
            ...prev,
            escolaId: lista[0].id,
            escolaNome: lista[0].nome
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar escolas:", err);
      }
    }
    loadEscolas();
  }, []);

  const handleSimularUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentosArquivos(prev => {
        const novo = [...prev];
        novo[index] = {
          ...novo[index],
          nome: file.name,
          status: "Anexado"
        };
        return novo;
      });
    }
  };

  const validarEtapa1 = () => {
    if (!form.alunoNome.trim()) return "Informe o nome completo do aluno.";
    if (!form.alunoDataNasc) return "Informe a data de nascimento do aluno.";
    return null;
  };

  const validarEtapa2 = () => {
    if (!form.responsavelNome.trim()) return "Informe o nome do responsável legal.";
    if (!form.responsavelTelefone.trim()) return "Informe o telefone/WhatsApp de contato.";
    if (!form.enderecoRua.trim()) return "Informe o endereço de residência.";
    return null;
  };

  const validarEtapa3 = () => {
    if (!form.escolaId) return "Selecione a escola desejada.";
    if (!form.serieAno) return "Selecione o ano escolar.";
    return null;
  };

  const handleAvancar = () => {
    setErro("");
    if (etapaAtual === 1) {
      const err = validarEtapa1();
      if (err) return setErro(err);
    }
    if (etapaAtual === 2) {
      const err = validarEtapa2();
      if (err) return setErro(err);
    }
    if (etapaAtual === 3) {
      const err = validarEtapa3();
      if (err) return setErro(err);
    }
    setEtapaAtual(prev => Math.min(prev + 1, 5));
  };

  const handleVoltar = () => {
    setErro("");
    setEtapaAtual(prev => Math.max(prev - 1, 1));
  };

  const handleFinalizarEnvio = async () => {
    setEnviando(true);
    setErro("");
    try {
      const docsAnexados = documentosArquivos
        .filter(d => d.nome)
        .map(d => ({ tipo: d.tipo, nomeArquivo: d.nome, status: "Anexado" }));

      const dadosParaEnvio = {
        ...form,
        documentos: docsAnexados
      };

      const resultado = await addSolicitacaoMatricula(dadosParaEnvio);
      setSolicitacaoSucesso(resultado);
    } catch (err) {
      setErro("Erro ao enviar solicitação de matrícula: " + err.message);
    } finally {
      setEnviando(false);
    }
  };

  const handleConsultarProtocolo = async (e) => {
    e.preventDefault();
    if (!buscaProtocolo.trim() && !buscaCpf.trim()) {
      setErroConsulta("Digite o número do protocolo ou o CPF do responsável.");
      return;
    }
    setConsultando(true);
    setErroConsulta("");
    setResultadoConsulta(null);
    try {
      const res = await getSolicitacaoPorProtocolo(buscaProtocolo, buscaCpf);
      if (!res || (Array.isArray(res) && res.length === 0)) {
        setErroConsulta("Nenhuma solicitação encontrada com os dados informados. Verifique o código do protocolo.");
      } else {
        setResultadoConsulta(Array.isArray(res) ? res[0] : res);
      }
    } catch (err) {
      setErroConsulta("Erro na consulta: " + err.message);
    } finally {
      setConsultando(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f1f5f9",
      fontFamily: "Inter, system-ui, sans-serif",
      color: "#1e293b",
      padding: "24px 16px"
    }}>
      {/* Cabeçalho Oficial do Portal */}
      <header style={{
        maxWidth: 900,
        margin: "0 auto 24px",
        background: "white",
        borderRadius: 16,
        padding: "20px 24px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            boxShadow: "0 4px 12px rgba(29, 78, 216, 0.25)"
          }}>
            <i className="ti ti-school" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
              SIGEM · Matrícula Escolar Online
            </h1>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
              Secretaria Municipal de Educação · Ano Letivo {new Date().getFullYear()}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => { setModoAba("solicitar"); setSolicitacaoSucesso(null); }}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: modoAba === "solicitar" ? "#1d4ed8" : "#f1f5f9",
              color: modoAba === "solicitar" ? "white" : "#475569",
              transition: "all 0.2s"
            }}
          >
            <i className="ti ti-clipboard-plus" style={{ marginRight: 6 }} />
            Solicitar Matrícula
          </button>
          <button
            type="button"
            onClick={() => setModoAba("consultar")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: modoAba === "consultar" ? "#1d4ed8" : "#f1f5f9",
              color: modoAba === "consultar" ? "white" : "#475569",
              transition: "all 0.2s"
            }}
          >
            <i className="ti ti-search" style={{ marginRight: 6 }} />
            Acompanhar Protocolo
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* ABA 1: SOLICITAR MATRÍCULA ONLINE */}
        {modoAba === "solicitar" && (
          <div>
            {solicitacaoSucesso ? (
              /* Tela de Sucesso com Protocolo */
              <div style={{
                background: "white",
                borderRadius: 16,
                padding: 36,
                boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
                textAlign: "center"
              }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#dcfce7",
                  color: "#166534",
                  fontSize: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px"
                }}>
                  <i className="ti ti-check" />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
                  Solicitação de Matrícula Enviada com Sucesso!
                </h2>
                <p style={{ fontSize: 14, color: "#64748b", maxWidth: 520, margin: "0 auto 24px" }}>
                  A documentação e os dados do estudante foram recebidos pela Secretaria Escolar e estão em processo de triagem.
                </p>

                {/* Cartão de Protocolo */}
                <div style={{
                  maxWidth: 480,
                  margin: "0 auto 24px",
                  background: "#f8fafc",
                  borderRadius: 12,
                  padding: 20,
                  border: "2px dashed #93c5fd",
                  textAlign: "left"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#3b82f6" }}>
                      Protocolo de Acompanhamento
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 10,
                      background: "#fef9c3",
                      color: "#854d0e"
                    }}>
                      🟡 Solicitação Pendente
                    </span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#1e40af", fontFamily: "monospace", letterSpacing: 1, marginBottom: 12 }}>
                    {solicitacaoSucesso.protocolo}
                  </div>
                  <div style={{ fontSize: 13, color: "#334155", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div><strong>Aluno:</strong> {solicitacaoSucesso.alunoNome}</div>
                    <div><strong>Escola Desejada:</strong> {solicitacaoSucesso.escolaNome}</div>
                    <div><strong>Série / Turno:</strong> {solicitacaoSucesso.serieAno} ({solicitacaoSucesso.serieTurno})</div>
                    <div><strong>Responsável:</strong> {solicitacaoSucesso.responsavelNome}</div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                  <Btn onClick={() => window.print()} style={{ padding: "10px 20px" }}>
                    <i className="ti ti-printer" /> Imprimir Comprovante
                  </Btn>
                  <Btn variant="primary" onClick={() => { setModoAba("consultar"); setBuscaProtocolo(solicitacaoSucesso.protocolo); }}>
                    <i className="ti ti-eye" /> Consultar Andamento
                  </Btn>
                </div>
              </div>
            ) : (
              /* Formulário em Etapas */
              <div style={{
                background: "white",
                borderRadius: 16,
                padding: "28px",
                boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)"
              }}>
                {/* Indicador de Etapas */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 8,
                  marginBottom: 28,
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: 20
                }}>
                  {[
                    { num: 1, label: "Aluno", icon: "user" },
                    { num: 2, label: "Responsável", icon: "user-heart" },
                    { num: 3, label: "Escola & Série", icon: "school" },
                    { num: 4, label: "Documentos", icon: "file-upload" },
                    { num: 5, label: "Revisão", icon: "check" }
                  ].map((step) => {
                    const isAtivo = etapaAtual === step.num;
                    const isPassado = etapaAtual > step.num;
                    return (
                      <div
                        key={step.num}
                        style={{
                          textAlign: "center",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <div style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: isPassado ? "#22c55e" : isAtivo ? "#1d4ed8" : "#f1f5f9",
                          color: isPassado || isAtivo ? "white" : "#64748b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 700,
                          transition: "all 0.2s"
                        }}>
                          {isPassado ? <i className="ti ti-check" /> : step.num}
                        </div>
                        <span style={{
                          fontSize: 11,
                          fontWeight: isAtivo ? 700 : 500,
                          color: isAtivo ? "#1d4ed8" : "#64748b"
                        }}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {erro && <Alert tipo="error">{erro}</Alert>}

                {/* ETAPA 1: DADOS DO ALUNO */}
                {etapaAtual === 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                        1. Dados do Estudante
                      </h3>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                        Informe as informações básicas da criança ou jovem
                      </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div style={{ gridColumn: "span 2" }}>
                        <Input
                          label="Nome Completo do Aluno *"
                          placeholder="Digite o nome completo do estudante"
                          value={form.alunoNome}
                          onChange={(e) => setForm({ ...form, alunoNome: e.target.value })}
                        />
                      </div>

                      <Input
                        label="Data de Nascimento *"
                        type="date"
                        value={form.alunoDataNasc}
                        onChange={(e) => setForm({ ...form, alunoDataNasc: e.target.value })}
                      />

                      <Input
                        label="CPF do Aluno (se possuir)"
                        placeholder="000.000.000-00"
                        value={form.alunoCpf}
                        onChange={(e) => setForm({ ...form, alunoCpf: e.target.value })}
                      />

                      <Select
                        label="Sexo *"
                        value={form.alunoSexo}
                        onChange={(e) => setForm({ ...form, alunoSexo: e.target.value })}
                      >
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Outro">Outro</option>
                      </Select>

                      <Select
                        label="Cor / Raça *"
                        value={form.alunoCorRaca}
                        onChange={(e) => setForm({ ...form, alunoCorRaca: e.target.value })}
                      >
                        <option value="Branca">Branca</option>
                        <option value="Preta">Preta</option>
                        <option value="Parda">Parda</option>
                        <option value="Amarela">Amarela</option>
                        <option value="Indígena">Indígena</option>
                        <option value="Não declarada">Não declarada</option>
                      </Select>

                      <div style={{ gridColumn: "span 2" }}>
                        <Input
                          label="Certidão de Nascimento (Termo / Livro / Folha / Cartório)"
                          placeholder="Ex: Termo 12345, Livro A-12, Folha 45 - Cartório do 1º Ofício"
                          value={form.alunoCertidao}
                          onChange={(e) => setForm({ ...form, alunoCertidao: e.target.value })}
                        />
                      </div>

                      {/* Deficiência / AEE */}
                      <div style={{ gridColumn: "span 2", background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={form.alunoPcd}
                            onChange={(e) => setForm({ ...form, alunoPcd: e.target.checked })}
                          />
                          <span>O estudante possui alguma deficiência, TEA ou necessidade educacional específica?</span>
                        </label>
                        {form.alunoPcd && (
                          <div style={{ marginTop: 10 }}>
                            <Input
                              label="Descreva o diagnóstico, TEA, Altas Habilidades ou CID (se houver):"
                              placeholder="Ex: Transtorno do Espectro Autista (TEA), Baixa Visão..."
                              value={form.alunoTipoPcd}
                              onChange={(e) => setForm({ ...form, alunoTipoPcd: e.target.value })}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ETAPA 2: DADOS DO RESPONSÁVEL LEGAL */}
                {etapaAtual === 2 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                        2. Dados do Responsável Legal & Endereço
                      </h3>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                        Pai, mãe ou tutor legal responsável pela matrícula
                      </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div style={{ gridColumn: "span 2" }}>
                        <Input
                          label="Nome Completo do Responsável Legal *"
                          placeholder="Digite o nome do pai, mãe ou tutor"
                          value={form.responsavelNome}
                          onChange={(e) => setForm({ ...form, responsavelNome: e.target.value })}
                        />
                      </div>

                      <Select
                        label="Grau de Parentesco *"
                        value={form.responsavelParentesco}
                        onChange={(e) => setForm({ ...form, responsavelParentesco: e.target.value })}
                      >
                        <option value="Mãe">Mãe</option>
                        <option value="Pai">Pai</option>
                        <option value="Tutor(a) / Guardião Legal">Tutor(a) / Guardião Legal</option>
                        <option value="Avó / Avô">Avó / Avô</option>
                        <option value="Outro Responsável">Outro Responsável</option>
                      </Select>

                      <Input
                        label="CPF do Responsável *"
                        placeholder="000.000.000-00"
                        value={form.responsavelCpf}
                        onChange={(e) => setForm({ ...form, responsavelCpf: e.target.value })}
                      />

                      <Input
                        label="Telefone / WhatsApp de Contato *"
                        placeholder="(00) 00000-0000"
                        value={form.responsavelTelefone}
                        onChange={(e) => setForm({ ...form, responsavelTelefone: e.target.value })}
                      />

                      <Input
                        label="E-mail (opcional)"
                        type="email"
                        placeholder="responsavel@email.com"
                        value={form.responsavelEmail}
                        onChange={(e) => setForm({ ...form, responsavelEmail: e.target.value })}
                      />

                      {/* Endereço */}
                      <div style={{ gridColumn: "span 2", marginTop: 8 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: "#334155", margin: "0 0 10px" }}>
                          Endereço Residencial da Família
                        </h4>
                      </div>

                      <div style={{ gridColumn: "span 2" }}>
                        <Input
                          label="Logradouro / Rua *"
                          placeholder="Rua, Avenida, Travessa, Sítio..."
                          value={form.enderecoRua}
                          onChange={(e) => setForm({ ...form, enderecoRua: e.target.value })}
                        />
                      </div>

                      <Input
                        label="Número"
                        placeholder="Ex: 123 ou S/N"
                        value={form.enderecoNumero}
                        onChange={(e) => setForm({ ...form, enderecoNumero: e.target.value })}
                      />

                      <Input
                        label="Bairro / Povoado *"
                        placeholder="Ex: Centro, Bela Vista, Zona Rural"
                        value={form.enderecoBairro}
                        onChange={(e) => setForm({ ...form, enderecoBairro: e.target.value })}
                      />

                      <Input
                        label="Cidade"
                        value={form.enderecoCidade}
                        onChange={(e) => setForm({ ...form, enderecoCidade: e.target.value })}
                      />

                      <Input
                        label="CEP"
                        placeholder="00000-000"
                        value={form.enderecoCep}
                        onChange={(e) => setForm({ ...form, enderecoCep: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* ETAPA 3: ESCOLA DESEJADA E SÉRIE */}
                {etapaAtual === 3 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                        3. Escolha da Unidade Escolar & Série
                      </h3>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                        Selecione a escola municipal e etapa pretendida
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <Select
                        label="Escola Municipal Desejada *"
                        value={form.escolaId}
                        onChange={(e) => {
                          const sel = escolas.find(esc => esc.id === e.target.value);
                          setForm({
                            ...form,
                            escolaId: e.target.value,
                            escolaNome: sel ? sel.nome : ""
                          });
                        }}
                      >
                        {escolas.map(esc => (
                          <option key={esc.id} value={esc.id}>{esc.nome} ({esc.bairro || "Polo"})</option>
                        ))}
                      </Select>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <Select
                          label="Série / Ano de Ingresso *"
                          value={form.serieAno}
                          onChange={(e) => setForm({ ...form, serieAno: e.target.value })}
                        >
                          {SERIES_OPCOES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </Select>

                        <Select
                          label="Turno de Preferência *"
                          value={form.serieTurno}
                          onChange={(e) => setForm({ ...form, serieTurno: e.target.value })}
                        >
                          {TURNOS_OPCOES.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </Select>
                      </div>

                      <Input
                        label="Escola de Origem / Creche Anterior (se houver)"
                        placeholder="Informe a instituição de onde o aluno está vindo"
                        value={form.escolaOrigem}
                        onChange={(e) => setForm({ ...form, escolaOrigem: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* ETAPA 4: DOCUMENTOS COMPROBATÓRIOS */}
                {etapaAtual === 4 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                        4. Documentos & Anexos
                      </h3>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                        Anexe fotos ou PDFs dos documentos comprobatórios para agilizar a aprovação
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {documentosArquivos.map((docItem, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: docItem.nome ? "#f0fdf4" : "#f8fafc",
                            border: docItem.nome ? "1px solid #86efac" : "1px solid #e2e8f0",
                            borderRadius: 10,
                            padding: "12px 16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                              {docItem.tipo} {docItem.obrigatorio && <span style={{ color: "#ef4444" }}>*</span>}
                            </div>
                            <div style={{ fontSize: 11, color: docItem.nome ? "#166534" : "#64748b" }}>
                              {docItem.nome ? `Arquivo: ${docItem.nome}` : "Nenhum arquivo anexado ainda"}
                            </div>
                          </div>

                          <label style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            background: docItem.nome ? "#22c55e" : "#1d4ed8",
                            color: "white",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6
                          }}>
                            <i className="ti ti-upload" />
                            {docItem.nome ? "Alterar" : "Anexar"}
                            <input
                              type="file"
                              style={{ display: "none" }}
                              onChange={(e) => handleSimularUpload(idx, e)}
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ETAPA 5: REVISÃO E ENVIO */}
                {etapaAtual === 5 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                        5. Revisão dos Dados e Confirmação
                      </h3>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                        Confira as informações antes de finalizar o envio para a Secretaria
                      </p>
                    </div>

                    <div style={{
                      background: "#f8fafc",
                      borderRadius: 12,
                      padding: 16,
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      fontSize: 13
                    }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Estudante</span>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{form.alunoNome}</div>
                        <div style={{ color: "#475569", fontSize: 12 }}>Nascimento: {form.alunoDataNasc} · Sexo: {form.alunoSexo}</div>
                      </div>

                      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Responsável Legal</span>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{form.responsavelNome} ({form.responsavelParentesco})</div>
                        <div style={{ color: "#475569", fontSize: 12 }}>WhatsApp: {form.responsavelTelefone} · CPF: {form.responsavelCpf || "Não informado"}</div>
                      </div>

                      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Escola & Série Solicitada</span>
                        <div style={{ fontWeight: 700, color: "#1d4ed8" }}>{form.escolaNome}</div>
                        <div style={{ color: "#475569", fontSize: 12 }}>{form.serieAno} · Turno {form.serieTurno}</div>
                      </div>

                      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Endereço</span>
                        <div style={{ color: "#475569", fontSize: 12 }}>
                          {form.enderecoRua}, {form.enderecoNumero} - {form.enderecoBairro}, {form.enderecoCidade}/{form.enderecoUf}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botões de Navegação entre Etapas */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 28,
                  paddingTop: 16,
                  borderTop: "1px solid #f1f5f9"
                }}>
                  {etapaAtual > 1 ? (
                    <Btn onClick={handleVoltar}>
                      <i className="ti ti-chevron-left" /> Voltar
                    </Btn>
                  ) : <div />}

                  {etapaAtual < 5 ? (
                    <Btn variant="primary" onClick={handleAvancar}>
                      Avançar <i className="ti ti-chevron-right" />
                    </Btn>
                  ) : (
                    <Btn
                      variant="primary"
                      onClick={handleFinalizarEnvio}
                      disabled={enviando}
                      style={{ padding: "10px 24px", fontSize: 14 }}
                    >
                      <i className="ti ti-send" />
                      {enviando ? "Enviando Solicitação..." : "Finalizar e Enviar Solicitação"}
                    </Btn>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA 2: CONSULTAR STATUS DA SOLICITAÇÃO */}
        {modoAba === "consultar" && (
          <div style={{
            background: "white",
            borderRadius: 16,
            padding: "28px",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)"
          }}>
            <div style={{ textAlign: "center", maxWidth: 480, margin: "0 auto 24px" }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
                Acompanhar Solicitação de Matrícula
              </h2>
              <p style={{ fontSize: 13, color: "#64748b" }}>
                Informe o código do protocolo recebido ou o CPF do responsável para verificar o status em tempo real.
              </p>
            </div>

            <form onSubmit={handleConsultarProtocolo} style={{ maxWidth: 480, margin: "0 auto 28px", display: "flex", flexDirection: "column", gap: 12 }}>
              <Input
                label="Código do Protocolo"
                placeholder="Ex: SOL-2026-74812"
                value={buscaProtocolo}
                onChange={(e) => setBuscaProtocolo(e.target.value)}
              />

              <div style={{ textAlign: "center", fontSize: 12, color: "#94a3b8" }}>OU</div>

              <Input
                label="CPF do Responsável"
                placeholder="000.000.000-00"
                value={buscaCpf}
                onChange={(e) => setBuscaCpf(e.target.value)}
              />

              {erroConsulta && <Alert tipo="error">{erroConsulta}</Alert>}

              <Btn
                type="submit"
                variant="primary"
                disabled={consultando}
                style={{ width: "100%", justifyContent: "center", padding: 10 }}
              >
                <i className="ti ti-search" />
                {consultando ? "Buscando..." : "Consultar Status"}
              </Btn>
            </form>

            {/* Resultado da Consulta */}
            {resultadoConsulta && (
              <div style={{
                background: "#f8fafc",
                borderRadius: 14,
                padding: 24,
                border: "1px solid #e2e8f0",
                maxWidth: 600,
                margin: "0 auto"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Protocolo</span>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1e40af", fontFamily: "monospace" }}>
                      {resultadoConsulta.protocolo}
                    </div>
                  </div>

                  <div>
                    {resultadoConsulta.status === "Pendente" && (
                      <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700, background: "#fef9c3", color: "#854d0e" }}>
                        🟡 Solicitação Pendente
                      </span>
                    )}
                    {resultadoConsulta.status === "Aprovada" && (
                      <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700, background: "#dcfce7", color: "#166534" }}>
                        🟢 Matrícula Aprovada!
                      </span>
                    )}
                    {resultadoConsulta.status === "Indeferida" && (
                      <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700, background: "#fee2e2", color: "#991b1b" }}>
                        🔴 Solicitação Indeferida
                      </span>
                    )}
                    {resultadoConsulta.status === "Aguardando Correção" && (
                      <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700, background: "#e0f2fe", color: "#0369a1" }}>
                        🔵 Aguardando Correção
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, marginBottom: 20 }}>
                  <div><strong>Aluno:</strong> {resultadoConsulta.alunoNome}</div>
                  <div><strong>Escola:</strong> {resultadoConsulta.escolaNome}</div>
                  <div><strong>Série / Turno:</strong> {resultadoConsulta.serieAno} ({resultadoConsulta.serieTurno})</div>
                  {resultadoConsulta.matriculaOficial && (
                    <div style={{ background: "#ecfdf5", padding: "8px 12px", borderRadius: 8, color: "#065f46" }}>
                      <strong>Nº Oficial de Matrícula:</strong> {resultadoConsulta.matriculaOficial} · <strong>Turma:</strong> {resultadoConsulta.turmaAprovada}
                    </div>
                  )}
                  {resultadoConsulta.motivoIndeferimento && (
                    <div style={{ background: "#fef2f2", padding: "8px 12px", borderRadius: 8, color: "#991b1b" }}>
                      <strong>Motivo:</strong> {resultadoConsulta.motivoIndeferimento}
                    </div>
                  )}
                  {resultadoConsulta.pendenciaDocumental && (
                    <div style={{ background: "#f0f9ff", padding: "8px 12px", borderRadius: 8, color: "#075985" }}>
                      <strong>Orientação da Secretaria:</strong> {resultadoConsulta.pendenciaDocumental}
                    </div>
                  )}
                </div>

                {/* Histórico / Linha do Tempo */}
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
                    Linha do Tempo do Atendimento:
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(resultadoConsulta.historicoAnalise || []).map((h, i) => (
                      <div key={i} style={{ fontSize: 12, background: "white", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 11, marginBottom: 2 }}>
                          <span>{h.status}</span>
                          <span>{h.dataHora ? new Date(h.dataHora).toLocaleString("pt-BR") : ""}</span>
                        </div>
                        <div style={{ color: "#1e293b" }}>{h.mensagem}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
