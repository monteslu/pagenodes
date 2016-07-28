const events = require("events");

module.exports = function(RED){
  RED.events = new events.EventEmitter();
};

