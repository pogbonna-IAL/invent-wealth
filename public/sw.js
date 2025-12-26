// Service Worker for InventWealth PWA
const CACHE_NAME = "invent-wealth-v1";
const STATIC_CACHE_NAME = "invent-wealth-static-v1";
const DYNAMIC_CACHE_NAME = "invent-wealth-dynamic-v1";
const API_CACHE_NAME = "invent-wealth-api-v1";

const urlsToCache = [
  "/",
  "/dashboard",
  "/manifest.json",
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: "cache-first",
  NETWORK_FIRST: "network-first",
  STALE_WHILE_REVALIDATE: "stale-while-revalidate",
  NETWORK_ONLY: "network-only",
  CACHE_ONLY: "cache-only",
};

// Install event - cache essential resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(urlsToCache).catch((err) => {
          console.log("Static cache addAll failed:", err);
        });
      }),
      caches.open(DYNAMIC_CACHE_NAME),
      caches.open(API_CACHE_NAME),
    ])
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE_NAME &&
            cacheName !== DYNAMIC_CACHE_NAME &&
            cacheName !== API_CACHE_NAME &&
            cacheName !== CACHE_NAME
          ) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the service worker takes control immediately
  return self.clients.claim();
});

// Helper function to determine cache strategy
function getCacheStrategy(url) {
  // API routes - Network first with cache fallback
  if (url.includes("/api/")) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }
  // Static assets - Cache first
  if (
    url.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/) ||
    url.includes("/_next/static")
  ) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }
  // HTML pages - Stale while revalidate
  return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
}

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline page or error response
    return new Response("Offline", { status: 503 });
  }
}

// Network first strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response("Offline", { status: 503 });
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      })
      .catch(() => null);

  return cachedResponse || (await fetchPromise) || new Response("Offline", { status: 503 });
}

// Fetch event - Advanced caching strategies
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip cross-origin requests (unless they're for images/assets)
  if (!event.request.url.startsWith(self.location.origin)) {
    // Allow cross-origin images and fonts
    if (
      event.request.destination === "image" ||
      event.request.destination === "font"
    ) {
      event.respondWith(fetch(event.request));
    }
    return;
  }

  const url = new URL(event.request.url);
  const strategy = getCacheStrategy(url.href);

  let cacheName = DYNAMIC_CACHE_NAME;
  if (url.href.includes("/api/")) {
    cacheName = API_CACHE_NAME;
  } else if (
    url.href.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/) ||
    url.href.includes("/_next/static")
  ) {
    cacheName = STATIC_CACHE_NAME;
  }

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      event.respondWith(cacheFirst(event.request, cacheName));
      break;
    case CACHE_STRATEGIES.NETWORK_FIRST:
      event.respondWith(networkFirst(event.request, cacheName));
      break;
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      event.respondWith(staleWhileRevalidate(event.request, cacheName));
      break;
    default:
      event.respondWith(fetch(event.request));
  }
});

// Push notification event
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "InventWealth";
  const options = {
    body: data.body || "You have a new notification",
    icon: "/invent-alliance-logo-small.svg",
    badge: "/invent-alliance-logo-small.svg",
    tag: data.tag || "default",
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

