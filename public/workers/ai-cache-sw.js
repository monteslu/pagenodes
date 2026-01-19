/**
 * PageNodes 2 AI Model Cache Service Worker
 *
 * Caches AI models from Hugging Face and other sources for offline use.
 * Models are large files (100MB+) so we use a dedicated cache.
 */

const CACHE_NAME = 'pagenodes-ai-models-v1';

// Patterns for model files to cache
const MODEL_PATTERNS = [
  /huggingface\.co.*\.onnx$/,
  /huggingface\.co.*\.json$/,
  /huggingface\.co.*\.safetensors$/,
  /huggingface\.co.*model.*\.bin$/,
  /huggingface\.co.*tokenizer/,
  /huggingface\.co.*config\.json$/,
  /cdn-lfs\.hf\.co/,
  /cdn-lfs\.huggingface\.co/
];

// Check if URL should be cached
function shouldCache(url) {
  return MODEL_PATTERNS.some(pattern => pattern.test(url));
}

// Install event - just skip waiting
self.addEventListener('install', (event) => {
  console.log('[AI Cache SW] Installing...');
  self.skipWaiting();
});

// Activate event - claim clients and clean old caches
self.addEventListener('activate', (event) => {
  console.log('[AI Cache SW] Activating...');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old cache versions
      caches.keys().then(keys => {
        return Promise.all(
          keys
            .filter(key => key.startsWith('pagenodes-ai-models-') && key !== CACHE_NAME)
            .map(key => {
              console.log('[AI Cache SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      })
    ])
  );
});

// Fetch event - cache-first strategy for model files
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  if (!shouldCache(url)) {
    return; // Let the browser handle it normally
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Try cache first
      const cachedResponse = await cache.match(event.request);

      if (cachedResponse) {
        console.log('[AI Cache SW] Cache hit:', url.slice(0, 80) + '...');
        return cachedResponse;
      }

      // Not in cache, fetch from network
      console.log('[AI Cache SW] Cache miss, fetching:', url.slice(0, 80) + '...');

      try {
        const networkResponse = await fetch(event.request);

        // Only cache successful responses
        if (networkResponse.ok) {
          // Clone the response since we need to use it twice
          const responseToCache = networkResponse.clone();

          // Cache in background (don't block response)
          cache.put(event.request, responseToCache).then(() => {
            console.log('[AI Cache SW] Cached:', url.slice(0, 80) + '...');
          });
        }

        return networkResponse;
      } catch (error) {
        console.error('[AI Cache SW] Fetch failed:', error);
        throw error;
      }
    })
  );
});

// Message handler for cache management
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};

  switch (type) {
    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        event.ports[0]?.postMessage({ size });
      });
      break;

    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME).then(() => {
        event.ports[0]?.postMessage({ success: true });
        console.log('[AI Cache SW] Cache cleared');
      });
      break;

    case 'LIST_CACHED':
      listCachedModels().then(models => {
        event.ports[0]?.postMessage({ models });
      });
      break;
  }
});

// Get total cache size
async function getCacheSize() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();

  let totalSize = 0;
  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.clone().blob();
      totalSize += blob.size;
    }
  }

  return totalSize;
}

// List cached models
async function listCachedModels() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();

  return keys.map(request => {
    const url = new URL(request.url);
    return {
      url: request.url,
      path: url.pathname
    };
  });
}
