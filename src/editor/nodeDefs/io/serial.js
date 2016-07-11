module.exports = function(RED){


  RED.nodes.registerType('serial in',{
    category: 'hardware',
    defaults: {
      name: {value:""},
      connection: {type:"serial-port", required: true}
    },
    color:"BurlyWood",
    inputs:0,
    outputs:1,
    faChar: "&#xf287;", //usb
    label: function() {
      return this.name||this.topic||"serial";
    },
    render: function () {
      return (
        <div>

          <div>
            <div className="form-row">
              <label htmlFor="node-input-connection">
                <i className="fa fa-globe" /> connection
              </label>
              <input type="text" id="node-input-connection" />
            </div>

            <div className="form-row">
              <label htmlFor="node-input-name">
                <i className="fa fa-tag" /> Name
              </label>
              <input
                type="text"
                id="node-input-name"
                placeholder="Name" />
            </div>

          </div>

        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>Connects to a connection and subscribes to the specified topic.</p>
          <p>Outputs a message with the properties:</p>
          <ul>
             <li><code>msg.topic</code></li>
             <li><code>msg.payload</code></li>
          </ul>
          <p><code>msg.payload</code> will be a String, unless it is detected as a binary buffer.</p>
        </div>
      )
    },
    renderDescription: () => <p>serial input node.</p>
  });



RED.nodes.registerType('serial out',{
    category: 'hardware',
    defaults: {
      name: {value:""},
      topic: {value: "", required: false},
      connection: {type:"serial-port", required: true}
    },
    color:"BurlyWood",
    inputs:1,
    outputs:0,
    faChar: "&#xf287;", //usb
    align: "right",
    label: function() {
      return this.name||this.topic||"serial";
    },
    render: function () {
      return (
        <div>

          <div>
            <div className="form-row">
              <label htmlFor="node-input-connection">
                <i className="fa fa-globe" /> connection
              </label>
              <input type="text" id="node-input-connection" />
            </div>

            <div className="form-row">
              <label htmlFor="node-input-name">
                <i className="fa fa-tag" /> Name
              </label>
              <input type="text"
                id="node-input-name"
                placeholder="Name" />
            </div>

          </div>

        </div>

      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>Connects to a serial connection and publishes messages.</p>
          <p>The topic used can be configured in the node or, if left blank, can be set
             by <code>msg.topic</code>.</p>
          <p>Likewise the QoS and retain values can be configured in the node or, if left
             blank, set by <code>msg.qos</code> and <code>msg.retain</code> respectively.
             By default, messages are published at QoS 0 with the retain flag set to false.</p>
          <p>If <code>msg.payload</code> contains an object it will be converted to JSON
             before being sent.</p>
        </div>
      )
    },
    renderDescription: function () {
      return (
        <p>serial Out</p>
      )
    }
  });







RED.nodes.registerType('serial-port',{
    category: 'config',
    defaults: {
      connectionType: {value:"webusb",required:true},
      serialportName: {value:"",required:false},
      baud: {value:"57600",required:false},
      password: {value:"",required:false}
    },
    label: function() {
      return this.name || this.server || 'serial connection';
    },
    oneditprepare: function(a) {



      $('#needHardwareExtensionDiv').hide();
      $('#hardwareExtensionOkDiv').hide();
      $('#hardwareExtensionFirmwareDiv').hide();

      RED.comms.rpc('pluginActive', [], function(result){
        if(result.status){
          $('#hardwareExtensionOkDiv').show();
          $('#hardwareExtensionFirmwareDiv').show();
        }
        else{
          $('#needHardwareExtensionDiv').show();
        }
      });



      try {
        $("#node-config-input-serialportName").autocomplete( "destroy" );
      } catch(err) { }
      $("#node-config-lookup-serial").click(function() {
          $("#node-config-lookup-serial-icon").removeClass('fa-search');
          $("#node-config-lookup-serial-icon").addClass('spinner');
          $("#node-config-lookup-serial").addClass('disabled');

          RED.comms.rpc('gpio/listSerial', [], function(data){
              if(data.error){
                console.log('error searching', data.error);
                return;
              }

              $("#node-config-lookup-serial-icon").addClass('fa-search');
              $("#node-config-lookup-serial-icon").removeClass('spinner');
              $("#node-config-lookup-serial").removeClass('disabled');
              var ports = [];
              $.each(data, function(i, port){
                  ports.push(port);
              });
              $("#node-config-input-serialportName").autocomplete({
                  source:ports,
                  minLength:0,
                  close: function( event, ui ) {
                      $("#node-config-input-serialportName").autocomplete( "destroy" );
                  }
              }).autocomplete("search","");
          });

      });

      var usbOutput = $("#node-config-lookup-usb-output");
      //web usb handling
      if(navigator.usb){
        navigator.usb.getDevices().then(function(devices){
          usbOutput.html('Authorized Devices: ' + devices.length);
        })
        .catch(function(err){
          usbOutput.html(err);
        });

        $("#node-config-lookup-usb").click(function() {
          var DEFAULT_FILTERS = [
            { 'vendorId': 0x2341, 'productId': 0x8036 },
            { 'vendorId': 0x2341, 'productId': 0x8037 },
            { 'vendorId': 0x239a, 'productId': 0x8011 }
          ];

          navigator.usb.requestDevice({filters: DEFAULT_FILTERS })
          .then(function(device){
            console.log('authorized device', device);
            navigator.usb.getDevices().then(function(devices){
              usbOutput.html('Authorized Devices: ' + devices.length);
            })
            .catch(function(err){
              usbOutput.html(err);
            });
          })
          .catch(function(err){
            usbOutput.html(err);
          });

        });

      }else{
        usbOutput.html('Web USB API not enabled in this browser');
      }



      var typeOptions = ['usb', 'productId', 'vendorId', 'serial', 'plugin', 'baud', 'host', 'port']
      var typeToggles = {
        webusb: ['usb', 'productId', 'vendorId'],
        serial: ['serial', 'plugin', 'baud'],
        tcp: ['tpcHost', 'tcpPort', 'plugin']
      };

      function toggleOptions(type){
        var rows = typeToggles[type] || [];
        typeOptions.forEach(function(row){
          $( "#node-div-" + row + "Row" ).hide();
          rows.forEach(function(typeOpt){
            if(typeOpt === row){
              $( "#node-div-" + row + "Row" ).show();
            }
          });

        });
      }

      toggleOptions(self.connectionType);


      var connectionTypeInput = $( "#node-config-input-connectionType" );
      connectionTypeInput.change(function(){
        console.log('connectionTypeInput changed', this.value);
        try{
          toggleOptions(this.value);
        }catch(exp){}
      });



    },
    render: function(){
      return(
      <div>

        <div className="form-row" id="node-div-connectionTypeRow">
          <label htmlFor="node-config-input-connectionType">
            <i className="fa fa-wrench" /> Connection
          </label>
          <select id="node-config-input-connectionType">
            <option value="webusb">WebUSB Serial</option>
            <option value="serial">Serial Port (plugin)</option>
            <option value="tcp">TCP (plugin)</option>
          </select>
        </div>

        <div className="form-row" id="node-div-pluginRow">
          <label>
          </label>
          <div id="needHardwareExtensionDiv" className="form-tips">
            This option requires you to have the <a href="https://chrome.google.com/webstore/detail/hardware-extension-for-pa/knmappkjdfbfdomfnbfhchnaamokjdpj" target="_blank"><span className="hardwareExtension">Chrome Hardware Extension</span></a> installed.
          </div>
          <div id="hardwareExtensionOkDiv" className="form-tips">
            Hardware Extension is active <i className="fa fa-thumbs-up" />
          </div>
        </div>

        <div className="form-row" id="node-div-serialRow">
          <label htmlFor="node-config-input-serialportName">
          <i className="fa fa-random" /> Port
          </label>
          <input
            type="text"
            id="node-config-input-serialportName"
            style={{width: '60%'}}
            placeholder="e.g. /dev/ttyUSB0  COM1" />
          <a id="node-config-lookup-serial" className="btn">
            <i
              id="node-config-lookup-serial-icon"
              className="fa fa-search" />
          </a><br/>

        </div>

        <div className="form-row" id="node-div-baudRow">
          <label htmlFor="node-config-input-baud">
          <i className="fa fa-cog" /> Baud
          </label>
          <input
            type="text"
            id="node-config-input-baud"
            placeholder="57600" />
        </div>


        <div className="form-row" id="node-div-usbRow">
          <label htmlFor="node-config-input-usbName">
          Authorize USB
          </label>
          <span id="node-config-lookup-usb-output">...</span>
          <a id="node-config-lookup-usb" className="btn">
            <i
              id="node-config-lookup-usb-icon"
              className="fa fa-random" />
          </a>
        </div>

        <div className="form-row" id="node-div-vendorIdRow">
          <label htmlFor="node-config-input-vendorId">
          <i className="fa fa-cog" /> vendorId
          </label>
          <input
            type="text"
            id="node-config-input-vendorId"
            placeholder="0x2341" />
        </div>

        <div className="form-row" id="node-div-productIdRow">
          <label htmlFor="node-config-input-productId">
          <i className="fa fa-cog" /> productId
          </label>
          <input
            type="text"
            id="node-config-input-productId"
            placeholder="0x8036" />
        </div>

        <div
          className="form-row"
          id="node-div-tpcHostRow">
          <label htmlFor="node-config-input-tpcHost">
            <i className="fa fa-globe" /> Host
            </label>
            <input
              type="text"
              id="node-config-input-tpcHost" />
        </div>

        <div
          className="form-row"
          id="node-div-tcpPortRow">
          <label htmlFor="node-config-input-tcpPort">
            <i className="fa fa-cog" /> port number
            </label>
            <input
              type="text"
              id="node-config-input-tcpPort" />
        </div>


        <div className="form-row">
          <label htmlFor="node-input-name">
            <i className="fa fa-tag" /> Name
          </label>
          <input type="text"
            id="node-input-name"
            placeholder="Name" />
        </div>

      </div>
      );
    },
    renderDescription: () => <p>serial connection node</p>
  });

};
