
const log = require("./log");
const events = require("./events");



function parentPost(message){
    // console.log('server parentPost', typeof message, message);
    parent.postMessage(JSON.stringify(message), window.location);
}


function start() {
    console.log('starting server comms');
    window.addEventListener("message", function(evt){
        var data = evt.data;

        // console.log('message received on server', data);
        if(typeof data === 'string'){
            try{
                data = JSON.parse(data);
            }
            catch(err){
                console.log('server err parsing comms message', err);
            }
        }
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
    start,
    stop,
    publish,
    publishReady
};
