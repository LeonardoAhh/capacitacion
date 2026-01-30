const CACHE_NAME = 'vertx-pwa-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    let targetUrl = '/dashboard'; // Default

    // Handle actions
    if (event.action === 'view_contracts' || event.notification.tag === 'expiring-contracts') {
        targetUrl = '/employees';
    } else if (event.action === 'view_evals' || event.notification.tag === 'osverdue-evals') {
        targetUrl = '/reports'; // Or wherever evals are managed
    } else if (event.action === 'close') {
        return;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Check if there is already a window/tab open with the target URL
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith(self.location.origin)) return;
    if (event.request.url.includes('/api/')) return;
    if (event.request.url.includes('firestore')) return;
    // Network only for now to ensure freshness
});
