/**
 * Copyright 2013,2015 IBM Corp.
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
    var urllib = require("url");
    var mustache = require("mustache");
    var querystring = require("querystring");

    var rest = require("rest");
    var errorCodeInterceptor = require('rest/interceptor/errorCode');
    var mimeInterceptor = require('rest/interceptor/mime');




    function HTTPRequest(n) {
        RED.nodes.createNode(this,n);
        var nodeUrl = n.url;
        var isTemplatedUrl = (nodeUrl||"").indexOf("{{") != -1;
        var nodeMethod = n.method || "GET";
        this.ret = n.ret || "txt";
        var node = this;


        this.on("input",function(msg) {
            console.log('sending http request', msg);
            node.status({fill:"blue",shape:"dot",text:"httpin.status.requesting"});
            var url = nodeUrl || msg.url;
            if (msg.url && nodeUrl && (nodeUrl !== msg.url)) {  // revert change below when warning is finally removed
                node.warn(RED._("common.errors.nooverride"));
            }
            if (isTemplatedUrl) {
                url = mustache.render(nodeUrl,msg);
            }
            if (!url) {
                node.error(RED._("httpin.errors.no-url"),msg);
                return;
            }
            // url must start http:// or https:// so assume http:// if not set
            if (!((url.indexOf("http://") === 0) || (url.indexOf("https://") === 0))) {
                url = "http://"+url;
            }

            var method = nodeMethod.toUpperCase() || "GET";
            if (msg.method && n.method && (n.method !== "use")) {     // warn if override option not set
                node.warn(RED._("common.errors.nooverride"));
            }
            if (msg.method && n.method && (n.method === "use")) {
                method = msg.method.toUpperCase();          // use the msg parameter
            }
            var opts = urllib.parse(url);
            opts.method = method;
            opts.headers = {};
            if (msg.headers) {
                for (var v in msg.headers) {
                    if (msg.headers.hasOwnProperty(v)) {
                        var name = v.toLowerCase();
                        if (name !== "content-type" && name !== "content-length") {
                            // only normalise the known headers used later in this
                            // function. Otherwise leave them alone.
                            name = v;
                        }
                        opts.headers[name] = msg.headers[v];
                    }
                }
            }


            if(method === 'POST'){
                opts.entity = msg.payload;
            }

            var urltotest = url;

            console.log('SERVER httprequest', opts, msg);

            var restCall = rest.chain(errorCodeInterceptor);
            if(typeof opts.entity === 'object'){
                restCall = restCall.chain(mimeInterceptor, { mime: 'application/json' });
            }else{
                restCall = restCall.chain(mimeInterceptor);
            }

            opts.path = opts.href;
            restCall(opts).then(function(res) {
                console.log('http response', res);
                node.send({payload: res.entity, status: res.status, headers: res.headers});
                node.status({});
            })
            .catch(function(err) {
                var payload = err.toString() + " : " + url;
                var statusCode = err.code;
                node.send({payload: payload, statusCode: statusCode});
                node.status({fill:"red",shape:"ring",text:err.code});
            });

        });
    }

    RED.nodes.registerType("http request",HTTPRequest);
}
