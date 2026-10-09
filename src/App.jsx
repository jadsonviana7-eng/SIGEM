import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import InstallPwaPrompt from "./components/InstallPwaPrompt";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Alunos from "./pages/Alunos";
import AlunoDetalhes from "./pages/AlunoDetalhes";
import Matriculas from "./pages/Matriculas";
import NovaMatricula from "./pages/NovaMatricula";
import Transferencias from "./pages/Transferencias";
import Professores from "./pages/Professores";
import Turmas from "./pages/Turmas";
import Conteudos from "./pages/Conteudos";
import Frequencia from "./pages/Frequencia";
import Notas from "./pages/Notas";
import Boletim from "./pages/Boletim";
import HistoricoEscolar from "./pages/HistoricoEscolar";
import ValidarDocumento from "./pages/ValidarDocumento";
import Ocorrencias from "./pages/Ocorrencias";
import FechamentoPeriodo from "./pages/FechamentoPeriodo";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Auditoria from "./pages/Auditoria";
import Financeiro from "./pages/financeiro/Financeiro";
import FolhaPagamento from "./pages/FolhaPagamento";
import Transporte from "./pages/Transporte";
import Alimentacao from "./pages/Alimentacao";
import EducacaoEspecial from "./pages/EducacaoEspecial";
import MatriculaOnlinePublica from "./pages/MatriculaOnlinePublica";
import Comunicacao from "./pages/Comunicacao";

function RotaProtegida({ children, titulo }) {
  const { user } = useAuth();
  if (user === undefined) return null; // carregando auth
  if (!user) return <Navigate to="/login" replace />;
  return <Layout titulo={titulo}>{children}</Layout>;
}

function RotaRestrita({ children, titulo }) {
  const { user } = useAuth();
  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" replace />;
  const isAuthorized = user.role === "Administrador" || user.role === "Diretor" || user.role === "Direção";
  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }
  return <Layout titulo={titulo}>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/validar-documento" element={<ValidarDocumento />} />
      <Route path="/solicitar-matricula" element={<MatriculaOnlinePublica />} />
      <Route path="/acompanhar-matricula" element={<MatriculaOnlinePublica />} />
      <Route path="/" element={<RotaProtegida titulo="Gestão da Secretaria · Centro de Comando"><Dashboard /></RotaProtegida>} />
      <Route path="/alunos" element={<RotaProtegida titulo="Alunos"><Alunos /></RotaProtegida>} />
      <Route path="/alunos/:id" element={<RotaProtegida titulo="Ficha do Aluno"><AlunoDetalhes /></RotaProtegida>} />
      <Route path="/matriculas" element={<RotaProtegida titulo="Matrículas & Vagas"><Matriculas /></RotaProtegida>} />
      <Route path="/matriculas/nova" element={<RotaProtegida titulo="Nova Matrícula"><NovaMatricula /></RotaProtegida>} />
      <Route path="/transferencias" element={<RotaProtegida titulo="Transferências & Trajetória"><Transferencias /></RotaProtegida>} />
      <Route path="/historico" element={<RotaProtegida titulo="Histórico Escolar Oficial"><HistoricoEscolar /></RotaProtegida>} />
      <Route path="/ocorrencias" element={<RotaProtegida titulo="Acompanhamento de Ocorrências"><Ocorrencias /></RotaProtegida>} />
      <Route path="/transporte" element={<RotaProtegida titulo="Transporte Escolar"><Transporte /></RotaProtegida>} />
      <Route path="/alimentacao" element={<RotaProtegida titulo="Alimentação Escolar"><Alimentacao /></RotaProtegida>} />
      <Route path="/educacao-especial" element={<RotaProtegida titulo="Educação Especial & Inclusiva"><EducacaoEspecial /></RotaProtegida>} />
      <Route path="/comunicacao" element={<RotaProtegida titulo="Comunicação & Família"><Comunicacao /></RotaProtegida>} />
      <Route path="/professores" element={<RotaProtegida titulo="Professores"><Professores /></RotaProtegida>} />
      <Route path="/turmas" element={<RotaProtegida titulo="Turmas"><Turmas /></RotaProtegida>} />
      <Route path="/conteudos" element={<RotaProtegida titulo="Conteúdos Aplicados"><Conteudos /></RotaProtegida>} />
      <Route path="/frequencia" element={<RotaProtegida titulo="Frequência"><Frequencia /></RotaProtegida>} />
      <Route path="/notas" element={<RotaProtegida titulo="Notas"><Notas /></RotaProtegida>} />
      <Route path="/boletim" element={<RotaProtegida titulo="Boletim Escolar Digital"><Boletim /></RotaProtegida>} />
      <Route path="/fechamento" element={<RotaProtegida titulo="Fechamento de Período"><FechamentoPeriodo /></RotaProtegida>} />
      <Route path="/relatorios" element={<RotaProtegida titulo="Relatórios"><Relatorios /></RotaProtegida>} />
      <Route path="/auditoria" element={<RotaProtegida titulo="LOGs / Auditoria"><Auditoria /></RotaProtegida>} />
      <Route path="/financeiro" element={<RotaRestrita titulo="Gestão Financeira"><Financeiro /></RotaRestrita>} />
      <Route path="/folha-pagamento" element={<RotaRestrita titulo="Folha de Pagamento & Ponto"><FolhaPagamento /></RotaRestrita>} />
      <Route path="/configuracoes" element={<RotaProtegida titulo="Configurações"><Configuracoes /></RotaProtegida>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <InstallPwaPrompt />
      </BrowserRouter>
    </AuthProvider>
  );
}

