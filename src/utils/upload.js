import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

/**
 * Redimensiona e comprime uma imagem usando HTML5 Canvas
 * @param {File} file - Arquivo de imagem original
 * @param {number} maxDim - Dimensão máxima (largura ou altura)
 * @returns {Promise<Blob>} Blob da imagem comprimida em JPEG
 */
function comprimirImagem(file, maxDim = 250) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Mantém a proporção e define limites máximos
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Exporta como blob JPEG de qualidade 0.7 (cerca de 10-25 KB)
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Erro ao gerar Blob da imagem."));
          },
          "image/jpeg",
          0.7
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Converte um File/Blob para Base64 Data URL (usado como fallback)
 * @param {Blob} blob 
 * @returns {Promise<string>}
 */
function fileToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Comprime e faz o upload da foto. Se o Storage falhar por regras de segurança
 * ou indisponibilidade, retorna a foto em formato Base64 para salvar direto no Firestore.
 * @param {File} file - Arquivo enviado pelo input file
 * @param {string} categoria - 'alunos', 'professores' ou 'usuarios'
 * @param {string} id - ID único do registro para nomear o arquivo
 * @returns {Promise<string>} URL do Storage ou string Base64 da imagem
 */
export async function comprimirEUploadFoto(file, categoria, id) {
  try {
    // 1. Comprime a imagem para mantê-la super leve (250px max)
    const blobComprimido = await comprimirImagem(file, 250);

    // Se estiver rodando em localhost/desenvolvimento, usa Base64 direto
    // para evitar que o bloqueio de CORS do Firebase Storage quebre o fluxo.
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      console.log("Localhost detectado: ignorando Storage e usando Base64 diretamente.");
      const base64Url = await fileToBase64(blobComprimido);
      return base64Url;
    }

    try {
      // 2. Tenta fazer upload no Firebase Storage (em produção)
      const path = `fotos/${categoria}/${id || Date.now()}.jpg`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blobComprimido);
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (storageError) {
      console.warn("Storage upload falhou, usando fallback de Base64:", storageError.message);
      const base64Url = await fileToBase64(blobComprimido);
      return base64Url;
    }
  } catch (error) {
    console.error("Erro no processamento da imagem:", error);
    throw new Error("Erro ao processar imagem: " + error.message);
  }
}
