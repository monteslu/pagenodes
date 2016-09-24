module.exports = function(RED) {
  "use strict";

  function InjectNode(n) {

    RED.nodes.createNode(this,n);
    this.topic = n.topic;
    this.payload = n.payload;
    this.payloadType = n.payloadType;
    this.repeat = n.repeat;
    this.crontab = n.crontab;
    this.once = n.once;
    var node = this;
    this.type = 'inject';
    this.interval_id = null;
    this.cronjob = null;
    this.allowDebugInput = n.allowDebugInput;
    console.log('inject node', n, this);

    if (this.repeat && !isNaN(this.repeat) && this.repeat > 0) {
      this.repeat = this.repeat * 1000;
      if (RED.settings.verbose) { this.log(RED._("inject.repeat",this)); }
      this.interval_id = setInterval( function() {
        node.emit("input",{});
      }, this.repeat );
    } else if (this.crontab) {
      if (RED.settings.verbose) { this.log(RED._("inject.crontab",this)); }
    }

    if (this.once) {
      setTimeout( function(){ node.emit("input",{}); }, 100);
    }

    this.on("input",function(msg) {
      var msg = {topic:this.topic};
      if ( (!this.payloadType && !this.payload) || this.payloadType === "date") {
        msg.payload = Date.now();
      } else if (!this.payloadType) {
        msg.payload = this.payload;
      } else {
        msg.payload = RED.util.evaluateNodeProperty(this.payload,this.payloadType,this,msg);
      }
      this.send(msg);
      msg = null;
    });
  }

  RED.nodes.registerType("inject",InjectNode);

  InjectNode.prototype.close = function() {
    if (this.interval_id != null) {
      clearInterval(this.interval_id);
      if (RED.settings.verbose) { this.log(RED._("inject.stopped")); }
    } else if (this.cronjob != null) {
      this.cronjob.stop();
      if (RED.settings.verbose) { this.log(RED._("inject.stopped")); }
      delete this.cronjob;
    }
  }

  RED.events.on("rpc_inject", function(data) {
    var node = RED.nodes.getNode(data.params[0]);
    if (node != null) {
      node.receive();
      data.reply('ok');
    } else {
      data.reply('not ok');
    }
  });

  RED.events.on("rpc_inject_text", function(data) {
    RED.nodes.eachNode(function(n){
      console.log('each node', n);
      if(n.type === 'inject' && n.allowDebugInput){
        n.send({
          topic: n.topic,
          payload: data.params[0]
        });
      }
    });
    data.reply('ok');
  });
}

