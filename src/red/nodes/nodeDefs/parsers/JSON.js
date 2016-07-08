/**
 * Copyright 2014 IBM Corp.
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

    function JSONNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        node.propName = n.propName || 'payload';
        this.on("input", function(msg) {
            if (msg.hasOwnProperty(node.propName)) {
                if (typeof msg[node.propName] === "string") {
                    try {
                        msg[node.propName] = JSON.parse(msg[node.propName]);
                        node.send(msg);
                    }
                    catch(e) { node.error(e.message,msg); }
                }
                else if (typeof msg[node.propName] === "object") {
                    if (!Buffer.isBuffer(msg[node.propName])) {
                        try {
                            msg[node.propName] = JSON.stringify(msg[node.propName]);
                            node.send(msg);
                        }
                        catch(e) {
                            node.error(RED._("json.errors.dropped-error"));
                        }
                    }
                    else { node.warn(RED._("json.errors.dropped-object")); }
                }
                else { node.warn(RED._("json.errors.dropped")); }
            }
            else { node.send(msg); } // If no payload - just pass it on.
        });
    }
    JSONNode.groupName = 'JSON'; //hack!!!
    RED.nodes.registerType("json",JSONNode);
}
