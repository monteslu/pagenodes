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
    "use strict";
    var ioclient = require("socket.io-client");
    var inspect = require("util").inspect;

    // A node red node that sets up a local websocket server
    function SocketIOListenNode(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);
        var node = this;

        // Store local copies of the node configuration (as defined in the .html)
        node.path = n.path;
        node.wholemsg = (n.wholemsg === "true");

        node._inputNodes = [];    // collection of nodes that want to receive events
        node._clients = {};
        // match absolute url
        node.isServer = false;
        node.closing = false;

        function startconn() {    // Connect to remote endpoint
            var socket = ioclient.connect(node.path, {multiplex: false});
            node.server = socket; // keep for closing
            handleConnection(socket);
        }

        function handleConnection(/*socket*/socket) {

            console.log('socketio handleConnection', socket);

            var id = (1+Math.random()*4294967295).toString(16);
            if (node.isServer) { node._clients[id] = socket; node.emit('opened',Object.keys(node._clients).length); }
            socket.on('connect',function() {
                console.log('socketio-client connect event');
                setTimeout(function(){ //stupid timing problem
                    node.emit('opened','');
                },500);
            });
            socket.on('reconnect',function() {
                console.log('socketio-client reconnect event');
                setTimeout(function(){ //stupid timing problem
                    node.emit('opened','');
                },500);
            });

            socket.on('close',function() {
                node.emit('closed');
                if (!node.closing && !node.isServer) {
                    node.tout = setTimeout(function(){ startconn(); }, 3000); // try to reconnect every 3 secs... bit fast ?
                }
            });
            socket.on('error', function(err) {
                node.emit('erro');
                node.error('error connecting socket.io', err);
                if (!node.closing && !node.isServer) {
                    node.tout = setTimeout(function(){ startconn(); }, 3000); // try to reconnect every 3 secs... bit fast ?
                }
            });
            node.emit('launched','');
        }


        node.closing = false;
        startconn(); // start outbound connection

        node.on("close", function() {
            console.log('socketio-client closing', node);
            node.closing = true;
            node.server.close();
            node.emit('closed','');

        });
    }
    RED.nodes.registerType("socketio-client",SocketIOListenNode);


    SocketIOListenNode.prototype.broadcast = function(data) {
        try {
            if(this.isServer) {
                for (var i = 0; i < this.server.clients.length; i++) {
                    this.server.clients[i].send(data);
                }
            }
            else {
                this.server.send(data);
            }
        }
        catch(e) { // swallow any errors
            this.warn("ws:"+i+" : "+e);
        }
    }

    SocketIOListenNode.prototype.reply = function(id,data) {
        var session = this._clients[id];
        if (session) {
            try {
                session.send(data);
            }
            catch(e) { // swallow any errors
            }
        }
    }

    function SocketIOInNode(n) {
        RED.nodes.createNode(this,n);
        this.server = (n.client)?n.client:n.server;
        var node = this;
        this.serverConfig = RED.nodes.getNode(this.server);
        this.topic = n.topic;
        if (node.serverConfig) {

            node.serverConfig.on('opened', function(n) {
                node.status({fill:"green",shape:"dot",text:"connected "+n});
                node.serverConfig.server.on(node.topic, function(data){
                    if(typeof data === 'object'){
                        data.topic = node.topic;
                        node.send(data);
                    }else{
                        node.send({
                            topic: node.topic,
                            payload: data
                        });
                    }

                });
            });
            node.serverConfig.on('launched', function(n) {

            });

            node.serverConfig.on('erro', function() { node.status({fill:"red",shape:"ring",text:"error"}); });
            node.serverConfig.on('closed', function() { node.status({fill:"red",shape:"ring",text:"disconnected"}); });
        } else {
            this.error(RED._("websocket.errors.missing-conf"));
        }



    }
    RED.nodes.registerType("socketio in",SocketIOInNode);

    function SocketIOOutNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.server = (n.client)?n.client:n.server;
        this.serverConfig = RED.nodes.getNode(this.server);
        console.log('new SocketIOOutNode', n);
        if (!this.serverConfig) {
            this.error(RED._("websocket.errors.missing-conf"));
        }
        else {
            this.serverConfig.on('opened', function(n) { node.status({fill:"green",shape:"dot",text:"connected "+n}); });
            this.serverConfig.on('erro', function() { node.status({fill:"red",shape:"ring",text:"error"}); });
            this.serverConfig.on('closed', function() { node.status({fill:"red",shape:"ring",text:"disconnected"}); });
        }
        this.on("input", function(msg) {
            if(msg.topic && node.serverConfig){
                node.serverConfig.server.emit(msg.topic, msg);
            }
        });
    }
    RED.nodes.registerType("socketio out",SocketIOOutNode);
}
