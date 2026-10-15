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
      bottom: '76px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 90,
      maxWidth: '92%',
      width: '420px',
      backgroundColor: '#1e293b',
      color: '#ffffff',
      padding: '14px 18px',
      borderRadius: '16px',
      boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 8px 12px -6px rgba(0, 0, 0, 0.7)',
      border: '1px solid #2c3b52',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'slideUp 0.3s ease-out'
    }}>
      <img
        src="/logo.png"
        alt="SIGEM Logo"
        style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'contain', background: '#243144', border: '1px solid #33435c', padding: '4px' }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '14px', color: '#ffffff' }}>
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

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {showPrompt && (
          <button
            onClick={handleInstallClick}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
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
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
