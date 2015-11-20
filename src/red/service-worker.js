var CACHE_NAME = 'static-v1';
console.log('im the service worker ok!');


self.addEventListener('activate', function(event) {
  console.log('activate event', event);

});


self.addEventListener('install', function(event) {
  console.log('install', event);
  // event.waitUntil(
  //   caches.open('static-v1')
  //   .then(function(cache) {
  //     return cache.addAll([
  //       '/bggapp/',
  //       '/bggapp/main.bundle.js',
  //       '/bggapp/css/styles.css',
  //       new Request('//storage.googleapis.com/code.getmdl.io/1.0.4/material.indigo-pink.min.css', {mode: 'no-cors'}),
  //       new Request('//fonts.googleapis.com/icon?family=Material+Icons', {mode: 'no-cors'}),
  //       new Request('//storage.googleapis.com/code.getmdl.io/1.0.4/material.min.js', {mode: 'no-cors'})
  //     ]);
  //   })
  // );
});


// self.addEventListener('fetch', function(event) {
//   console.log('fetch event', event.request.url);
//   event.respondWith(
//     caches.match(event.request).then(function(response) {
//       return response || fetch(event.request);
//     })
//   );
// });

self.addEventListener('fetch', function(event) {

  if(event.request.method !== 'GET'){
    return;
  }

  const requestURL = new URL(event.request.url);
  if (requestURL.origin != location.origin){
    return;
  }

  var cacheRequest = event.request.clone();
  // var inspectRequest = event.request.clone();

  // console.log('inspectRequest', inspectRequest);

  var myCache;

  event.respondWith(

    caches.open(CACHE_NAME)
      .then(function(cache){
        myCache = cache;
        return caches.match(cacheRequest);
      })
      .then(function(cacheResult){
        //cache ok, but async store the latest.
        fetch(event.request)
          .then(function(response){

            var responseToCache = response.clone();

            myCache.put(event.request, responseToCache);
            return response;
          });
        return cacheResult;
      })
      .catch(function(err){
        //not in cache
        return fetch(event.request)
          .then(function(response){

            var responseToCache = response.clone();

            myCache.put(event.request, responseToCache);
            return response;
          });
      })


    // fetch(event.request)
    //   .then(function(response){

    //     var responseToCache = response.clone();


    //     caches.open(CACHE_NAME)
    //       .then(function(cache) {
    //         cache.put(event.request, responseToCache);
    //       });
    //     return response;

    //   })
    //   .catch(function(err){
    //     console.log('couldnt fetch', err);
    //     return caches.match(cacheRequest);
    //   })
  );

});

