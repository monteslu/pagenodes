const nodeDefs = [
  require('./analysis/sentiment'),
  //require('./core/catch'),
  //require('./core/status'),
  //require('./core/debug'),
  //require('./core/exec'),
  //require('./core/delay'),
  //require('./core/trigger'),
  //require('./core/unknown'),
  //require('./core/mqtt'),
  require('./core/template'),
  require('./core/function'),
  require('./core/espeak'),
  require('./core/notify'),
  require('./core/inject'),
  require('./core/comment'),
  require('./io/meshblu'),
  require('./io/gpio')
];

module.exports = function(RED){
  nodeDefs.forEach(function(n){
    n(RED);
  });
}
