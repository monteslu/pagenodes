const events = require("events");

module.exports = function(PN){
  PN.events = new events.EventEmitter();
};
