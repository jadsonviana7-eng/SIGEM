const CACHE_NAME = 'sigem-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/Logo.png',
  '/Logo Prefeitura.png'
];

// Instalação do Service Worker e pré-cache de ativos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de Fetch: Network-First com fallback para Cache
self.addEventListener('fetch', (event) => {
  // Ignora chamadas que não sejam GET e requisições para o Firebase Firestore / Auth
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignora extensões do Chrome ou chamadas de API externas dinâmicas
  if (url.origin.includes('firestore.googleapis.com') ||
      url.origin.includes('identitytoolkit.googleapis.com') ||
      url.protocol === 'chrome-extension:') {
    return;
  }

  // Navegações e páginas HTML: Network first, fallback para cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
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

  // Arquivos estáticos (imagens, scripts, css): Stale-While-Revalidate
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
