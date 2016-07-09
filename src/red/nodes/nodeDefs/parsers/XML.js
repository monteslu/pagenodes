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
    var xml2js = require('xml2js');
    var parseString = xml2js.parseString;
    var builder = new xml2js.Builder({renderOpts:{pretty:false}});

    function XMLNode(n) {
        RED.nodes.createNode(this,n);
        this.attrkey = n.attr;
        this.charkey = n.chr;
        var node = this;
        node.propName = n.propName || "payload";
        this.on("input", function(msg) {
          if (msg.hasOwnProperty(node.propName)) {
                if (typeof msg[node.propName] === "object") {
                    var options = {};
                    if (msg.hasOwnProperty("options") && typeof msg.options === "object") { options = msg.options; }
                    options.async = false;
                    msg[node.propName] = builder.buildObject(msg[node.propName], options);
                    node.send(msg);
                }
                else if (typeof msg[node.propName] === "string") {
                    var options = {};
                    if (msg.hasOwnProperty("options") && typeof msg.options === "object") { options = msg.options; }
                    options.async = true;
                    options.attrkey = node.attrkey || options.attrkey || '$';
                    options.charkey = node.charkey || options.charkey || '_';
                    parseString(msg[node.propName], options, function (err, result) {
                        if (err) { node.error(err, msg); }
                        else {
                            msg[node.propName] = result;
                            node.send(msg);
                        }
                    });
                }
                else { node.warn(RED._("xml.errors.xml_js")); }
            }
            else { node.send(msg); } // If no payload - just pass it on.
        });
    }
    RED.nodes.registerType("xml",XMLNode);
}
