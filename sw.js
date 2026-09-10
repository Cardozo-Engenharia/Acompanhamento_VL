/* Cache do painel de acompanhamento de VL — permite uso sem sinal no subsolo.
   Funciona com qualquer nome de arquivo: a página informa o próprio endereço
   no momento do registro (sw.js?page=...). */

const CACHE = 'vl-acomp-v3';
const PAGINA = new URL(self.location).searchParams.get('page') || './';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(['./', PAGINA].filter((v, i, a) => a.indexOf(v) === i)))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;   // chamadas à base não passam pelo cache

  e.respondWith(
    fetch(e.request)
      .then(resp => {
        const copia = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {});
        return resp;
      })
      .catch(() =>
        caches.match(e.request, { ignoreSearch: e.request.mode === 'navigate' })
          .then(r => r || (e.request.mode === 'navigate'
            ? caches.match(PAGINA, { ignoreSearch: true }).then(x => x || caches.match('./'))
            : undefined))
      )
  );
});
