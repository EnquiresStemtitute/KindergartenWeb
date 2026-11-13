const cacheName = "Stemtitute-Stemtitute Kindergarten App-1.0.1";
const contentToCache = [
    "Build/KindergartenWeb1113.loader.js",
    "Build/KindergartenWeb1113.framework.js.gz",
    "Build/KindergartenWeb1113.data.gz",
    "Build/KindergartenWeb1113.wasm.gz",
    "TemplateData/style.css"
];

// ==========================================
// 1. 安裝階段 (Install) - 保留你的預加載邏輯
// ==========================================
self.addEventListener('install', function (e) {
    console.log('[Service Worker] Install');
    e.waitUntil((async function () {
        const cache = await caches.open(cacheName);
        console.log('[Service Worker] Caching all: app shell and content');
        await cache.addAll(contentToCache);
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
// 3. 網路請求攔截 (Fetch) - 核心修改區域
// ==========================================
self.addEventListener('fetch', function (e) {
    // 🛑【終極防護罩】🛑
    // 如果是發往 AWS S3 的請求，直接放行，完全不攔截！
    if (e.request.url.includes('amazonaws.com')) {
        return; 
    }

    // 以下邏輯僅針對同源資源 (你的 Unity 主程式、HTML、CSS)
    e.respondWith((async function () {
        // 1. 先從快取找
        let response = await caches.match(e.request);
        if (response) { 
            return response; 
        }

        // 2. 快取沒有，去網路抓
        try {
            response = await fetch(e.request);
            
            // 只有當請求是同源 (basic) 或成功 (cors) 且狀態碼是 200 時，才存入快取
            // 避免將錯誤的頁面或不支援的跨域請求存入
            if (response && response.status === 200) {
                const cache = await caches.open(cacheName);
                // 複製一份 response 存入快取，回傳原本的給網頁
                cache.put(e.request, response.clone());
            }
            return response;
        } catch (error) {
            console.error('[Service Worker] Fetch failed:', error);
            // 如果網路斷了且快取也沒有，這裡可以選擇回傳一個自訂的離線頁面
        }
    })());
});