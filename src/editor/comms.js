const globalEvents = require('../shared/global-events');

module.exports = function(RED){

var subscriptions = {};
var rpcId = 0;

var CHILD_FRAME_LOCATION = window.location;
var rpcCallbacks = {};


console.log('starting client comms');


globalEvents.on('fromBackend', function(data){
    // console.log('message received on client', data);
    if(data.type === 'rpc' && data.id && rpcCallbacks[data.id]){
        rpcCallbacks[data.id](data.result);
        delete rpcCallbacks[data.id];
    }
    else if(data.type === 'serverReady'){
        RED.events.emit('serverReady', 'ok');
    }
    else if(data.type === 'nodeDefsLoaded'){
        RED.events.emit('nodeDefsLoaded', 'ok');
    }
    else if(data.type === 'commsMessage'){
        RED.events.emit('commsMessage', data);
    }
}, false);

function connect() {

    RED.events.on('commsMessage', function(msg){
        // var msg = JSON.parse(event.data);
        if (msg.topic) {
            for (var t in subscriptions) {
                if (subscriptions.hasOwnProperty(t)) {
                    var re = new RegExp("^"+t.replace(/([\[\]\?\(\)\\\\$\^\*\.|])/g,"\\$1").replace(/\+/g,"[^/]+").replace(/\/#$/,"(\/.*)?")+"$");
                    if (re.test(msg.topic)) {
                        var subscribers = subscriptions[t];
                        if (subscribers) {
                            for (var i=0;i<subscribers.length;i++) {
                                subscribers[i](msg.topic,msg.data);
                            }
                        }
                    }
                }
            }
        }
    });

}

function subscribe(topic,callback) {
    if (subscriptions[topic] == null) {
        subscriptions[topic] = [];
    }
    subscriptions[topic].push(callback);
}

function unsubscribe(topic,callback) {
    if (subscriptions[topic]) {
        for (var i=0;i<subscriptions[topic].length;i++) {
            if (subscriptions[topic][i] === callback) {
                subscriptions[topic].splice(i,1);
                break;
            }
        }
        if (subscriptions[topic].length === 0) {
            delete subscriptions[topic];
        }
    }
}


function rpc(name, params, callback){
    var message = {
        type: 'rpc',
        params: params,
        name: name
    };
    if(callback){
        rpcId++;
        rpcCallbacks[rpcId] = callback;
        message.id = rpcId;
        //TODO handle timeouts?
    }

    RED.comms.postMessage(message);
}

function postMessage(message){
    globalEvents.emit('fromUI', message);
}


RED.comms = {
        connect: connect,
        subscribe: subscribe,
        unsubscribe:unsubscribe,
        rpc: rpc,
        postMessage: postMessage
    };

};
