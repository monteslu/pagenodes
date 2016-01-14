/**
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    var util = require("util");
    var events = require("events");
    var debuglength = RED.settings.debugMaxLength||1000;
    var useColors = false;

    function NotifyNode(n) {
        RED.nodes.createNode(this,n);
        this.name = n.name;

        this.console = n.console;
        this.active = (n.active === null || typeof n.active === "undefined") || n.active;
        var node = this;

        this.on("input",function(msg) {

            if (this.active) {
                sendNotify({id:this.id,name:this.name,topic:msg.topic,msg:msg});
            }

        });
    }

    RED.nodes.registerType("notify",NotifyNode);

    function sendNotify(msg) {
        RED.comms.publish("notification",msg);
    }


    RED.events.on("rpc_notify", function(data) {
        var node = RED.nodes.getNode(data.params[0]);
        var state = data.params[1];
        if (node !== null && typeof node !== "undefined" ) {
            if (state === "enable") {
                node.active = true;
                data.reply(200);
            } else if (state === "disable") {
                node.active = false;
                data.reply(201);
            } else {
                data.reply(404);
            }
        } else {
            data.reply(404);
        }
    });
};
