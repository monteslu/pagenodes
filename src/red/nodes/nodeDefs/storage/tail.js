module.exports = function(RED) {
  "use strict";
  var spawn = require('child_process').spawn;
  var plat = require('os').platform();

  if (plat.match(/^win/)) {
    throw RED._("tail.errors.windowsnotsupport");
  }

  function TailNode(n) {
    RED.nodes.createNode(this,n);

    this.filename = n.filename;
    this.split = n.split;
    var node = this;

    var err = "";
    var tail = spawn("tail", ["-F", "-n", "0", this.filename]);
    tail.stdout.on("data", function (data) {
      if (node.split) {
        var strings = data.toString().split("\n");
        for (var s in strings) {
          if (strings[s] !== "") {
            node.send({
              topic: node.filename,
              payload: strings[s]
            });
          }
        }
      }
      else {
        var msg = {
          topic:node.filename,
          payload: data.toString()
        };
        node.send(msg);
      }
    });

    tail.stderr.on("data", function(data) {
      node.error(data.toString());
    });

    this.on("close", function() {
      /* istanbul ignore else */
      if (tail) { tail.kill(); }
    });
  }

  RED.nodes.registerType("tail",TailNode);
}

