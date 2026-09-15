/**
 * ALAM ENGAZ EMAIL SIGNATURE HUB - Production Service Worker
 * Version: alam-engaz-hub-v1
 * 
 * Rules:
 * - App shell and static asset caching
 * - Never cache Firebase Authentication or sensitive Firestore endpoints
 * - Graceful offline support for static application shell
 */

const CACHE_NAME = 'alam-engaz-hub-v1';

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/assets/logo.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/icon-180.png',
  '/assets/icon-32.png',
  '/assets/icon-16.png',
  '/manifest.webmanifest'
];

// Domains/paths that MUST NEVER be cached
const SENSITIVE_URL_PATTERNS = [
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firestore.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'apis.google.com',
  '/auth/',
  'clearbook',
  'credential'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS).catch((err) => {
        console.warn('[SW] Non-critical error pre-caching assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = request.url;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Strictly skip sensitive Firebase / Auth requests
  const isSensitive = SENSITIVE_URL_PATTERNS.some((pattern) => url.includes(pattern));
  if (isSensitive) {
    return;
  }

  // For HTML navigation requests: Network First, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // For static assets (CSS, JS, Fonts, Images): Stale While Revalidate
  if (
    url.includes('/assets/') || 
    url.includes('fonts.googleapis.com') || 
    url.includes('fonts.gstatic.com') ||
    url.endsWith('.js') ||
    url.endsWith('.css') ||
    url.endsWith('.png') ||
    url.endsWith('.jpg') ||
    url.endsWith('.svg') ||
    url.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default network fetch
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
