"use strict";

/*
    Futureમાં major update કરો ત્યારે:
    scooter-tracker-v1 ને v2, v3 એમ બદલતા રહેવું.
*/

const CACHE_NAME = "scooter-tracker-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

/* =====================================================
   INSTALL
===================================================== */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting()),
  );
});

/* =====================================================
   ACTIVATE AND REMOVE OLD CACHE
===================================================== */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }

            return Promise.resolve();
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

/* =====================================================
   FETCH
   Online: latest file load and cache
   Offline: cached file load
===================================================== */

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  event.respondWith(handleFileRequest(request));
});

async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put("./index.html", networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedPage =
      (await caches.match("./index.html")) || (await caches.match("./"));

    if (cachedPage) {
      return cachedPage;
    }

    return new Response(
      `
                <!DOCTYPE html>
                <html lang="gu">
                <head>
                    <meta charset="UTF-8">
                    <meta
                        name="viewport"
                        content="width=device-width, initial-scale=1"
                    >
                    <title>Offline</title>
                </head>

                <body style="
                    font-family: Arial, sans-serif;
                    padding: 30px;
                    text-align: center;
                    color: #0f172a;
                ">
                    <h2>Scooter Tracker Offline છે</h2>

                    <p>
                        Appની files હજી download થઈ નથી.
                        એક વખત internet સાથે website open કરો.
                    </p>
                </body>
                </html>
            `,
      {
        headers: {
          "Content-Type": "text/html; charset=UTF-8",
        },
      },
    );
  }
}

async function handleFileRequest(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response("Offline file unavailable", {
      status: 503,
      statusText: "Offline",
    });
  }
}
