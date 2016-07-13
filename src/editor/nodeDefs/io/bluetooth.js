module.exports = function(RED){


  RED.nodes.registerType('bluetooth in',{
    category: 'hardware',
    defaults: {
      name: {value:""},
      connection: {type:"bluetooth-device", required: true}
    },
    color:"#0000CC",
    inputs:0,
    outputs:1,
    faChar: "&#xf294;", //bluetooth-b
    faColor: "#FFF",
    fontColor: "#FFF",
    label: function() {
      return this.name||this.topic||"bluetooth";
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
          <p>Connects to a webusb, bluetooth, or tcp port.</p>
          <p>Emits binary (Buffer) data recieved on the port.</p>
        </div>
      )
    },
    renderDescription: () => <p>bluetooth input node.</p>
  });



RED.nodes.registerType('bluetooth out',{
    category: 'hardware',
    defaults: {
      name: {value:""},
      topic: {value: "", required: false},
      connection: {type:"bluetooth-device", required: true}
    },
    color:"#0000CC",
    inputs:1,
    outputs:0,
    faChar: "&#xf294;", //bluetooth-b
    faColor: "#FFF",
    fontColor: "#FFF",
    align: "right",
    label: function() {
      return this.name||this.topic||"bluetooth";
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
          <p>Connects to a webusb, bluetooth, or tcp port.</p>
          <p>Writes binary (Buffer) data directly to the port.</p>
        </div>
      )
    },
    renderDescription: function () {
      return (
        <p>bluetooth Out</p>
      )
    }
  });







RED.nodes.registerType('bluetooth-device',{
    category: 'config',
    defaults: {
      connectionType: {value:"webusb",required:true},
      bluetoothportName: {value:"",required:false},
      baud: {value:"57600",required:false},
      password: {value:"",required:false}
    },
    label: function() {
      return this.name || this.server || 'bluetooth connection';
    },
    oneditprepare: function(a) {




      // try {
      //   $("#node-config-input-bluetoothportName").autocomplete( "destroy" );
      // } catch(err) { }
      // $("#node-config-lookup-bluetooth").click(function() {
      //     $("#node-config-lookup-bluetooth-icon").removeClass('fa-search');
      //     $("#node-config-lookup-bluetooth-icon").addClass('spinner');
      //     $("#node-config-lookup-bluetooth").addClass('disabled');

      //     RED.comms.rpc('gpio/listbluetooth', [], function(data){
      //         if(data.error){
      //           console.log('error searching', data.error);
      //           return;
      //         }

      //         $("#node-config-lookup-bluetooth-icon").addClass('fa-search');
      //         $("#node-config-lookup-bluetooth-icon").removeClass('spinner');
      //         $("#node-config-lookup-bluetooth").removeClass('disabled');
      //         var ports = [];
      //         $.each(data, function(i, port){
      //             ports.push(port);
      //         });
      //         $("#node-config-input-bluetoothportName").autocomplete({
      //             source:ports,
      //             minLength:0,
      //             close: function( event, ui ) {
      //                 $("#node-config-input-bluetoothportName").autocomplete( "destroy" );
      //             }
      //         }).autocomplete("search","");
      //     });

      // });

      var usbOutput = $("#node-config-lookup-usb-output");
      //web usb handling
      if(navigator.bluetooth){
        // navigator.bluetooth.getDevices().then(function(devices){
        //   usbOutput.html('Authorized Devices: ' + devices.length);
        // })
        // .catch(function(err){
        //   usbOutput.html(err);
        // });

        // $("#node-config-lookup-usb").click(function() {
        //   var DEFAULT_FILTERS = [
        //     { 'vendorId': 0x2341, 'productId': 0x8036 },
        //     { 'vendorId': 0x2341, 'productId': 0x8037 },
        //     { 'vendorId': 0x239a, 'productId': 0x8011 }
        //   ];

        //   navigator.usb.requestDevice({filters: DEFAULT_FILTERS })
        //   .then(function(device){
        //     console.log('authorized device', device);
        //     navigator.usb.getDevices().then(function(devices){
        //       usbOutput.html('Authorized Devices: ' + devices.length);
        //     })
        //     .catch(function(err){
        //       usbOutput.html(err);
        //     });
        //   })
        //   .catch(function(err){
        //     usbOutput.html(err);
        //   });

        // });

      }else{
        usbOutput.html('Web USB API not enabled in this browser');
      }



      var typeOptions = ['usb', 'productId', 'vendorId', 'bluetooth', 'plugin', 'baud', 'host', 'port']
      var typeToggles = {
        webusb: ['usb', 'productId', 'vendorId'],
        bluetooth: ['bluetooth', 'plugin', 'baud'],
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
            <option value="webusb">WebUSB bluetooth</option>
            <option value="bluetooth">bluetooth Port (plugin)</option>
            <option value="tcp">TCP (plugin)</option>
          </select>
        </div>


        <div className="form-row" id="node-div-bluetoothRow">
          <label htmlFor="node-config-input-bluetoothportName">
          <i className="fa fa-random" /> Port
          </label>
          <input
            type="text"
            id="node-config-input-bluetoothportName"
            style={{width: '60%'}}
            placeholder="e.g. /dev/ttyUSB0  COM1" />
          <a id="node-config-lookup-bluetooth" className="btn">
            <i
              id="node-config-lookup-bluetooth-icon"
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
    renderDescription: () => <p>bluetooth connection node</p>
  });

};
