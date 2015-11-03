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

  var cacheRequest = event.request.clone();
  var inspectRequest = event.request.clone();

  // console.log('inspectRequest', inspectRequest);

  event.respondWith(



    fetch(event.request)
      .then(function(response){

        var responseToCache = response.clone();


        caches.open(CACHE_NAME)
          .then(function(cache) {
            if(event.request.method === 'GET'){
              cache.put(event.request, responseToCache);
            }
          });
        return response;

      })
      .catch(function(err){
        console.log('couldnt fetch', err);
        return caches.match(cacheRequest);
      })
  );

});

