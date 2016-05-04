require('babel-core/polyfill'); //@#$! safari

const nopt = require("nopt");
const path = require("path");
const PN = require("./red");
const log = require("./log");
const extras = require("extras");

try {
    PN.init({},{});
} catch(err) {
    console.log("Failed to start server:");
    if (err.stack) {
        console.log(err.stack);
    } else {
        console.log(err);
    }
}


PN.start().then(function() {
    //post message back to parent
    console.log('backend started');
    extras.backendReady(PN);
    PN.comms.publishReady();
    // require('extras').loadServerExtras(PN);
}).catch(function(err) {
    PN.log.error(log._("server.failed-to-start"));
    if (err.stack) {
        PN.log.error(err.stack);
    } else {
        PN.log.error(err);
    }
});

window.PN = PN;

