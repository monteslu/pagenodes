module.exports = function(RED){
  
    meSpeak.loadConfig("vendor/mespeak/mespeak_config.json");
    meSpeak.loadVoice("vendor/mespeak/voices/en/en-us.json");

    RED.nodes.registerType('espeak',{
        category: 'output',
        defaults: {
            name: {value:''},
            variant: {value:''},
            active: {value:true}
        },
        label: function() {
            return this.name || this.variant || 'espeak';
        },
        labelStyle: function() {
            return this.name?'node_label_italic':'';
        },
        color:'#ffb6c1',
        inputs:1,
        outputs:0,
        icon: 'debug.png',
        align: 'right',
        button: {
            toggle: 'active',
            onclick: function() {
                var label = this.name||'espeak';
                var node = this;
                RED.comms.rpc('espeak', [this.id, (this.active?'enable':'disable')], function(result){
                    if (result == 200) {
                        RED.notify(node._('debug.notification.activated',{label:label}),'success');
                    } else if (result == 201) {
                        RED.notify(node._('debug.notification.deactivated',{label:label}),'success');
                    }
                });
            }
        },
        onpaletteadd: function() {
            this.handleDebugMessage = function(t,o) {

                if(typeof o.msg === 'string'){
                    try{
                        o.msg = JSON.parse(o.msg);
                    }
                    catch(err){
                        console.log('error parsing notification', err);
                    }
                }

                var msg = o.msg;
                //do tts

                console.log('espeak', msg);
                meSpeak.speak(String(msg.payload), {
                  amplitude: parseInt(msg.amplitude, 10) || 100,
                  wordgap: parseInt(msg.wordgap, 10) || 0,
                  pitch: parseInt(msg.pitch, 10) || 50,
                  speed: parseInt(msg.speed, 10) || 175,
                  variant: o.variant || ''
                });



            };
            RED.comms.subscribe('espeak',this.handleDebugMessage);


        },
        onpaletteremove: function() {
            RED.comms.unsubscribe('espeak',this.handleDebugMessage);
            // RED.sidebar.removeTab("debug");
            // delete RED._debug;
        }
    });
};
