self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
self.addEventListener('fetch', (e) => {
  // Este evento fetch es necesario para que Chrome permita instalar la PWA
  // No hacemos nada de caché por ahora, pasamos directo a la red.
});
