const nopt = require("nopt");
const path = require("path");
const PN = require("./pn");
const log = require("./log");
const extras = require("extras");
const settings = require('./settings');

try {
  PN.init();
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
  window.PN = PN;
  // require('extras').loadServerExtras(PN);
}).catch(function(err) {
  PN.log.error(log._("server.failed-to-start"));
  if (err.stack) {
    PN.log.error(err.stack);
  } else {
    PN.log.error(err);
  }
});

