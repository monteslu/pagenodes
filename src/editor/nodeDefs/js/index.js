const nodeDefs = [
  require('./core/comment'),
  require('./io/meshblu')
];

module.exports = function(RED){
  nodeDefs.forEach(function(n){
    n(RED);
  });
}
