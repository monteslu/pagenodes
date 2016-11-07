var server = require("./server");
var nodes = require("./nodes");
var library = require("./api/library");
var comms = require("./comms");
var plugin = require("./plugin");
var log = require("./log");
var util = require("./util");
var settings = require("./settings");
var credentials = require("./nodes/credentials");
var path = require('path');
var events = require("./events");


var PN = {
  init: function() {
    comms.start();
    plugin.start();
    log.init({});
    settings.init();
  },
  backend: true,
  start: server.start,
  stop: server.stop,
  nodes: nodes,
  library: { register: library.register },
  credentials: credentials,
  events: events,
  log: log,
  comms: comms,
  plugin: plugin,
  settings:settings,
  util: util,
  auth: {
    // needsPermission: auth.needsPermission
  },
  version: function () {
    return '1.0.0';
  },
  get server() { return server.server },
  _:function(a,b){
    if(b){
      return a+' '+b;
    }
    return a;
  }
};

module.exports = PN;
