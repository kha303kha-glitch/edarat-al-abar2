/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "dab82930e1ed18983cc072832962edd3"
  }, {
    "url": "pwa-512x512.png",
    "revision": "e327a1fbdce33180164b24fd34bbc8d7"
  }, {
    "url": "pwa-192x192.png",
    "revision": "e7d272172a9f041a3a1b4779798c54b7"
  }, {
    "url": "index.html",
    "revision": "335eaceae9d242c89fdb9c5d3d6f86f7"
  }, {
    "url": "icon.svg",
    "revision": "736f6169965757b1c7efe51e9accfa94"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "7a6e3d9ec02f08c36ae17c7266f2fd0c"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/web-TdIyQkss.js",
    "revision": null
  }, {
    "url": "assets/web-JVu-3xRM.js",
    "revision": null
  }, {
    "url": "assets/web-C2lC5aDB.js",
    "revision": null
  }, {
    "url": "assets/index-CzzHMrBs.js",
    "revision": null
  }, {
    "url": "assets/index-B_5gWQlt.css",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "7a6e3d9ec02f08c36ae17c7266f2fd0c"
  }, {
    "url": "icon.svg",
    "revision": "736f6169965757b1c7efe51e9accfa94"
  }, {
    "url": "pwa-192x192.png",
    "revision": "e7d272172a9f041a3a1b4779798c54b7"
  }, {
    "url": "pwa-512x512.png",
    "revision": "e327a1fbdce33180164b24fd34bbc8d7"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "dab82930e1ed18983cc072832962edd3"
  }, {
    "url": "manifest.webmanifest",
    "revision": "7d81597de080851fdf631f7768f5c5be"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i, new workbox.CacheFirst({
    "cacheName": "osm-tiles-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 200,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
