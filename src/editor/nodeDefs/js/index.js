const nodeDefs = [
  require('./analysis/sentiment'),
  require('./core/debug'),
  require('./core/template'),
  require('./core/function'),
  require('./core/espeak'),
  require('./core/notify'),
  require('./core/inject'),
  require('./core/comment'),
  require('./io/httpin'),
  require('./io/camera'),
  require('./io/meshblu'),
  require('./io/gpio'),
  require('./io/peer2peer'),
  require('./io/socketio'),
  require('./io/geolocate'),
  require('./logic/switch'),
  require('./logic/range'),
  require('./logic/change'),
  require('./parsers/json'),
  require('./storage/localdb')
];

module.exports = function(RED){
  nodeDefs.forEach(function(n){
    n(RED);
  });
}
