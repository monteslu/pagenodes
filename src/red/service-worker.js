var CACHE_NAME = 'static-v1';
console.log('im the service worker ok!');


self.addEventListener('activate', function(event) {
  console.log('activate event', event);

});


self.addEventListener('install', function(event) {
  console.log('install', event);
});


self.addEventListener('fetch', function(event) {

  if(event.request.method !== 'GET'){
    return;
  }

  const requestURL = new URL(event.request.url);
  if (requestURL.origin != location.origin){
    return;
  }

  var cacheRequest = event.request.clone();

  var myCache;

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

