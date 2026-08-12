const CACHE_NAME = 'vg-erp-cache-v90';
const ASSETS = [
    './',
    'index.html',
    'style.css',
    'js/bootstrap.js',
    'js/core.js',
    'js/ui.js',
    'js/init.js',
    'js/login.js',
    'js/inventory.js',
    'js/home.js',
    'js/nhap.js',
    'js/dukien.js',
    'js/xuat.js',
    'js/chuyenkho.js',
    'js/sanpham.js',
    'js/sanphamkho.js',
    'js/doisoat.js',
    'js/nhanvien.js',
    'js/khachhang.js',
    'login.html',
    'nhap.html',
    'dukien.html',
    'xuat.html',
    'chuyenkho.html',
    'sanpham.html',
    'sanphamkho.html',
    'doisoat.html',
    'nhanvien.html',
    'khachhang.html',
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
