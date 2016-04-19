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
    var _ = require('lodash');

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
            var url = msg.url || nodeUrl;
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

            var method = msg.method || nodeMethod.toUpperCase() || "GET";

            var opts =  {method: method}; //urllib.parse(url);
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


            if(method === 'POST' ||  method === 'PUT'){
                opts.entity = msg.payload;
            }
            opts.params = msg.params;

            console.log('SERVER httprequest', opts, msg);

            var restCall = rest.wrap(errorCodeInterceptor);
            if(typeof opts.entity === 'object'){
                restCall = restCall.wrap(mimeInterceptor, { mime: 'application/json' });
            }else{
                restCall = restCall.wrap(mimeInterceptor);
            }

            opts.path = url;
            restCall(opts).then(function(res) {
                console.log('http response', res);
                node.send(_.assign(msg, {payload: res.entity, status: res.status, headers: res.headers}));
                node.status({});
            })
            .catch(function(err) {
                node.error(err);
                node.status({fill:"red",shape:"ring",text:err.code});
            });

        });
    }

    HTTPRequest.groupName = 'httpin';

    RED.nodes.registerType("http request",HTTPRequest);
}
