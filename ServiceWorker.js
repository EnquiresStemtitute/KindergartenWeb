// 🌟 版本號改成 1.0.6
const cacheName = "Stemtitute-Stemtitute Kindergarten App-1.0.6"; 
const contentToCache = [
    "Build/11137.loader.js",
    "Build/11137.framework.js.unityweb",
    "Build/11137.data.unityweb",
    "Build/11137.wasm.unityweb",
    "TemplateData/style.css"
];

// ==========================================
// 1. 安裝階段 (Install)
// ==========================================
self.addEventListener('install', function (e) {
    console.log('[Service Worker] Install');
    e.waitUntil((async function () {
        try {
            const cache = await caches.open(cacheName);
            for (let url of contentToCache) {
                try {
                    await cache.add(url);
                } catch (err) {
                    console.warn(`[Service Worker] Failed to cache: ${url}`, err);
                }
            }
        } catch (err) {
            console.error('[Service Worker] Cache open failed', err);
        }
    })());
    self.skipWaiting();
});

// ==========================================
// 2. 激活階段 (Activate)
// ==========================================
self.addEventListener('activate', function (e) {
    console.log('[Service Worker] Activate');
    e.waitUntil(self.clients.claim());
});

// ==========================================
// 3. 網路請求攔截 (Fetch)
// ==========================================
self.addEventListener('fetch', function (e) {
    // 🛑 S3 請求直接放行
    if (e.request.url.includes('amazonaws.com')) {
        return; 
    }

    // 主網頁直接走網路
    if (e.request.mode === 'navigate') {
        return;
    }

    // 針對同源資源
    e.respondWith((async function () {
        // 1. 先找快取
        let response = await caches.match(e.request);
        if (response) { 
            return response; 
        }

        // 2. 去網路抓
        try {
            response = await fetch(e.request);
            if (response && response.status === 200) {
                const cache = await caches.open(cacheName);
                cache.put(e.request, response.clone());
            }
            return response;
        } catch (error) {
            console.warn('[Service Worker] Fetch failed, network might be down:', error);
            
            // 🌟 關鍵修正：不要再回傳假 408，直接找快取，或者回傳空值讓瀏覽器正常報錯
            let cacheResponse = await caches.match(e.request);
            if (cacheResponse) return cacheResponse;
            
            return; 
        }
    })());
});