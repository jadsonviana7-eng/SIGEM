import { useState, useEffect, useRef } from "react";
import { Btn } from "./ui";

export default function CropModal({ file, onCrop, onClose }) {
  const [imageSrc, setImageSrc] = useState("");
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  const imgRef = useRef(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setZoom(1.0);
    setPan({ x: 0, y: 0 });

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleImageLoaded = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    let w = 250;
    let h = 250;
    const ratio = naturalWidth / naturalHeight;
    if (ratio > 1) {
      w = 250 * ratio;
    } else {
      h = 250 / ratio;
    }
    setImgSize({ w, h });
  };

  const startDrag = (clientX, clientY) => {
    setIsDragging(true);
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
  };

  const moveDrag = (clientX, clientY) => {
    if (!isDragging) return;
    setPan({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const endDrag = () => {
    setIsDragging(false);
  };

  // Mouse Handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    moveDrag(e.clientX, e.clientY);
  };

  // Touch Handlers
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleConfirm = () => {
    if (!imgRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 250;
    canvas.height = 250;
    const ctx = canvas.getContext("2d");

    // Fundo branco
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 250, 250);

    const w = imgSize.w * zoom;
    const h = imgSize.h * zoom;
    const x = 125 + pan.x - w / 2;
    const y = 125 + pan.y - h / 2;

    ctx.drawImage(imgRef.current, x, y, w, h);

    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], file.name || "avatar.jpg", { type: "image/jpeg" });
        onCrop(croppedFile);
      }
    }, "image/jpeg", 0.85);
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      backdropFilter: "blur(6px)"
    }}>
      <div style={{
        background: "#1e293b",
        border: "1px solid #2c3b52",
        borderRadius: 14,
        padding: 24,
        width: 320,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16
      }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#ffffff" }}>Ajustar e Recortar Foto</h3>

        {/* Viewport de recorte circular */}
        <div 
          onMouseMove={handleMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchMove={handleTouchMove}
          onTouchEnd={endDrag}
          style={{
            width: 250,
            height: 250,
            borderRadius: "50%",
            border: "2px solid #6366f1",
            position: "relative",
            overflow: "hidden",
            cursor: isDragging ? "grabbing" : "grab",
            background: "#243144",
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.65)" // Escurece o fundo fora do círculo
          }}
          className="crop-container"
        >
          {imageSrc && (
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Carregando..."
              onLoad={handleImageLoaded}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              style={{
                width: imgSize.w ? `${imgSize.w}px` : "auto",
                height: imgSize.h ? `${imgSize.h}px` : "auto",
                maxWidth: "none",
                maxHeight: "none",
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                userSelect: "none",
                pointerEvents: "auto"
              }}
            />
          )}
        </div>

        {/* Slider de Zoom */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#cbd5e1" }}>
            <span>Zoom</span>
            <span>{zoom.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="3.0"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ width: "100%", cursor: "pointer", accentColor: "#6366f1" }}
          />
        </div>

        <span style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
          Arraste a imagem para enquadrar o rosto no círculo.
        </span>

        {/* Ações */}
        <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 4 }}>
          <Btn onClick={onClose} style={{ flex: 1, padding: "8px 0" }}>Cancelar</Btn>
          <Btn variant="primary" onClick={handleConfirm} style={{ flex: 1, padding: "8px 0" }}>Confirmar</Btn>
        </div>
      </div>
    </div>
  );
}
