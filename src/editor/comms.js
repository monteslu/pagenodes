module.exports = function(RED){


var errornotification = null;
var clearErrorTimer = null;

var subscriptions = {};
var ws;
var pendingAuth = false;
var reconnectAttempts = 0;
var rpcId = 0;

var CHILD_FRAME_LOCATION = window.location;
var rpcCallbacks = {};


console.log('starting client comms');

window.addEventListener("message", function(evt){
    var data = evt.data;
    if(typeof data === 'string'){
        try{
            data = JSON.parse(data);
            // console.log('typeof evt.data', typeof data, data);
        }
        catch(err){
            console.log('client parsing comms message', err);
        }
    }

    // console.log('message received on client', data);
    if(data.type === 'rpc' && data.id && rpcCallbacks[data.id]){
        rpcCallbacks[data.id](data.result);
        delete rpcCallbacks[data.id];
    }
    else if(data.type === 'serverReady'){
        RED.events.emit('serverReady', 'ok');
    }
    else if(data.type === 'commsMessage'){
        RED.events.emit('commsMessage', data);
    }
}, false);

function connectWS() {

    RED.events.on('commsMessage', function(msg){
        // var msg = JSON.parse(event.data);
        if (pendingAuth && msg.auth == "ok") {
            pendingAuth = false;
            completeConnection();
        } else if (msg.topic) {
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
    // if (ws && ws.readyState == 1) {
    //     ws.send(JSON.stringify({subscribe:topic}));
    // }
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
    var serverWindow = document.getElementById('serverFrame').contentWindow;
    serverWindow.postMessage(JSON.stringify(message), CHILD_FRAME_LOCATION);
}


RED.comms = {
        connect: connectWS,
        subscribe: subscribe,
        unsubscribe:unsubscribe,
        rpc: rpc,
        postMessage: postMessage
    };

};
