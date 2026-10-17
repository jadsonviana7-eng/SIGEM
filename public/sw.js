// SIGEM Service Worker — PWA v3.1 (Auto-Update & Offline Support)
const CACHE_NAME = 'sigem-pwa-v3.1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/Logo Prefeitura.png',
  '/favicon.png',
  encodeURI('/Educação em Foco ao Amanhecer.png')
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Força ativação imediata
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[PWA] Limpando cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Assume o controle de todos os clientes abertos imediatamente
      return self.clients.claim();
    })
  );
});

// Listener para forçar atualização via mensagem do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Estratégia de Fetch
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Não intercepta requisições locais de desenvolvimento para permitir HMR e updates imediatos
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return;
  }

  // Ignora chamadas de API externas e Firebase
  if (
    url.origin.includes('firestore.googleapis.com') ||
    url.origin.includes('identitytoolkit.googleapis.com') ||
    url.origin.includes('securetoken.googleapis.com') ||
    url.protocol === 'chrome-extension:'
  ) {
    return;
  }

  // Navegações e páginas HTML: Network-First (sempre busca a versão mais recente do servidor)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match(event.request);
        })
    );
    return;
  }

  // Arquivos estáticos (JS, CSS, imagens): Cache com revalidação
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
