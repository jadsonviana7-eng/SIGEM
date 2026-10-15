// Registrador de Service Worker para PWA (Progressive Web App) com Auto-Atualização
let isRefreshing = false;

export function register() {
  if ('serviceWorker' in navigator) {
    // Escuta troca de controle para recarregar a aplicação de forma limpa e imediata
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!isRefreshing) {
        isRefreshing = true;
        console.log('[PWA] Nova versão ativada! Atualizando interface...');
        window.location.reload();
      }
    });

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL || ''}/sw.js`;

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('[PWA] Service Worker registrado:', registration.scope);

          // Função para ativar imediatamente qualquer worker em espera
          function activateWaitingWorker(worker) {
            if (worker) {
              worker.postMessage({ type: 'SKIP_WAITING' });
            }
          }

          // Se já houver um worker esperando para ser ativado
          if (registration.waiting) {
            activateWaitingWorker(registration.waiting);
          }

          // Quando uma nova versão for encontrada
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[PWA] Nova versão instalada. Forçando ativação...');
                  activateWaitingWorker(installingWorker);
                } else {
                  console.log('[PWA] Conteúdo armazenado em cache para uso offline.');
                }
              }
            };
          };

          // Checar ativamente por atualizações ao reabrir/focar no app
          const triggerUpdateCheck = () => {
            registration.update().catch((err) => {
              console.log('[PWA] Verificação de atualização:', err);
            });
          };

          window.addEventListener('focus', triggerUpdateCheck);
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              triggerUpdateCheck();
            }
          });

          // Checagem periódica a cada 5 minutos
          setInterval(triggerUpdateCheck, 5 * 60 * 1000);
        })
        .catch((error) => {
          console.error('[PWA] Falha ao registrar Service Worker:', error);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
