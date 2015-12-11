module.exports = function(RED){

    function createNotification(msg){
        return new Notification(msg.topic || 'PageNodes', {body: msg.payload || 'notify', icon: msg.image || 'red/images/node-red.png'});
    }

    function notifyMe(msg) {
        console.log('notifyMe', msg);
      // Let's check if the browser supports notifications
      if (!("Notification" in window)) {
        console.error("This browser does not support desktop notification");
      }

      // Let's check whether notification permissions have already been granted
      else if (Notification.permission === "granted") {
        // If it's okay let's create a notification
        createNotification(msg);
      }

      // Otherwise, we need to ask the user for permission
      else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
          // If the user accepts, let's create a notification
          if (permission === "granted") {
            createNotification(msg);
          }
        });
      }

      // At last, if the user has denied notifications, and you
      // want to be respectful there is no need to bother them any more.
    }

    RED.nodes.registerType('notify',{
        category: 'output',
        defaults: {
            name: {value:""},
            active: {value:true}
        },
        label: function() {
            return this.name||"notify";
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        color:"#b7a990",
        inputs:1,
        outputs:0,
        icon: "debug.png",
        align: "right",
        button: {
            toggle: "active",
            onclick: function() {
                var label = this.name||"notify";
                var node = this;
                RED.comms.rpc('notify', [this.id, (this.active?"enable":"disable")], function(result){
                    if (result == 200) {
                        RED.notify(node._("debug.notification.activated",{label:label}),"success");
                    } else if (result == 201) {
                        RED.notify(node._("debug.notification.deactivated",{label:label}),"success");
                    }
                });
            }
        },
        onpaletteadd: function() {
            function sanitize(m) {
                return m.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
            }
            this.handleDebugMessage = function(t,o) {
                if(typeof o.msg === 'string'){
                    try{
                        o.msg = JSON.parse(o.msg);
                    }
                    catch(err){
                        console.log('error parsing notification', err);
                    }
                }
                //console.log(o);
                // var name = sanitize(((o.name?o.name:o.id)||"").toString());
                var topic = sanitize((o.msg.topic||"").toString());
                // var property = sanitize(o.property?o.property:'');
                var payload = sanitize((o.msg.payload||"").toString());
                // var format = sanitize((o.format||"").toString());

                notifyMe({topic: topic, payload: payload, image: o.msg.image});


            };
            RED.comms.subscribe("notification",this.handleDebugMessage);


        },
        onpaletteremove: function() {
            RED.comms.unsubscribe("notify",this.handleDebugMessage);
            // RED.sidebar.removeTab("debug");
            // delete RED._debug;
        }
    });
};
