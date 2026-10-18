// Service worker do portfólio: abre offline depois da primeira visita.
// Páginas: rede primeiro (sempre a versão mais nova), cache como reserva.
// Imagens, fontes e arquivos com hash: cache primeiro.
const CACHE = 'jm-portfolio-v1';
const CORE = ['./', './index.html', './favicon.png', './manifest.webmanifest', './img/logo-mark.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/_vercel/')) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => { caches.open(CACHE).then((c) => c.put('./index.html', res.clone())); return res; })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok && /\.(webp|png|svg|woff2?|js|css|pdf)$/.test(url.pathname)) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    })),
  );
});
