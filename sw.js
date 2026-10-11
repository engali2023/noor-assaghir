const CACHE_NAME = 'noor-assaghir-v1';
const urlsToCache = [
    'index.html',
    'manifest.json',
    'public/icons/icon-192.png',
    'public/icons/icon-512.png',
    'public/icons/icon-maskable-512.png',
    'public/icons/icon-180.png'
];

// Install
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

// Activate
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch - Network First for pages, Cache First for assets
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Exclude login and OAuth routes
    if (url.pathname.includes('/login') || url.pathname.includes('/oauth') || url.pathname.includes('/auth')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Network First for pages
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache First for static assets
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(fetchResponse => {
                const clone = fetchResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return fetchResponse;
            });
        })
    );
});
