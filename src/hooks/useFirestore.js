import { useState, useEffect, useCallback } from "react";

/**
 * Hook genérico para carregar dados do Firestore.
 * @param {Function} fetchFn - função assíncrona que retorna array de dados
 * @param {Array} deps - dependências que disparam recarregamento
 */
export function useFirestore(fetchFn, deps = []) {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const result = await fetchFn();
      setDados(result);
    } catch (e) {
      console.error("Erro no useFirestore:", e);
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  // eslint-disable-next-line
  }, deps);

  useEffect(() => { carregar(); }, [carregar]);

  return { dados, carregando, erro, recarregar: carregar };
}
