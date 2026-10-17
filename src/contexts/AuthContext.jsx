import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase";
import { getUsuario, updateUsuario, addUsuario } from "../services/usuariosService";
import { getEscolas } from "../services/escolasService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = carregando
  const [selectedEscolaId, setSelectedEscolaId] = useState("");
  const [escolas, setEscolas] = useState([]);

  const recarregarEscolasGlobal = async () => {
    try {
      const lista = await getEscolas();
      setEscolas(lista);
      return lista;
    } catch (err) {
      console.error("Erro ao recarregar escolas globalmente:", err);
      return [];
    }
  };

  const carregarDadosUsuario = async (u) => {
    if (!u) {
      setUser(null);
      setSelectedEscolaId("");
      setEscolas([]);
      return null;
    }

    try {
      let perfil = await getUsuario(u.uid);
      if (!perfil) {
        const novoPerfil = {
          nome: u.displayName || u.email.split("@")[0],
          email: u.email,
          perfil: "Administrador",
          status: "Ativo",
          fotoUrl: u.photoURL || "",
          escolaId: ""
        };
        try {
          await addUsuario(u.uid, novoPerfil);
          perfil = { id: u.uid, ...novoPerfil };
        } catch (writeError) {
          console.error("Erro ao criar perfil inicial no Firestore:", writeError);
        }
      }

      let listaEscolas = [];
      try {
        listaEscolas = await recarregarEscolasGlobal();
      } catch (escErr) {
        console.error("Erro ao buscar escolas:", escErr);
      }

      let role = perfil?.perfil || "Administrador";
      if (u.email?.toLowerCase() === "jadsonviana7@gmail.com") {
        role = "Administrador";
        if (perfil && perfil.perfil !== "Administrador") {
          try {
            await updateUsuario(u.uid, { perfil: "Administrador" });
            perfil.perfil = "Administrador";
          } catch (err) {
            console.error("Erro ao auto-promover administrador:", err);
          }
        }
      }
      const userEscolaId = perfil?.escolaId || "";

      let activeEscolaId = "";
      if (role === "Administrador") {
        const savedId = localStorage.getItem("selectedEscolaId");
        if (savedId && listaEscolas.some(e => e.id === savedId)) {
          activeEscolaId = savedId;
        } else if (listaEscolas.length > 0) {
          activeEscolaId = listaEscolas[0].id;
          localStorage.setItem("selectedEscolaId", activeEscolaId);
        }
      } else {
        activeEscolaId = userEscolaId;
      }
      setSelectedEscolaId(activeEscolaId);

      const dadosFinais = {
        uid: u.uid,
        email: u.email,
        displayName: perfil?.nome || u.displayName || "Usuário",
        photoURL: perfil?.fotoUrl || u.photoURL || null,
        role: role,
        status: perfil?.status || "Ativo",
        escolaId: userEscolaId,
        selectedEscolaId: activeEscolaId,
        raw: u
      };

      setUser(dadosFinais);
      return dadosFinais;
    } catch (error) {
      console.error("Erro ao buscar dados do perfil:", error);
      const fallbackUser = {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || "Administrador",
        photoURL: u.photoURL || null,
        role: "Administrador",
        status: "Ativo",
        escolaId: "",
        selectedEscolaId: "",
        raw: u
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      await carregarDadosUsuario(u);
    });
    return unsub;
  }, []);

  const login = async (email, senha) => {
    setUser(undefined); // Define estado de carregamento para que as rotas aguardem
    const cred = await signInWithEmailAndPassword(auth, email, senha);
    const userObj = await carregarDadosUsuario(cred.user);
    return userObj;
  };

  const logout = async () => {
    setUser(null);
    setSelectedEscolaId("");
    await signOut(auth);
  };

  const atualizarDadosUsuario = async (dados) => {
    if (!user?.uid) return;
    await updateUsuario(user.uid, dados);
    setUser(u => ({
      ...u,
      ...dados,
      displayName: dados.nome || u.displayName,
      photoURL: dados.fotoUrl !== undefined ? dados.fotoUrl : u.photoURL
    }));
  };

  const alterarEscolaAtiva = (id) => {
    setSelectedEscolaId(id);
    localStorage.setItem("selectedEscolaId", id);
    setUser(u => u ? { ...u, selectedEscolaId: id } : null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, atualizarDadosUsuario, selectedEscolaId, alterarEscolaAtiva, escolas, recarregarEscolas: recarregarEscolasGlobal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
