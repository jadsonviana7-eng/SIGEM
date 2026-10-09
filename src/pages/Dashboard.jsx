import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import AdminDashboard from "./AdminDashboard";
import DiretorDashboard from "./DiretorDashboard";
import CoordenadorDashboard from "./CoordenadorDashboard";

export default function Dashboard() {
  const { user, selectedEscolaId } = useAuth();
  const isAdmin = user?.role === "Administrador";

  // Se o usuário for administrador, inicia por padrão na Visão Geral da Rede ("rede")
  // mas permite alternar para a visão da escola selecionada ("escola" ou "coordenacao")
  const [visaoAdmin, setVisaoAdmin] = useState("rede");

  if (isAdmin) {
    if (visaoAdmin === "escola" && selectedEscolaId) {
      return (
        <DiretorDashboard
          escolaId={selectedEscolaId}
          onVoltarParaRede={() => setVisaoAdmin("rede")}
        />
      );
    }
    if (visaoAdmin === "coordenacao" && selectedEscolaId) {
      return (
        <CoordenadorDashboard
          escolaId={selectedEscolaId}
          onVoltarParaRede={() => setVisaoAdmin("rede")}
        />
      );
    }
    return (
      <AdminDashboard
        onSelecionarVisaoEscola={(escolaId) => {
          setVisaoAdmin("escola");
        }}
      />
    );
  }

  const activeEscolaId = user?.escolaId || selectedEscolaId || "";

  // Se for Coordenador Pedagógico
  if (user?.role === "Coordenador" || user?.role === "Coordenação") {
    return <CoordenadorDashboard escolaId={activeEscolaId} />;
  }

  // Se for Diretor(a) ou outros perfis
  return <DiretorDashboard escolaId={activeEscolaId} />;
}

