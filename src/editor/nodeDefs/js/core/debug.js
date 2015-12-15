module.exports = function(RED){
    RED.nodes.registerType('debug',{
        category: 'output',
        defaults: {
            name: {value:""},
            active: {value:true},
            console: {value:"false"},
            complete: {value:"false", required:true}
        },
        label: function() {
            if (this.complete === true || this.complete === "true") {
                return this.name||"msg";
            } else {
                return this.name || "msg." + ((!this.complete || this.complete === "false") ? "payload" : this.complete);
            }
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        color:"#87a980",
        inputs:1,
        outputs:0,
        icon: "debug.png",
        align: "right",
        button: {
            toggle: "active",
            onclick: function() {
                var label = this.name||"debug";
                var node = this;
                RED.comms.rpc('debug', [this.id, (this.active?"enable":"disable")], function(result){
                    if (result == 200) {
                        RED.notify(node._("debug.notification.activated",{label:label}),"success");
                    } else if (result == 201) {
                        RED.notify(node._("debug.notification.deactivated",{label:label}),"success");
                    }
                });
            }
        },
        onpaletteadd: function() {
            var content = document.createElement("div");
            $(content).css({"position":"relative","height":"100%"});

            var inputbar = document.createElement("div");
            inputbar.id = "input-toolbar";
            content.appendChild(inputbar);

            inputbar.innerHTML = '<div><a id="debug-tab-input-send" title="send" class="button" href="#" style="margin: 5px;"><i class="fa fa-play"></i></a><span id="debug-tab-input-wrapper"><input id="debug-tab-input" type="text" /></span></div> ';

            var toolbar = document.createElement("div");
            toolbar.id = "debug-toolbar";
            content.appendChild(toolbar);

            toolbar.innerHTML = '<div class="pull-left"><a id="debug-tab-clear" title="clear log" class="button" href="#"><i class="fa fa-trash"></i></a></div> ';

            var messages = document.createElement("div");
            messages.id = "debug-content";
            content.appendChild(messages);

            RED.sidebar.addTab({
                id: "debug",
                label: this._("debug.sidebar.label"),
                name: this._("debug.sidebar.name"),
                content: content
            });

            function getTimestamp() {
                var d = new Date();
                return d.toLocaleString();
            }

            var sbc = document.getElementById("debug-content");

            var messageCount = 0;
            var that = this;
            RED._debug = function(msg) {
                that.handleDebugMessage("",{
                    name:"debug",
                    msg:msg
                });
            }
            function sanitize(m) {
                return m.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
            }
            this.handleDebugMessage = function(t,o) {
                var msg = document.createElement("div");
                // console.log('handleDebug', o);
                msg.onmouseover = function() {
                    msg.style.borderRightColor = "#999";
                    var n = RED.nodes.node(o.id);
                    if (n) {
                        n.highlighted = true;
                        n.dirty = true;
                    }
                    RED.view.redraw();
                };
                msg.onmouseout = function() {
                    msg.style.borderRightColor = "";
                    var n = RED.nodes.node(o.id);
                    if (n) {
                        n.highlighted = false;
                        n.dirty = true;
                    }
                    RED.view.redraw();
                };
                msg.onclick = function() {
                    var node = RED.nodes.node(o.id);
                    if (node) {
                        RED.workspaces.show(node.z);
                    }

                };
                //console.log(o);
                var name = sanitize(((o.name?o.name:o.id)||"").toString());
                var topic = sanitize((o.topic||"").toString());
                var property = sanitize(o.property?o.property:'');
                var payload = sanitize((o.msg||"").toString());
                var format = sanitize((o.format||"").toString());

                msg.className = 'debug-message'+(o.level?(' debug-message-level-'+o.level):'');
                msg.innerHTML = '<span class="debug-message-date">'+
                                getTimestamp()+'</span>'+
                                (name?'<span class="debug-message-name">'+name:'')+
                                '</span>';
                // NOTE: relying on function error to have a "type" that all other msgs don't
                if (o.hasOwnProperty("type") && (o.type === "function")) {
                    var errorLvlType = 'error';
                    var errorLvl = 20;
                    if (o.hasOwnProperty("level") && o.level === 30) {
                        errorLvl = 30;
                        errorLvlType = 'warn';
                    }
                    msg.className = 'debug-message debug-message-level-' + errorLvl;
                    msg.innerHTML += '<span class="debug-message-topic">function : (' + errorLvlType + ')</span>';
                } else {
                    msg.innerHTML += '<span class="debug-message-topic">'+
                                    (o.topic?topic+' : ':'')+
                                    (o.property?'msg.'+property:'msg')+" : "+format+

                                    '</span>';
                }
                var imgHTML = '';
                if(o.image){
                    var imgURL = o.image.replace(/\"/g,'').replace(/\'/g,'');
                    imgHTML = '<br><img src=\"' + imgURL + '\" style=\"width: 100%\">';
                }
                msg.innerHTML += '<span class="debug-message-payload">'+ payload+ imgHTML+ '</span>';
                var atBottom = (sbc.scrollHeight-messages.offsetHeight-sbc.scrollTop) < 5;
                messageCount++;
                $(messages).append(msg);

                if (messageCount > 200) {
                    $("#debug-content .debug-message:first").remove();
                    messageCount--;
                }
                if (atBottom) {
                    $(sbc).scrollTop(sbc.scrollHeight);
                }
            };
            RED.comms.subscribe("debug",this.handleDebugMessage);

            $("#debug-tab-clear").click(function() {
                $(".debug-message").remove();
                messageCount = 0;
                RED.nodes.eachNode(function(node) {
                    node.highlighted = false;
                    node.dirty = true;
                });
                RED.view.redraw();
            });

            function sendText(){
                var textToSend = $('#debug-tab-input')[0].value;
                $('#debug-tab-input')[0].value = ''
                console.log($("#debug-tab-input").value);

                RED.comms.rpc('inject_text', [textToSend], function(result){
                    //RED.notify(node._("inject.success",{label:label}),"success");
                    RED.notify(RED._("text inject success", {ok:'ok'}),"success");
                });

            }
            $("#debug-tab-input-send").click(sendText);
            console.log('adding debug input handlers');
            $('#debug-tab-input').keyup(function(e){

                // console.log('event ', e);
                e.stopPropagation();
                e.preventDefault();
                e.returnValue = false;
                e.cancelBubble = true;
                if(e.keyCode == 13){
                    sendText();
                }
                return false;
            });
        },
        onpaletteremove: function() {
            RED.comms.unsubscribe("debug",this.handleDebugMessage);
            RED.sidebar.removeTab("debug");
            delete RED._debug;
        },
        oneditprepare: function(){
        console.log('oneditprepare is running now');
        if (this.complete === "true" || this.complete === true) {
            // show complete message object
            $("#node-input-select-complete").val("true");
            $("#node-prop-row").hide();
        } else {
            // show msg.[   ]
            var property = (!this.complete||(this.complete === "false")) ? "payload" : this.complete+"";
            $("#node-input-select-complete").val("false");
            $("#node-input-complete").val(property);
            $("#node-prop-row").show();
        }
        $("#node-input-select-complete").change(function() {
            var v = $("#node-input-select-complete option:selected").val();
            $("#node-input-complete").val(v);
            if (v !== "true") {
                $("#node-input-complete").val("payload");
                $("#node-prop-row").show();
                $("#node-input-complete").focus();
            } else {
                $("#node-prop-row").hide();
            }
        });

        }
    });
};
