const nodeDefs = [
  require('./analysis/sentiment'),
  require('./core/catch'),
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
