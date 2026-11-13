const cacheName = "Stemtitute-Stemtitute Kindergarten App-1.0.1";
const contentToCache = [
    "Build/11132.loader.js",
    "Build/11132.framework.js.gz",
    "Build/11132.data.gz",
    "Build/11132.wasm.gz",
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
            console.log('[Service Worker] Caching all: app shell and content');
            // 使用迴圈單獨快取，避免因為某個檔案 404 導致整個 SW 安裝失敗
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
// 3. 網路請求攔截 (Fetch) - 核心防護
// ==========================================
self.addEventListener('fetch', function (e) {
    // 🛑【終極防護罩】🛑
    // 如果是發往 AWS S3 的請求，直接放行，完全不攔截！
    // 讓 Addressables 自己去處理 IndexedDB 快取，避免重複下載 64MB。
    if (e.request.url.includes('amazonaws.com')) {
        return; 
    }

    // 針對主網頁的請求，直接走網路，避免 ERR_CACHE_MISS
    if (e.request.mode === 'navigate') {
        return;
    }

    // 針對同源資源 (Unity 主程式、HTML、CSS)
    e.respondWith((async function () {
        // 1. 先從快取找
        let response = await caches.match(e.request);
        if (response) { 
            return response; 
        }

        // 2. 快取沒有，去網路抓
        try {
            response = await fetch(e.request);
            if (response && response.status === 200) {
                const cache = await caches.open(cacheName);
                cache.put(e.request, response.clone());
            }
            return response;
        } catch (error) {
            console.warn('[Service Worker] Fetch failed:', error);
            // 如果網路斷了且快取也沒有，回傳一個有效的 Response，防止 ERR_CACHE_MISS
            return new Response("Network error", { status: 408, headers: { "Content-Type": "text/plain" } });
        }
    })());
});