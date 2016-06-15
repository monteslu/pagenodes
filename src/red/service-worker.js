const CACHE_NAME = 'static-v1';
const extras = require('extras/service-worker');


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

    caches.open(CACHE_NAME)
      .then(function(cache){
        myCache = cache;
        return caches.match(cacheRequest);
      })
      .then(function(cacheResult){

        // console.log('ok from cache', requestURL, cacheResult);
        if(!cacheResult){
          return fetch(event.request)
          .then(function(response){

            var responseToCache = response.clone();

            myCache.put(event.request, responseToCache);
            return response;
          });
        }

        //cache ok, but async store the latest anyway.
        fetch(event.request)
          .then(function(response){
            myCache.put(event.request, response);
          });

        return cacheResult;
      })
      .catch(function(err){
        //not in cache
        // console.log('not in cache', requestURL);
        return fetch(event.request)
          .then(function(response){

            var responseToCache = response.clone();

            myCache.put(event.request, responseToCache);
            return response;
          });
      })

  );

});


extras.loadServiceWorker(self, CACHE_NAME);


