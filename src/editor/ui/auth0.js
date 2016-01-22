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

  // Find out if there is an ID token
  function checkAuth(){
    var id_token = localStorage.getItem('id_token');
    if (id_token) {
      lock.getProfile(id_token, function (err, profile) {
        if (err) {
          console.log('profile error: '+ err.message);
          return alert('There was an error geting the profile: ' + err.message);
        }
        console.log('Profile Name: '+profile.name);
        document.getElementById('auth0login').style.display = 'none';
        document.getElementById('auth0logout').display = '';
        document.getElementById('auth0-name').textContent = profile.name;
      })
    } else {
      document.getElementById('auth0logout').style.display = 'none';
      document.getElementById('auth0login').style.display = '';
      console.log('No one logged in');
    }
  }

  // logOut
  function logOut() {
    console.log('auth0: logOut');
    localStorage.removeItem('id_token');
    window.location.href = '/';
  }

  // logIn
  function logIn() {
    console.log('logIn');
    lock.show({ authParams: { scope: 'openid'  }  });
  }
  RED.auth0 = {
    auth0test: 'test',
    logOut: logOut,
    logIn: logIn,
    checkAuth: checkAuth  }
}
