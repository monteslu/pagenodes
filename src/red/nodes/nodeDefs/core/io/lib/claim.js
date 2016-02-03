'use strict';

var rest = require('rest');
var mime = require('rest/interceptor/mime');
var errorCode = require('rest/interceptor/errorCode');
var when = require('when');
var getPath = require('./getPath');

var client = rest.wrap(mime).wrap(errorCode);

function claim(req){
  try{
    req.query = req.params[0];
    var path = getPath(req, '/claimdevice/' + req.query.toClaim);

    var headers = {
      meshblu_auth_uuid: req.query.uuid,
      meshblu_auth_token: req.query.token,
    };

    console.log('claimdevice', path);

    client({
      path: path,
      method: 'PUT',
      headers: headers
    })
    .then(function(data){
      return req.reply({uuid: req.query.toClaim});
    })
    .otherwise(function(err){
      console.log('error', err);
      req.reply({error: err});
    });
  }catch(exp){
    console.log('err', exp);
    req.reply({error: exp});
  }
}

module.exports = claim;
