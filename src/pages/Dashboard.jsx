import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import AdminDashboard from "./AdminDashboard";
import DiretorDashboard from "./DiretorDashboard";
import CoordenadorDashboard from "./CoordenadorDashboard";
import MobileHomeLauncher from "../components/MobileHomeLauncher";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { user, selectedEscolaId } = useAuth();
  const isAdmin = user?.role === "Administrador";

  // Se o usuário for administrador, inicia por padrão na Visão Geral da Rede ("rede")
  // mas permite alternar para a visão da escola selecionada ("escola" ou "coordenacao")
  const [visaoAdmin, setVisaoAdmin] = useState("rede");

  const activeEscolaId = user?.escolaId || selectedEscolaId || "";

  function renderDashboardContent() {
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
          onSelecionarVisaoEscola={() => {
            setVisaoAdmin("escola");
          }}
        />
      );
    }

    // Se for Coordenador Pedagógico
    if (user?.role === "Coordenador" || user?.role === "Coordenação") {
      return <CoordenadorDashboard escolaId={activeEscolaId} />;
    }

    // Se for Diretor(a) ou outros perfis
    return <DiretorDashboard escolaId={activeEscolaId} />;
  }

  return (
    <>
      <div className={styles.mobileContainer}>
        <MobileHomeLauncher dashboardNode={renderDashboardContent()} />
      </div>
      <div className={styles.desktopContainer}>
        {renderDashboardContent()}
      </div>
    </>
  );
}
