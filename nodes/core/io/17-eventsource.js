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

    function EventSourceListenNode(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);
        var node = this;

        // Store local copies of the node configuration (as defined in the .html)
        node.path = n.path;
        node._clients = {};
        // match absolute url
        node.isServer = false;
        node.closing = false;
        node.connected = true;






        function startconn() {

            try{
                console.log('starting eventsource', node.path);
                node.eventSource = new EventSource(node.path, {"withCredentials": true});

                node.emit('launched','');

                node.eventSource.addEventListener('error', function(e) {
                    console.log('error connecting to EventSource', e);
                    node.emit('erro', e);
                    node.connected = false;
                });
                node.eventSource.addEventListener('open', function(e) {
                    console.log('onopen connecting to EventSource', e);
                    //node.emit('erro', e);
                    node.connected = true;
                });
                setTimeout(function(){ //stupid timing problem
                    if(node.connected){
                        node.emit('opened','');
                    }
                },500);
                node.eventSource.onmessage = function(e) {
                  console.log('eventSource on message', e);
                  //node.emit('message', e);
                }
            }catch(err){
                console.log('caught error connecting to EventSource', err);
                node.emit('erro', err);
            }





        }


        node.closing = false;
        if(window.EventSource){
            startconn(); // start outbound connection
        }
        else{
            node.error(new Error('EventSource not supported in this browser'));
        }


        node.on("close", function() {
            console.log('eventsource-client closing', node);
            node.closing = true;
            node.emit('closed','');

        });
    }
    RED.nodes.registerType("eventsource-client",EventSourceListenNode);


    function EventSourceInNode(n) {
        RED.nodes.createNode(this,n);
        this.server = (n.client)?n.client:n.server;
        var node = this;
        this.serverConfig = RED.nodes.getNode(this.server);
        this.topic = n.topic;
        if (node.serverConfig) {

            node.serverConfig.on('opened', function(n) {
                node.status({fill:"green",shape:"dot",text:"connected "+n});

                if(node.topic){
                    node.serverConfig.eventSource.addEventListener(node.topic, function(e) {
                      var msg = {
                        topic: node.topic,
                        payload: e.data
                      }
                      node.send(data);
                    });
                }else{
                    node.serverConfig.on('message', function(e){
                        var msg = {
                         topic: 'message',
                         payload: e.data
                        }
                        node.send(data);
                    });
                }


            });

            node.serverConfig.on('erro', function() { node.status({fill:"red",shape:"ring",text:"error"}); });
            node.serverConfig.on('closed', function() { node.status({fill:"red",shape:"ring",text:"disconnected"}); });
        } else {
            this.error(RED._("websocket.errors.missing-conf"));
        }



    }
    RED.nodes.registerType("eventsource",EventSourceInNode);
}
