/* Coen's app service worker. Upload to: /coens-app/sw.js (so it is served at https://www.coens.nl/coens-app/sw.js) */
var CACHE = 'coens-app-v1';
var SHELL = ['/coens-app/', '/coens-app/manifest.json'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL).catch(function () {}); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var cacheable = url.origin === location.origin || /cdn\.jsdelivr\.net|raw\.githack\.com|fonts\.(googleapis|gstatic)\.com/.test(url.host);
  if (!cacheable) return;
  // Network first, fall back to cache (so prices stay fresh, but the app still opens offline)
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) { return hit || (req.mode === 'navigate' ? caches.match('/coens-app/') : undefined); });
  }));
});
