/**
 * Copyright 2014, 2015 IBM Corp.
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

//var ws = require("ws");
var log = require("./log");
var events = require("./events");

var server;
var settings;

var wsServer;
var pendingConnections = [];
var activeConnections = [];

var retained = {};

var heartbeatTimer;
var lastSentTime;


function init(_server,_settings) {
    server = _server;
    settings = _settings;
}


function parentPost(message){
    parent.postMessage(message, window.location);
}


//function handleRpc(message, function)

function start() {
    console.log('starting server comms');
    window.addEventListener("message", function(evt){
        var data = evt.data;

        console.log('message received on server', data);
        if(data.type === 'rpc'){
            if(data.id){
                data.reply = function(result){
                    parentPost({
                       id: data.id,
                       result: result,
                       type: data.type
                    });
                }
            }

            events.emit(data.type + '_' + data.name, data);
        }
    }, false);

}


function publish(topic,data,retain) {
    parentPost({
        topic: topic,
        data: data,
        type: 'commsMessage'
    });
}

function publishReady(){
    parentPost({
        type: 'serverReady'
    })
}


module.exports = {
    init:init,
    start:start,
    stop:stop,
    publish:publish,
    publishReady:publishReady
}
