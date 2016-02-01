module.exports = function(RED) {
  console.log('auth0 loading...');

  // Setup the lock
  var lock = new Auth0Lock('oEiNZJUMa7W5MlYMY1eIAjTcEftWelmn', 'samrocksc.auth0.com')
  console.log('auth0 lock has been called: ',lock);

  //Check and see if a hash exists
  var hash = lock.parseHash(window.location.hash);
  console.log('auth0 hash:',hash);
  if (hash) {
    if (hash.error) {
      console.log("There was an error logging in", hash.error);
      alert('There was an error: ' + hash.error + '\n' + hash.error_description);
    } else {
      //save the token in the session:
      localStorage.setItem('id_token', hash.id_token);
    }
  }

  // logOut
  function logOut() {
    console.log('logOut');
  }

  // logIn
  function logIn() {
    console.log('logIn')
  }
  RED.auth0 = {
    auth0test: 'test',
    logOut: logOut,
    logIn: logIn
  }
}
