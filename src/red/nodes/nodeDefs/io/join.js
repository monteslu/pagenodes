module.exports = function(RED) {
  'use strict'
  function JoinNode(n) {
    RED.nodes.createNode(this,n);
    this.mode = n.mode||"auto";
    this.property = n.property||"payload";
    this.propertyType = n.propertyType||"msg";
    if (this.propertyType === 'full') {
      this.property = "payload";
    }
    this.key = n.key||"topic";
    this.timer = (this.mode === "auto") ? 0 : Number(n.timeout || 0)*1000;
    this.timerr = n.timerr || "send";
    this.count = Number(n.count || 0);
    this.joiner = (n.joiner||"").replace(/\\n/g,"\n").replace(/\\r/g,"\r").replace(/\\t/g,"\t").replace(/\\e/g,"\e").replace(/\\f/g,"\f").replace(/\\0/g,"\0");
    this.build = n.build || "array";
    var node = this;
    var inflight = {};

    var completeSend = function(partId) {
      var group = inflight[partId];
      clearTimeout(group.timeout);
      delete inflight[partId];

      if (group.type === 'string') {
        RED.util.setMessageProperty(group.msg,node.property,group.payload.join(group.joinChar));
      } else {
        RED.util.setMessageProperty(group.msg,node.property,group.payload);
      }
      if (group.msg.hasOwnProperty('parts') && group.msg.parts.hasOwnProperty('parts')) {
        group.msg.parts = group.msg.parts.parts;
      } else {
        delete group.msg.parts;
      }
      node.send(group.msg);
    }

    this.on("input", function(msg) {
      try {
        var property;
        if (node.mode === 'auto' && (!msg.hasOwnProperty("parts")||!msg.parts.hasOwnProperty("id"))) {
          node.warn("Message missing msg.parts property - cannot join in 'auto' mode")
          return;
        }
        if (node.propertyType == "full") {
          property = msg;
        } else {
          try {
            property = RED.util.getMessageProperty(msg,node.property);
          } catch(err) {
            node.warn("Message property "+node.property+" not found");
            return;
          }
        }

        var partId;
        var payloadType;
        var propertyKey;
        var targetCount;
        var joinChar;
        var propertyIndex;
        if (node.mode === "auto") {
          // Use msg.parts to identify all of the group information
          partId = msg.parts.id;
          payloadType = msg.parts.type;
          targetCount = msg.parts.count;
          joinChar = msg.parts.ch;
          propertyKey = msg.parts.key;
          propertyIndex = msg.parts.index;
        } else {
          // Use the node configuration to identify all of the group information
          partId = "_";
          payloadType = node.build;
          targetCount = node.count;
          joinChar = node.joiner;
          if (targetCount === 0 && msg.hasOwnProperty('parts')) {
            targetCount = msg.parts.count || 0;
          }
          if (node.build === 'object') {
            propertyKey = RED.util.getMessageProperty(msg,node.key);
          }
        }
        if (payloadType === 'object' && (propertyKey === null || propertyKey === undefined || propertyKey === "")) {
          if (node.mode === "auto") {
            node.warn("Message missing 'msg.parts.key' property - cannot add to object");
          } else {
            node.warn("Message missing key property 'msg."+node.key+"' '- cannot add to object")
          }
          return;
        }
        if (!inflight.hasOwnProperty(partId)) {
          if (payloadType === 'object' || payloadType === 'merged') {
            inflight[partId] = {
              currentCount:0,
              payload:{},
              targetCount:targetCount,
              type:"object",
              msg:msg
            };
          } else {
            inflight[partId] = {
              currentCount:0,
              payload:[],
              targetCount:targetCount,
              type:payloadType,
              joinChar: joinChar,
              msg:msg
            };
            if (payloadType === 'string') {
              inflight[partId].joinChar = joinChar;
            }
          }
          if (node.timer > 0) {
            inflight[partId].timeout = setTimeout(function() {
              completeSend(partId)
            }, node.timer)
          }
        }

        var group = inflight[partId];
        if (payloadType === 'object') {
          group.payload[propertyKey] = property;
          group.currentCount = Object.keys(group.payload).length;
        } else if (payloadType === 'merged') {
          if (Array.isArray(property) || typeof property !== 'object') {
            node.warn("Cannot merge non-object types");
          } else {
            for (propertyKey in property) {
              if (property.hasOwnProperty(propertyKey)) {
                group.payload[propertyKey] = property[propertyKey];
              }
            }
            group.currentCount++;
          }
        } else {
          if (!isNaN(propertyIndex)) {
            group.payload[propertyIndex] = property;
          } else {
            group.payload.push(property);
          }
          group.currentCount++;
        }
        // TODO: currently reuse the last received - add option to pick first received
        group.msg = msg;
        if (group.currentCount === group.targetCount || msg.hasOwnProperty('complete')) {
          delete msg.complete;
          completeSend(partId);
        }
      } catch(err) {
        console.log(err.stack);
      }
    });

    this.on("close", function() {
      for (var i in inflight) {
        if (inflight.hasOwnProperty(i)) {
          clearTimeout(inflight[i].timeout);
        }
      }
    });
  }
  RED.nodes.registerType("join",JoinNode);
}
