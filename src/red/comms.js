
const log = require("./log");
const events = require("./events");
const globalEvents = require('../shared/global-events');



function parentPost(message){
    // console.log('server parentPost', typeof message, message);
    // parent.postMessage(JSON.stringify(message), window.location);

    globalEvents.emit('fromBackend', message);
}


function start() {
    console.log('starting server comms');

    globalEvents.on('fromUI', function(data){
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


function publish(topic,data) {
    parentPost({
        topic: topic,
        data: data,
        type: 'commsMessage'
    });
}

function publishReady(){
    console.log('publishing server ready');
    parentPost({
        type: 'serverReady'
    });
}

function publishNodeDefsLoaded(){
    console.log('publishing node defs loaded');
    parentPost({
        type: 'nodeDefsLoaded'
    });
}

module.exports = {
    start,
    stop,
    publish,
    publishReady,
    publishNodeDefsLoaded
};
