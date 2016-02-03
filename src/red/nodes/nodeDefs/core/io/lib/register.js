'use strict';

var rest = require('rest');
var mime = require('rest/interceptor/mime');
var errorCode = require('rest/interceptor/errorCode');
var when = require('when');
var getPath = require('./getPath');

var client = rest.wrap(mime);

function register(req){
  req.query = req.params[0];
  try{
    client({
      path: getPath(req, '/devices'),
      method: 'POST',
      params: {type: req.query.type || 'pagenodes', name: req.query.name || 'pagenodes', receiveWhitelist: ['*'], sendWhitelist: ['*'], discoverWhitelist: ['*']}
    })
    .then(function(data){
      console.log('resp ok', data.entity);
      req.reply(data.entity);
    }, function(err){
      console.error('error', err);
      req.reply({error: err});
    });
  }catch(error){
    console.error('error', error);
    req.reply({error});
  }
}

module.exports = register;
