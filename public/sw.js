const CACHE_NAME = 'vertx-pwa-v1';

self.addEventListener('install', (event) => {
    // Force immediate activation
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Clients claim immediately
    event.waitUntil(self.clients.claim());
});

// Notifications handling
self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            // Check if there is already a window/tab open with the target URL
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                // If so, just focus it.
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, then open the target URL in a new window/tab.
            if (clients.openWindow) {
                return clients.openWindow('/dashboard');
            }
        })
    );
});

// Basic fetch - Network First (for fresh data) falling back to Cache
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    // Skip API calls (always network)
    if (event.request.url.includes('/api/')) return;
    if (event.request.url.includes('firestore')) return;

    // For now, minimal caching strategy or just pass through
    // to avoid complications with Next.js dynamic routes without proper build step
});
