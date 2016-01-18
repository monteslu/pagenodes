var server = require("./server");
var nodes = require("./nodes");
var library = require("./api/library");
var comms = require("./comms");
var log = require("./log");
var util = require("./util");
// var fs = require("fs");
var settings = require("./settings");
var credentials = require("./nodes/credentials");
// var auth = require("./api/auth");
var path = require('path');
var events = require("./events");


var RED = {
    init: function(httpServer,userSettings) {
        comms.start();
        userSettings.version = this.version();
        log.init(userSettings);
        settings.init(userSettings);
        server.init(httpServer,settings);
        return server.app;
    },
    start: server.start,
    stop: server.stop,
    nodes: nodes,
    library: { register: library.register },
    credentials: credentials,
    events: events,
    log: log,
    comms: comms,
    settings:settings,
    util: util,
    auth: {
        // needsPermission: auth.needsPermission
    },
    version: function () {
        return '1.0.0';
    },
    get app() { console.log("Deprecated use of RED.app - use RED.httpAdmin instead"); return server.app },
    get httpAdmin() { return server.app },
    get httpNode() { return server.nodeApp },
    get server() { return server.server }
};

module.exports = RED;
