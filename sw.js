const CACHE_NAME = 'vg-erp-cache-v3';
const ASSETS = [
    './',
    'index.html',
    'style.css',
    'app.js',
    'icons/icon-512.png'
];

// Install: Cache essential assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting(); // Force the waiting service worker to become the active one
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Take control of all clients immediately
});

// Fetch: Network First for HTML/JS/CSS, Cache First for assets/icons
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    const isNavigation = event.request.mode === 'navigate';
    const isAsset = ASSETS.some(asset => url.pathname.endsWith(asset));

    if (isNavigation || isAsset) {
        // Network First Strategy
        event.respondWith(
            fetch(event.request).then((response) => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                return response;
            }).catch(() => {
                return caches.match(event.request);
            })
        );
    } else {
        // Default Strategy (Stale-while-revalidate or similar for other requests)
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request);
            })
        );
    }
});
