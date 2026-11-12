// ==========================================
// 1. 安裝階段 (Install)
// ==========================================
self.addEventListener('install', function (e) {
    console.log('[Service Worker] Install');
    // 強制讓新的 Service Worker 跳過等待，立即進入激活狀態
    self.skipWaiting(); 
});

// ==========================================
// 2. 激活階段 (Activate)
// ==========================================
self.addEventListener('activate', function (e) {
    console.log('[Service Worker] Activate');
    // 確保新的 Service Worker 接管所有已開啟的頁面
    e.waitUntil(self.clients.claim());
});

// ==========================================
// 3. 網路請求攔截 (Fetch) - 最核心的部分
// ==========================================
self.addEventListener('fetch', function (event) {
    // 🛑【終極防護罩】🛑
    // 只要是發往 AWS S3 的請求 (包含了 amazonaws.com)，二話不說，直接放行！
    // 絕對不攔截、不快取，讓 Unity 的 Addressables 自己去處理 IndexedDB 快取。
    if (event.request.url.includes('amazonaws.com')) {
        return; 
    }

    // 以下是針對「你自己網站同源資源（如 HTML, CSS, JS）」的處理邏輯
    // 採用「網路優先，失敗則讀取快取 (Network First, falling back to cache)」策略
    // 這樣可以確保每次打開網頁都能拿到最新的 Unity 主程式，但斷網時依然能從快取載入。
    event.respondWith(
        fetch(event.request)
            .then(function (response) {
                // 如果請求成功，複製一份回應存入快取 (可選)
                return response;
            })
            .catch(function () {
                // 如果網路斷了，嘗試從快取中尋找
                return caches.match(event.request);
            })
    );
});