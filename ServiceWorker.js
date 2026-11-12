self.addEventListener('fetch', function(event) {
    // 重點：如果請求是發往 S3，直接 return 放行
    if (event.request.url.includes('amazonaws.com')) {
        return; 
    } console.log('[Service Worker] Install');
    
});

