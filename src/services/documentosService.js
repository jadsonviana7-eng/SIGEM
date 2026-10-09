import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, deleteField, serverTimestamp } from "firebase/firestore";
import { db, storage } from "../firebase";

/**
 * Converte um arquivo para Base64 Data URL
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Comprime uma imagem de documento mantendo boa legibilidade de texto
 */
function comprimirImagemDocumento(file, maxDim = 1400) {
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

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Erro ao gerar Blob do documento."));
          },
          "image/jpeg",
          0.82 // Ótima qualidade para leitura de textos em documentos
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Faz o upload de um documento de aluno (PDF ou Imagem)
 * Retorna os metadados do documento com URL
 */
export async function uploadDocumento(file, alunoId, tipoDocId) {
  if (!file) throw new Error("Nenhum arquivo fornecido.");

  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  const ext = file.name.split(".").pop() || (isPdf ? "pdf" : "jpg");
  const fileName = file.name;
  const fileSize = file.size;
  const timestamp = Date.now();

  let finalBlob = file;
  if (isImage) {
    try {
      finalBlob = await comprimirImagemDocumento(file, 1400);
    } catch (e) {
      console.warn("Falha ao comprimir imagem, usando original:", e);
      finalBlob = file;
    }
  }

  // Verifica se é localhost ou falha no storage para usar fallback Base64
  let fileUrl = "";
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  if (isLocal) {
    fileUrl = await fileToBase64(finalBlob);
  } else {
    try {
      const storagePath = `documentos_alunos/${alunoId || "temp"}/${tipoDocId}_${timestamp}.${ext}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, finalBlob);
      fileUrl = await getDownloadURL(storageRef);
    } catch (storageErr) {
      console.warn("Upload no Storage falhou, aplicando fallback Base64:", storageErr);
      fileUrl = await fileToBase64(finalBlob);
    }
  }

  const docMetadata = {
    nome: fileName,
    url: fileUrl,
    tamanho: fileSize,
    tipo: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
    dataEnvio: new Date().toISOString()
  };

  return docMetadata;
}

/**
 * Salva um documento no perfil do aluno no Firestore
 */
export async function salvarDocumentoNoAluno(alunoId, tipoDocId, docMetadata) {
  if (!alunoId) return;
  const alunoRef = doc(db, "alunos", alunoId);
  return updateDoc(alunoRef, {
    [`documentos.${tipoDocId}`]: docMetadata,
    atualizadoEm: serverTimestamp()
  });
}

/**
 * Remove um documento do perfil do aluno no Firestore
 */
export async function removerDocumentoDoAluno(alunoId, tipoDocId) {
  if (!alunoId) return;
  const alunoRef = doc(db, "alunos", alunoId);
  return updateDoc(alunoRef, {
    [`documentos.${tipoDocId}`]: deleteField(),
    atualizadoEm: serverTimestamp()
  });
}
