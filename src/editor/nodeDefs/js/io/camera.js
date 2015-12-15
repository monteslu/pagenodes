module.exports = function(RED){
  RED.nodes.registerType('camera',{
        category: 'function',
        color:"rgb(174, 174, 231)",
        defaults: {
            name: {value:""},
        },
        inputs:1,
        outputs:1,
        icon: "white-globe.png",
        label: function() {
            return this.name||'camera';
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        oneditprepare: function() {

        },
        onpaletteadd: function() {
            // startup();
            // var self = this;
            // this.handleDebugMessage = function(t,o) {
            //     console.log('camera message in!', t, o);
            //     if(typeof o.msg === 'string'){
            //         try{
            //             o.msg = JSON.parse(o.msg);
            //         }
            //         catch(err){
            //             console.log('error parsing notification', err);
            //         }
            //     }

            //     // console.log('take a pic!', topic, payload, o.msg);
            //     takepicture(function(image){
            //       console.log('image', image);
            //       o.msg.image = image;
            //       RED.comms.rpc('camera', [o.id, o.msg], function(result){
            //           console.log('cam pic sent', result);
            //       });
            //     });


            // };
            // RED.comms.subscribe("camera",this.handleDebugMessage);


        }
    });
};