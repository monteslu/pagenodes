module.exports = function(RED){

  console.log('registering meshblu nodes');

  function meshbluShortenName(input, length, defaultName){
    input = input || defaultName;
    if(input && input.length > length){
      return input.substring(0, length);
    }
    return input;
  }

  function meshbluFormatDevice(device){
    var text = '';
    if(device){
      text+= device.uuid;
      text+= ' -' + (device.name || 'NO_NAME');
      text+= ' -' + (device.type || 'NO_TYPE');
      text+= ' -' + device.owner;
    }
    return text;
  }

  function meshbluDeviceSearch(mesbhluNode){

      $('#node-input-lookup-uuid').click(function(){

        try{
          var serverId = $( "#node-input-server" ).val() || mesbhluNode.server;
          var server;
          if(serverId && serverId.length > 5){
            $('#node-input-lookup-uuid-icon').attr('class', 'icon icon-time');
            RED.nodes.eachConfig(function(n){
              console.log(n.id, serverId);
              if(n.id === serverId){
                console.log('found', n);
                server = n;
              }
            });
            RED.comms.rpc('meshblu/getDevices', [{
                server: server.server,
                port: server.port,
                uuid: server.uuid,
                token: server.token
              }], function(data){
                if(data.error){
                  $('#node-input-lookup-uuid-icon').attr('class', 'icon icon-warning-sign');
                  console.log('error searching', err);
                  return;
                }

                console.log('getDevices', data);

                $('#node-input-lookup-uuid-icon').attr('class', 'icon icon-search');

                var deviceMap = {};
                var deviceList = $('#uuidDevices');
                $('#serverName').html(meshbluShortenName(server.uuid, 18) + '@' + meshbluShortenName(server.server+":"+server.port, 50));
                console.log('getDevices', data);
                deviceList.find('option').remove();
                var devices = data || [];
                for (var i = 0; i < devices.length; i++) {
                  deviceMap[devices[i].uuid] = devices[i];
                  var text = meshbluFormatDevice(devices[i]);
                  var op = $("<option></option>")
                   .attr("value",devices[i].uuid)
                   .text(text);

                  $('#uuidDevices').append(op);
                  console.log('uuidDevices', devices[i].owner);
                }
                deviceList.change(function(a){
                  var selectedDevice = deviceMap[deviceList.val()];
                  if(selectedDevice && selectedDevice.owner === 'UNCLAIMED'){
                    $('#node-input-claim-uuid').show();
                  }
                  else{
                    $('#node-input-claim-uuid').hide();
                  }

                });
                launchDialog();
                $( "#node-input-claim-uuid" ).unbind();
                $('#node-input-claim-uuid').click(function(){
                  var selectedDevice = deviceMap[deviceList.val()];
                  if(selectedDevice){
                    RED.comms.rpc('meshblu/claim', [{
                      server: server.server,
                      port: server.port,
                      uuid: server.uuid,
                      token: server.token,
                      toClaim: selectedDevice.uuid
                    }], function(data){
                      if(data.error){
                        console.log('error claiming', data.error);
                        return;
                      }
                      deviceList.children().each(function(id, option){
                        if(data.uuid === option.value){
                          deviceMap[data.uuid].owner = 'MINE';
                          option.text = meshbluFormatDevice(deviceMap[data.uuid]);
                        }
                      });
                      var text = meshbluFormatDevice(devices[i]);
                    });
                  }
                });

            });
          }
        }catch(ex){
          console.log('error loading uuid devices', ex);
        }

        function launchDialog(){
          var dialog = $( "#uuidListDialog" );
          dialog.dialog({
            modal: true,
            width:'auto',
            buttons: [
            {
              text: "OK",
              click: function() {
                var selectedVal = $("#uuidDevices").val();
                console.log('selectedVal', selectedVal);
                if(selectedVal){
                  $("#node-input-uuid").val(selectedVal);
                }
                $( this ).dialog( "close" );
              }
            },
            {
              text: "CANCEL",
              click: function() {
                $( this ).dialog( "close" );
              }
            }
            ]
          });
        }


      });


  }

  RED.nodes.registerType('meshblu in',{
    category: 'input',
    defaults: {
      name: {value:""},
      directToMe: {value:true},
      uuid: {value: ""},
      server: {type:"meshblu-server", required:true}
    },
    color:"#76be43",
    inputs:0,
    outputs:1,
    icon: "meshblu.png",
    label: function() {
      return this.name||this.topic||"meshblu";
    },
    labelStyle: function() {
      return this.name?"node_label_italic meshbluNode":"meshbluNode";
    },
    oneditprepare: function() {
      var self = this;
      if(self.server){
        RED.nodes.eachConfig(function(n){
          console.log(n.id, self.server);
          if(n.id === self.server){
            console.log('found', n);
            $( "#node-spand-directToMe-uuid" ).html(n.uuid);
          }
        });
      }

      function showDevice(){
        $( "#node-div-deviceRow" ).show();
      }
      function hideDevice(){
        $( "#node-div-deviceRow" ).hide();
      }

      var directToMe = $( "#node-input-directToMe" );
      directToMe.change(function(){
        console.log('directToMe checked', this.checked);
        if(this.checked){
          hideDevice();
        }else{
          showDevice();
        }
      });

      if(this.directToMe){
        directToMe.checked = 'checked';
        hideDevice();
      }
      else{
        directToMe.checked = '';
        showDevice();
      }
      meshbluDeviceSearch(self);
    },
    oneditsave: function(a) {
      var direct = $( "#node-input-directToMe" );
      if(direct.is(':checked') ){
        this.directToMe = true;
      }else{
        this.directToMe = false;
      }
      console.log('saving', this, a);
    }
  });



RED.nodes.registerType('meshblu out',{
    category: 'output',
    defaults: {
      name: {value:""},
      uuid: {value:""},
      broadcast: {value: true},
      forwards: {value:false},
      outputs: {value:0},
      server: {type:"meshblu-server", required:true}
    },
    color:"#76be43",
    inputs:1,
    outputs:0,
    icon: "meshblu.png",
    align: "right",
    label: function() {
      return this.name||this.topic||"meshblu";
    },
    labelStyle: function() {
      return this.name?"node_label_italic meshbluNode":"meshbluNode";
    },
    oneditprepare: function() {

      var self = this;

      var forwardsChbx = $( "#node-input-forwards" );
      if(this.forwards){
        forwardsChbx.checked = 'checked';
      }
      else{
        forwardsChbx.checked = '';
      }

      function showDevice(){
        $( "#node-div-deviceRow" ).show();
        $( "#node-div-outputsRow" ).show();
      }
      function hideDevice(){
        $( "#node-div-deviceRow" ).hide();
        $( "#node-div-outputsRow" ).hide();
      }

      var broadcast = $( "#node-input-broadcast" );
      broadcast.change(function(){
        console.log('broadcast checked', this.checked);
        if(this.checked){
          hideDevice();
        }else{
          showDevice();
        }
      });

      if(this.broadcast){
        broadcast.checked = 'checked';
        hideDevice();
      }
      else{
        broadcast.checked = '';
        showDevice();
      }

      meshbluDeviceSearch(self);
    },
    oneditsave: function(a) {
      var broadcastChbx = $( "#node-input-broadcast" );
      if(broadcastChbx.is(':checked')){
        this.broadcast = true;
      }else{
        this.broadcast = false;
      }
      var forwardsChbx = $( "#node-input-forwards" );
      if(forwardsChbx.is(':checked')){
        console.log('forwards', forwardsChbx.is(':checked'));
        this.outputs = 1;
        this.forwards = true;
      }else{
        console.log('doesnt forward', forwardsChbx.is(':checked'));
        this.outputs = 0;
        this.forwards = false;
      }

      console.log('saving', this, a);
    }
  });

RED.nodes.registerType('meshblu-server',{
    category: 'config',
    defaults: {
      server: {value:"meshblu.octoblu.com",required:true},
      port: {value:443,required:true,validate:RED.validators.number()},
      uuid: {value:"",required:true},
      token: {value:"",required:true}
    },
    label: function() {
      if (this.server == "") { this.server = "none"; }
      return meshbluShortenName(this.uuid, 6) + '@' + meshbluShortenName(this.server+":"+this.port, 25);
    },
    oneditprepare: function(a) {
      var generateButton = $('#node-config-input-generate');

      generateButton.click(function() {
        var messageArea = $('#node-config-input-messageArea');
        messageArea.html('generating...');
        RED.comms.rpc('meshblu/register', [{
            server: $('#node-config-input-server').val(),
            port: $('#node-config-input-port').val()
          }], function(data){
            console.log('data', data);
            if(data.error){
              if(typeof err === 'object'){
                try{
                  err = JSON.stringify(err);
                }catch(ex){}
              }
              messageArea.html('error: ' + err);
              return;
            }
            if(data && data.uuid && data.token){
              $('#node-config-input-uuid').val(data.uuid);
              $('#node-config-input-token').val(data.token);
            }
            messageArea.html('ok');
          });

      });
    }
  });


};
