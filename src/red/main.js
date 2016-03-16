require('babel-core/polyfill'); //@#$! safari

const nopt = require("nopt");
const path = require("path");
const RED = require("./red");
const log = require("./log");
const extras = require("extras");

nopt.invalidHandler = function(k,v,t) {
    // TODO: console.log(k,v,t);
}

var settings = {};

var server = {};

function formatRoot(root) {
    if (root[0] != "/") {
        root = "/" + root;
    }
    if (root.slice(-1) != "/") {
        root = root + "/";
    }
    return root;
}

try {
    RED.init(server,settings);
} catch(err) {
    console.log("Failed to start server:");
    if (err.stack) {
        console.log(err.stack);
    } else {
        console.log(err);
    }
}


RED.start().then(function() {
    //post message back to parent
    console.log('backend started');
    extras.backendReady(RED);
    RED.comms.publishReady();
    // require('extras').loadServerExtras(RED);
}).catch(function(err) {
    RED.log.error(log._("server.failed-to-start"));
    if (err.stack) {
        RED.log.error(err.stack);
    } else {
        RED.log.error(err);
    }
});



