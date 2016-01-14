var meshblu = require('meshblu');
var _ = require('lodash');

var when = require('when');

var getDevices = require('./lib/getDevices');
var register = require('./lib/register');
var claim = require('./lib/claim');

var RPC_TIMEOUT = 10000;

function isBroadcast(data){
  var broadcast = false;
  _.forEach(data.devices, function(device){
    if(device === '*' || device === 'all'){
      broadcast = true;
    }
  });
  return broadcast;
}

function init(RED) {

  function meshbluserverNode(n) {
    var self = this;
    RED.nodes.createNode(self,n);
    self.server = n.server || 'meshblu.octoblu.com';

    if(!_.startsWith(self.server, 'wss://')){
      self.server = 'wss://' + self.server;
    }
    self.port = n.port || 443;
    self.uuid = n.uuid;
    self.token = n.token;

    var options = {
      server: self.server,
      port: self.port,
      uuid: self.uuid,
      token: self.token
    };
    self.conn = meshblu.createConnection(options);

    self.directs = [];
    self.subs = [];

    self.conn.on('ready', function(data){
      self.conn.connected = true;

      _.forEach(RED.nodes.getFlows(), function(n){
        if(n.server === self.id){
          var mnode = RED.nodes.getNode(n.id);
          if(n.type === 'meshblu in'){
            if(mnode.directToMe){
              self.directs.push(mnode);
            }else{
              self.subs.push(mnode);
              self.conn.subscribe({ uuid: mnode.uuid, types: ['broadcast'] }, function(err){
                console.log('subscribed to', mnode.uuid, err);
              });
            }
          }

          if(n.type === 'meshblu in' || n.type === 'meshblu out'){
            mnode.status({fill:"green",shape:"dot",text:"connected"});
          }
        }
      });

    });

    self.conn.on('message', function(data, fn){
      if(data.devices){
        if(!_.isArray(data.devices)){
          data.devices = [data.devices];
        }
        if(isBroadcast(data)){
          _.forEach(self.subs, function(sub){
            if(sub.uuid === data.fromUuid){
              sub.send(data);
            }
          });
        }else{
          _.forEach(self.directs, function(direct){
            direct.send(data);
          });
        }
      }
    });

    self.conn.on('error', function(err){
       console.log('error in meshblu connection', err);
    });

    self.on('close', function() {
      if (self.conn.connected) {
        console.log('close meshblu connection');
        self.conn.close();
      }
    });

    self.conn.alternateMethod = function(name, msg, fn){
      try{
        self.conn[name](msg, fn);
      }catch(exp){
        console.log('error calling alternateMethod', name, msg, exp);
      }
    }
  }
  RED.nodes.registerType("meshblu-server", meshbluserverNode);

  function meshbluInNode(n) {
    var self = this;
    RED.nodes.createNode(self,n);
    self.topic = n.topic;
    self.server = n.server;
    self.serverConfig = RED.nodes.getNode(self.server);
    self.directToMe = n.directToMe;
    self.uuid = n.uuid;
  }
  RED.nodes.registerType("meshblu in",meshbluInNode);

  function meshbluOutNode(n) {
    var self = this;
    RED.nodes.createNode(self,n);
    self.server = n.server;
    self.serverConfig = RED.nodes.getNode(self.server);
    self.broadcast = n.broadcast;
    self.uuid = n.uuid;
    self.forwards = n.forwards;

    if (self.serverConfig) {
      var node = self;
      self.on("input",function(msg) {
        if(!msg.devices){
          if(self.broadcast){
            msg.devices = '*';
          }else{
            if(self.uuid){
              msg.devices = [self.uuid];
            }
          }
        }
        if(msg.devices){
          try{
            var conn = self.serverConfig.conn;
            if(self.forwards && !msg.reply){
              var responded = false;
              function handleResponse(resp){
                if(!responded){
                  responded = true;
                  msg.payload = resp;
                  node.send(msg);
                }
              }
              if(msg.alternateMethod){
                conn.alternateMethod(msg.alternateMethod, msg, handleResponse);
              }else{
                conn.message(msg, handleResponse);
              }
              setTimeout(function(){
                if(!responded){
                  responded = true;
                  msg.payload = {error: "request timeout"};
                  self.send(msg);
                }
              },msg.timeout || RPC_TIMEOUT);
            }else{
              if(msg.reply){
                if(msg.ack && msg.fromUuid){
                  msg.devices = msg.fromUuid;
                  delete msg.fromUuid;
                  msg.payload = msg.reply;
                  delete msg.reply;
                  conn.alternateMethod('_messageAck', msg);
                }else{
                  console.log('cant reply without an ack and fromUuid', msg);
                }
              }else{
                conn.message(msg);
              }

            }
          }catch(err){
            console.log('errr sending', err);
          }
        }

      });
    } else {
      self.error("missing server configuration");
    }
  }

  RED.nodes.registerType("meshblu out",meshbluOutNode);

  //routes

  RED.events.on("rpc_meshblu/register", register);
  RED.events.on("rpc_meshblu/getDevices", getDevices);
  RED.events.on("rpc_meshblu/claim", claim);
}

module.exports = init;
