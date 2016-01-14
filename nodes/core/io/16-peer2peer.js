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

const P2P_SERVER = 'https://monteslu.iceddev.com';

module.exports = function(RED) {
    "use strict";
    var ioclient = require("socket.io-client");
    var Socketiop2p = require("socket.io-p2p");
    var inspect = require("util").inspect;
    var peerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection ||
                       window.webkitRTCPeerConnection || window.msRTCPeerConnection;


    // A node red node that sets up a local websocket server
    function P2PListenNode(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);
        var node = this;

        // Store local copies of the node configuration (as defined in the .html)
        node.channel = n.channel;
        node.wholemsg = (n.wholemsg === "true");

        node._inputNodes = [];    // collection of nodes that want to receive events
        node._clients = {};
        // match absolute url
        node.isServer = false;
        node.closing = false;

        function startconn() {    // Connect to remote endpoint
            var socket = ioclient.connect(P2P_SERVER, {multiplex: false});
            node.socketio = socket;
            var opts = {peerOpts: {trickle: false}, autoUpgrade: false};
            var p2psocket = new Socketiop2p(socket, opts, function (a) {
                console.log('p2p callback', a);
            });
            node.server = p2psocket; // keep for closing
            handleConnection(p2psocket);
        }

        function handleConnection(/*socket*/socket) {

            console.log('p2p handleConnection', socket);

            var id = (1+Math.random()*4294967295).toString(16);
            if (node.isServer) { node._clients[id] = socket; node.emit('opened',Object.keys(node._clients).length); }
            socket.on('connect',function() {
                console.log('p2p-client connect event');
                node.emit('initalconnect','');
                socket.on('p2pjoined', function(channel){
                    console.log('WebRTC connection established!', channel);
                    socket.useSockets = false;
                    setTimeout(function(){ //stupid timing problem
                        node.emit('opened','');
                    },200);
                });
                socket.emit('joinp2p', node.channel);

            });
            socket.on('reconnect',function() {
                console.log('p2p-client reconnect event');
                setTimeout(function(){ //stupid timing problem
                    node.emit('opened','');
                },200);
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
        if(peerConnection){
            startconn(); // start outbound connection
        }else{
            node.error('peer connection not available');
        }

        node.on("close", function() {
            console.log('p2p-client closing', node);
            node.closing = true;
            if(node.socketio){
               node.socketio.close();
                node.emit('closed','');
            }

        });
    }
    RED.nodes.registerType("p2p-client",P2PListenNode);


    P2PListenNode.prototype.broadcast = function(data) {
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
            this.warn("p2p:"+i+" : "+e);
        }
    }

    P2PListenNode.prototype.reply = function(id,data) {
        var session = this._clients[id];
        if (session) {
            try {
                session.send(data);
            }
            catch(e) { // swallow any errors
            }
        }
    }

    function P2PInNode(n) {
        RED.nodes.createNode(this,n);
        this.server = (n.client)?n.client:n.server;
        var node = this;
        this.serverConfig = RED.nodes.getNode(this.server);
        this.topic = n.topic;
        if (node.serverConfig) {
            node.serverConfig.on('initalconnect', function() { node.status({fill:"yellow",shape:"ring",text:"connecting..."}); });
            node.serverConfig.on('opened', function(n) {
                node.status({fill:"green",shape:"dot",text:"connected "+n});
                node.serverConfig.server.on(node.topic, function(data){
                    console.log('p2p on input', data);
                    try{
                        data = JSON.parse(data);
                        data.topic = node.topic;
                        node.send(data);
                    }catch(err){
                        console.log('p2p error on msg reciev', err);
                        node.error(err);
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
    RED.nodes.registerType("p2p in",P2PInNode);

    function P2pOutNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.server = (n.client)?n.client:n.server;
        this.serverConfig = RED.nodes.getNode(this.server);
        console.log('new P2pOutNode', n);
        if (!this.serverConfig) {
            this.error(RED._("websocket.errors.missing-conf"));
        }
        else {
            node.serverConfig.on('initalconnect', function() { node.status({fill:"yellow",shape:"ring",text:"connecting..."}); });
            this.serverConfig.on('opened', function(n) { node.status({fill:"green",shape:"dot",text:"connected "+n}); });
            this.serverConfig.on('erro', function() { node.status({fill:"red",shape:"ring",text:"error"}); });
            this.serverConfig.on('closed', function() { node.status({fill:"red",shape:"ring",text:"disconnected"}); });
        }
        this.on("input", function(msg) {
            if(msg.topic && node.serverConfig && node.serverConfig.server){
                try{
                    var sendMsg = JSON.stringify(msg);
                    console.log('p2p emit', sendMsg);
                    node.serverConfig.server.emit(msg.topic, sendMsg);
                }catch(err){
                    console.log('p2p emit err', err);
                }

            }
        });
    }
    RED.nodes.registerType("p2p out",P2pOutNode);
}
