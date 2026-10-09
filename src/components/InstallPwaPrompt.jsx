import React, { useState, useEffect } from 'react';

export default function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

    if (isIosDevice && !isStandalone) {
      setShowIOSHint(true);
    }

    // Ouvinte para navegadores compatíveis com beforeinstallprompt (Chrome/Edge/Android/etc)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Ocultar quando instalado
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('[PWA] Aplicativo instalado com sucesso!');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt && !showIOSHint) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '18px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      maxWidth: '92%',
      width: '420px',
      backgroundColor: '#0f172a',
      color: '#ffffff',
      padding: '14px 18px',
      borderRadius: '16px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'slideUp 0.3s ease-out'
    }}>
      <img
        src="/icon-192.png"
        alt="SIGEM Logo"
        style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'contain', background: '#1e293b', padding: '4px' }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '14px', color: '#f8fafc' }}>
          Instalar o App SIGEM
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
          {showIOSHint ? (
            <span>Toque em <b>Compartilhar</b> <i className="ti ti-share" /> e em <b>Adicionar à Tela de Início</b>.</span>
          ) : (
            <span>Acesso rápido e tela cheia direto no seu celular.</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {showPrompt && (
          <button
            onClick={handleInstallClick}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Instalar
          </button>
        )}
        <button
          onClick={() => {
            setShowPrompt(false);
            setShowIOSHint(false);
          }}
          aria-label="Fechar"
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '4px',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
