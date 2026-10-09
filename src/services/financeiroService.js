import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { db } from "../firebase";

// ==========================================
// CAIXAS (Contas Bancárias / Caixas Físicos)
// ==========================================
export const getCaixas = async (escolaId) => {
  const q = query(collection(db, "fin_caixas"), where("escolaId", "==", escolaId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getAllCaixas = async () => {
  const querySnapshot = await getDocs(collection(db, "fin_caixas"));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addCaixa = async (dados) => {
  const ref = await addDoc(collection(db, "fin_caixas"), {
    ...dados,
    createdAt: new Date().toISOString()
  });
  return ref.id;
};

export const updateCaixa = async (id, dados) => {
  await updateDoc(doc(db, "fin_caixas", id), dados);
};

export const deleteCaixa = async (id) => {
  await deleteDoc(doc(db, "fin_caixas", id));
};


// ==========================================
// CATEGORIAS (Fontes e Despesas)
// ==========================================
export const getCategorias = async (escolaId) => {
  const q = query(collection(db, "fin_categorias"), where("escolaId", "==", escolaId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addCategoria = async (dados) => {
  const ref = await addDoc(collection(db, "fin_categorias"), {
    ...dados,
    createdAt: new Date().toISOString()
  });
  return ref.id;
};

export const updateCategoria = async (id, dados) => {
  await updateDoc(doc(db, "fin_categorias", id), dados);
};

export const deleteCategoria = async (id) => {
  await deleteDoc(doc(db, "fin_categorias", id));
};


// ==========================================
// TRANSAÇÕES (Receitas / Despesas)
// ==========================================
export const getTransacoes = async (escolaId) => {
  const q = query(collection(db, "fin_transacoes"), where("escolaId", "==", escolaId));
  const querySnapshot = await getDocs(q);
  const transacoes = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return transacoes.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
};

export const getAllTransacoes = async () => {
  const querySnapshot = await getDocs(collection(db, "fin_transacoes"));
  const transacoes = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return transacoes.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
};

export const addTransacao = async (dados) => {
  const ref = await addDoc(collection(db, "fin_transacoes"), {
    ...dados,
    createdAt: new Date().toISOString()
  });
  return ref.id;
};

export const updateTransacao = async (id, dados) => {
  await updateDoc(doc(db, "fin_transacoes", id), dados);
};

export const deleteTransacao = async (id) => {
  await deleteDoc(doc(db, "fin_transacoes", id));
};
