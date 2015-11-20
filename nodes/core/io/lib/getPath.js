var _ = require('lodash');

module.exports = function(req, path){
  req = req || {};
  req.query = req.query || {};
  var defaults = {server: 'meshblu.octoblu.com', port: 443, protocol: 'https'};
  var query = _.extend(req.query || {}, defaults);
  console.log('query', query, req.query);
  query.server = query.server.trim();
  if(_.isString(query.server)){
    query.server = query.server.toLowerCase();
  }
  if(query.port === 443 || query.port === '443'){
    query.protocol = 'https';
  }else{
    query.protocol = 'http';
  }
  // if(query.server.indexOf('http') !== 0){
  //   query.server = query.protocol + '://' + query.server;
  // }
  return 'https://' + query.server + ':' + query.port + path;
};
