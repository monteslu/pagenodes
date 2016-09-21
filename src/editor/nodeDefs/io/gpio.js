var _ = require('lodash');

module.exports = function(RED){

  const boardFirwares = {
    "uno": "StandardFirmata.cpp.hex",
    "micro": "StandardFirmata.cpp.hex",
    "imuduino": "StandardFirmata.cpp.hex",
    "leonardo": "StandardFirmata.cpp.hex",
    "blend-micro": "StandardFirmata.cpp.hex",
    "nano": "StandardFirmata.cpp.hex",
    "duemilanove168": "StandardFirmata.cpp.hex",
    "tinyduino": "StandardFirmata.cpp.hex",
    "mega": "StandardFirmata.cpp.hex",
    "sf-pro-micro": "StandardFirmata-5v.cpp.hex",
    "pro-mini": "StandardFirmata-3v.cpp.hex",
    "qduino": "StandardFirmata.cpp.hex",
    "pinoccio": "StandardFirmata.cpp.hex"
  };

  const DEFAULT_SELECTED_EXAMPLE = 'led-blink.js';


  function loadExamples(j5Node){

    var exampleFiles;

    $('#node-config-examples').click(function(){
      console.log('examples button clicked');

      try{

        $("#scriptTextarea").val('');

        RED.comms.rpc('gpio/getExamples', [], function(data){
            if(data.error){
              console.log('error retrieving examples', data.error);
              return;
            }

            console.log('getExamples', data);

            var exampleScriptsSelect = $('#exampleScripts');
            exampleScriptsSelect.find('option').remove();
            exampleFiles = data.entity.files || {};
            _.forEach(exampleFiles, function(file){
              var op = $("<option></option>")
               .attr("value", file.filename)
               .text(file.filename);

               exampleScriptsSelect.append(op);
            });

            exampleScriptsSelect.change(function(a){
              var selectedFile = exampleFiles[exampleScriptsSelect.val()];
              console.log('selected file', selectedFile);
              $("#scriptTextarea").val(selectedFile.content);
            });

            exampleScriptsSelect.val(DEFAULT_SELECTED_EXAMPLE);
            try{
              $("#scriptTextarea").val(exampleFiles[DEFAULT_SELECTED_EXAMPLE].content);
            }catch(exp){}

            launchDialog();
        });

      }catch(ex){
        console.log('error loading j5 examples', ex);
      }

      function launchDialog(){
        var dialog = $( "#examplesListDialog" );
        dialog.dialog({
          modal: true,
          width:'auto',
          buttons: [
          {
            text: "USE SCRIPT",
            click: function() {
              var selectedVal = $("#exampleScripts").val();
              console.log('selectedVal', selectedVal);
              if(selectedVal && exampleFiles[selectedVal] && exampleFiles[selectedVal].content){

                console.log('selected val from dialog', selectedVal);
                j5Node.editor.setValue(exampleFiles[selectedVal].content);
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


  RED.nodes.registerType('gpio in',{
    category: 'robotics',
    defaults: {
      name: {value:""},
      state: {value:"INPUT",required:true},
      samplingInterval: {value:"300",required:false},
      pin: {value:"",required:false},
      board: {type:"nodebot", required:true}
    },
    color:"#f6de1d",
    inputs:0,
    outputs:1,
    faChar: "&#xf22c;", //neuter
    faColor: "black",
    label: function() {
      return this.name||"gpio"+this.pin;
    },
    oneditprepare: function() {

      var self = this;

      function showInterval(){
        $( "#node-div-samplingIntervalRow" ).show();
      }
      function hideInterval(){
        $( "#node-div-samplingIntervalRow" ).hide();
      }

      if(self.state === 'ANALOG'){
        showInterval();
      }
      else{
        hideInterval();
      }

      var intervalInput = $( "#node-input-state" );
      intervalInput.change(function(){
        console.log('intervalInput changed', this.value);
        if(this.value === 'ANALOG'){
          showInterval();
        }
        else{
          hideInterval();
        }
      });
    },
    render: function () {
      return (
        <div>
          <div className="form-row">
            <label htmlFor="node-input-board">
              <i className="fa fa-tasks" /> Board
              </label>
              <input type="text" id="node-input-board" />
            </div>
            <div className="form-row">
              <label htmlFor="node-input-state">
                <i className="fa fa-wrench" /> Type
                </label>
                <select
                  type="text"
                  id="node-input-state"
                  style={{width: 150}}>
                  <option value="INPUT">
                    Digital pin
                  </option>
                  <option value="ANALOG">
                    Analogue pin
                  </option>
                </select>
              </div>
              <div
                className="form-row"
                id="node-div-samplingIntervalRow">
                <label htmlFor="node-input-samplingInterval">
                  <i className="fa fa-circle" /> Sampling Interval
                  </label>
                  <input
                    type="text"
                    id="node-input-samplingInterval"
                    placeholder={300} />
                </div>
                <div className="form-row" id="node-div-pinRow">
                  <label htmlFor="node-input-pin">
                    <i className="fa fa-neuter" /> Pin
                    </label>
                    <input
                      type="text"
                      id="node-input-pin"
                      placeholder={2} />
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
                    <div
                      className="form-tips"
                      id="node-div-formTipRow">
                      <b>Note:</b> You cannot use the same pin for both output and input.
                      </div>
                    </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>gpio input node. A node for receiving data from General Purpose Input and Outputs (GPIOs) pins though the use of johnny-five I/O Plugins</p>
        </div>
      )
    },
    renderDescription: () => <p>GPIO Input Node</p>
  });


  RED.nodes.registerType('gpio out',{
    category: 'robotics',
    defaults: {
      name: {value:""},
      state: {value:"OUTPUT",required:true},
      pin: {value:"",required:false},
      outputs: {value:0},
      board: {type:"nodebot", required:true}
    },
    color:"#f6de1d",
    inputs:1,
    outputs:0,
    faChar: "&#xf22c;", //neuter
    faColor: "black",
    align: "right",
    label: function() {
      console.log('name', "gpio"+(this.pin || this.i2cAddress || ''));
      return this.name||"gpio"+(this.pin || this.i2cAddress || '');
    },
    oneditprepare: function() {

      var self = this;

      var stateInput = $( "#node-input-state" );
      stateInput.change(function(){
        console.log('stateInput changed', this.value);

      });

    },
    oneditsave: function(a) {
      var stateInput = $( "#node-input-state" );
      this.outputs = 0;
      console.log('saving', this, a, stateInput.val());
    },
    render: function () {
      return (
        <div>
          <div>
            <div className="form-row">
              <label htmlFor="node-input-board">
                <i className="fa fa-tasks" /> Board
                </label>
                <input type="text" id="node-input-board" />
              </div>
              <div className="form-row">
                <label htmlFor="node-input-state">
                  <i className="fa fa-wrench" /> Type
                  </label>
                  <select
                    type="text"
                    id="node-input-state"
                    style={{width: 200}}>
                    <option value="OUTPUT">
                      Digital (0/1)
                    </option>
                    <option value="PWM">
                      Analogue (0-255)
                    </option>
                    <option value="SERVO">
                      Servo (0-180)
                    </option>
                  </select>
                </div>
                <div className="form-row" id="node-div-pinRow">
                  <label htmlFor="node-input-pin">
                    <i className="fa fa-neuter" /> Pin
                    </label>
                    <input
                      type="text"
                      id="node-input-pin"
                      placeholder={13} />
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

            <div
              className="form-tips"
              id="node-div-formTipRow"><b>Note:</b> You cannot use the same pin for both output and input.
            </div>
          </div>
        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>gpio output node. A node for sending data to General Purpose Input and Outputs (GPIOs) pins though the use of johnny-five I/O Plugins</p>
        </div>
      )
    },
    renderDescription: () => <p>GPIO Output Node</p>
  });

  RED.nodes.registerType('pixel',{
    category: 'robotics',
    defaults: {
      name: {value:"", required: false},
      pin: {value:"",required:false},
      length: {value:"",required:true},
      controller: {value:"FIRMATA", required:true},
      board: {type:"nodebot", required:true}
    },
    color:"#f6de1d",
    inputs:1,
    outputs:0,
    faChar: "&#xf185;", //sun-o
    faColor: "black",
    align: "right",
    label: function() {
      return this.name||"neopixel";
    },
    render: function () {
      return (
        <div>
          <div>

            <div className="form-row">
              <label htmlFor="node-input-board">
                <i className="fa fa-tasks" /> Board
              </label>
              <input type="text" id="node-input-board" />
            </div>

            <div className="form-row">
              <label htmlFor="node-input-controller">
                <i className="fa fa-wrench" /> Controller
              </label>
              <select type="text" id="node-input-controller">
                <option value="FIRMATA">
                  Firmata
                </option>
                <option value="I2CBACKPACK">
                  I2C Backpack
                </option>
              </select>
            </div>

            <div className="form-row" id="node-div-pinRow">
              <label htmlFor="node-input-pin">
                <i className="fa fa-neuter" /> Pin
              </label>
              <input
                type="text"
                id="node-input-pin"
                placeholder={6} />
            </div>

            <div className="form-row" id="node-div-lengthRow">
              <label htmlFor="node-input-length">
                <i className="fa fa-arrows-h" /> Length
              </label>
              <input
                type="text"
                id="node-input-length"
                placeholder={8} />
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

            <div
              className="form-tips"
              id="node-div-formTipRow"><b>Note:</b> The Pin number is not required when using an I2C backpack.
            </div>

          </div>
        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>Neopixel output node using <a href="https://github.com/ajfisher/node-pixel" target="_blank">node-pixel</a>. </p>
          <p>A msg can be sent to set an entire strip a single color. Example: <code>{`{payload: '#FF0000'})`}</code> OR <code>{`{payload: {strip: '#FF0000'}})`}</code></p>
          <p>You can also use an object to specify a single pixel in the array by id. Example: <code>{`{payload: {color: 'blue', id: 3}})`}</code></p>
          <p>A msg can be sent to shift pixels over. Example shift backwards 2 spaces and wrap: <code>{`{payload: {shift: 2, backward: true, wrap: true}})`}</code></p>
          <p>An array of commands can be supplied and executed in order. Example: <code>{`{payload: [{strip: 'black'},{color: 'red', id:5},{color: '#00f600', id: 0},{shift: 1}})`}</code></p>
        </div>
      )
    },
    renderDescription: () => <p>NeoPixel (node-pixel) Output node.</p>
  });


  RED.nodes.registerType('servo',{
    category: 'robotics',
    defaults: {
      name: {value:"", required: false},
      pin: {value:"", required: true},
      upperRange: {value:"", required: false},
      lowerRange: {value:"", required: false},
      mode: {value:"standard", required:true},
      controller: {value:"", required:false},
      board: {type:"nodebot", required:true}
    },
    color:"#f6de1d",
    inputs:1,
    outputs:0,
    faChar: "&#xf085;", //gears
    faColor: "black",
    align: "right",
    label: function() {
      return this.name||"servo";
    },
    render: function () {
      return (
        <div>
          <div>

            <div className="form-row">
              <label htmlFor="node-input-board">
                <i className="fa fa-tasks" /> Board
              </label>
              <input type="text" id="node-input-board" />
            </div>

            <div className="form-row">
              <label htmlFor="node-input-mode">
                <i className="fa fa-wrench" /> Type
              </label>
              <select type="text" id="node-input-mode">
                <option value="standard">
                  standard
                </option>
                <option value="continuous">
                  continuous
                </option>
              </select>
            </div>

            <div className="form-row" id="node-div-pinRow">
              <label htmlFor="node-input-pin">
                <i className="fa fa-neuter" /> Pin
              </label>
              <input
                type="text"
                id="node-input-pin"
                placeholder={3} />
            </div>

            <div className="form-row">
              <label htmlFor="node-input-controller">
                <i className="fa fa-wrench" /> Controller
              </label>
              <input
                type="text"
                id="node-input-controller"
                placeholder="PCA9685"/>
            </div>


            <div className="form-row">
              <label htmlFor="node-input-lowerRange">
                <i className="fa fa-long-arrow-down" /> Lower Range
              </label>
              <input
                type="text"
                id="node-input-lowerRange"
                placeholder="0" />
            </div>

            <div className="form-row">
              <label htmlFor="node-input-upperRange">
                <i className="fa fa-long-arrow-up" /> Upper Range
              </label>
              <input
                type="text"
                id="node-input-upperRange"
                placeholder="180" />
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
          <p>Servo output node using <a href="http://johnny-five.io/api/servo/" target="_blank">johnny-five Servo</a>. </p>
          <p></p><p></p>
          <p>A <strong>standard</strong> servo can be messaged to sweep back and forth. Example: <code>{`{payload: 'sweep'})`}</code></p>
          <p>Other string payload command values are <code>stop</code>, <code>home</code>, <code>min</code>, <code>max</code>, and <code>center</code> </p>
          <p>You can also set an angle value in the payload. Example: <code>{`{payload: 90})`}</code> OR with timing : <code>{`{payload: 90, duration: 500, steps: 10})`}</code> </p>
          <p></p><p></p>
          <p>A <strong>continuous</strong> servo can be given a speed from 0 to 1. Example: <code>{`{payload: 0.25})`}</code> OR to move counter-clockwise:<code>{`{payload: 0.25, ccw: true})`}</code></p>
        </div>
      )
    },
    renderDescription: () => <p>Servo Output node.</p>
  });



  RED.nodes.registerType('nodebot',{
    category: 'config',
    defaults: {
      name: {value:"", required:false},
      username: {value:"", required:false},
      password: {value:"", required:false},
      boardType: {value:"firmata", required:true},
      serialportName: {value:"", required:false},
      connectionType: {value: "", required:false},
      mqttServer: {value:"", required:false},
      socketServer: {value:"", required:false},
      pubTopic: {value:"", required:false},
      subTopic: {value:"", required:false},
      tcpHost: {value:"", required:false},
      tcpPort: {value:"", required:false},
      sparkId: {value:"", required:false},
      sparkToken: {value:"", required:false},
      beanId: {value:"", required:false},
      impId: {value:"", required:false},
      meshbluServer: {value: "https://meshblu.octoblu.com", required:false},
      uuid: {value: "", required:false},
      token: {value: "", required:false},
      sendUuid: {value: "", required:false}
    },
    label: function() {
      return this.name || this.boardType;
    },
    oneditprepare: function(a) {
      var self = this;

      console.log('startup', self);

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


      var boardRows = ['firmata', 'bean', 'spark', 'imp'];
      var boardToggles = {
        firmata: 'firmata',
        "bean-io": 'bean',
        "spark-io": 'spark',
        "tinker-io": 'spark',
        "imp-io": 'imp'
      };

      function toggleBoardRows(type){
        var boardType = boardToggles[type] || 'other';
        boardRows.forEach(function(row){
          $( "#node-div-" + row + "Row" ).hide();
          if(boardType === row){
            $( "#node-div-" + row + "Row" ).show();
          }
        });
      }

      var firmataRows = ['serial', 'mqtt', 'socketServer', 'username', 'password', 'pub', 'sub', 'tcpHost', 'tcpPort', 'meshbluServer', 'uuid', 'token', 'sendUuid', 'usb', 'plugin', 'firmware'];
      var firmataToggles = {
        local: ['serial', 'plugin', 'firmware'],
        "webusb-serial": ['usb'],
        mqtt: ['mqtt', 'username', 'password', 'pub', 'sub'],
        meshblu: ['meshbluServer', 'uuid', 'token', 'sendUuid'],
        socketio: ['socketServer', 'pub', 'sub'],
        tcp: ['tcpHost', 'tcpPort', 'plugin'],
        udp: ['tcpHost', 'tcpPort', 'plugin']
      };

      function toggleFirmataOptions(type){
        var firmOpts = firmataToggles[type] || [];
        firmataRows.forEach(function(row){
          $( "#node-div-" + row + "Row" ).hide();
          firmOpts.forEach(function(firmOpt){
            if(firmOpt === row){
              $( "#node-div-" + row + "Row" ).show();
            }
          });

        });
      }

      toggleBoardRows(self.boardType);

      try{
        toggleFirmataOptions(self.connectionType);
      }catch(exp){}

      var boardTypeInput = $( "#node-config-input-boardType" );
      boardTypeInput.change(function(){
        // console.log('boardTypeInput changed', this.value);
        toggleBoardRows(this.value);
      });

      var connectionTypeInput = $( "#node-config-input-connectionType" );
      connectionTypeInput.change(function(){
        // console.log('connectionTypeInput changed', this.value);
        try{
          toggleFirmataOptions(this.value);
        }catch(exp){}
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

      $("#writeFirmwareButton").click(function(evt) {
        evt.preventDefault(); //WhyTF is it reloading the page?
        evt.stopPropagation();
        $("#firmwareResults").html("writing...");
        var serialBoardType = $("#serialBoardType").val();
        var serialPortNameForFirmware = $("#node-config-input-serialportName").val();
        console.log('writeFirmware', serialBoardType, serialPortNameForFirmware, boardFirwares[serialBoardType] );
        RED.comms.rpc('gpio/writeFirmware', [serialBoardType, serialPortNameForFirmware, boardFirwares[serialBoardType]], function(result){
          $("#firmwareResults").html(JSON.stringify(result));
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


      console.log('prepped', self);

    },
    oneditsave: function(a) {
      console.log('saving', this, a);
    },
    render: function () {
      return (
        <div>
          <div className="form-row">
            <label htmlFor="node-config-input-boardType">
              <i className="fa fa-gears" /> Nodebot
              </label>
              <select
                type="text"
                id="node-config-input-boardType"
                style={{width: 200}}>
                <option value="firmata">Arduino/Firmata</option>
                <option value="tinker-io">Particle/Tinker</option>
              </select>
            </div>

            <div
              className="form-row"
              id="node-div-firmataRow">
              <div
                className="form-row"
                id="node-div-connectionTypeRow">
                <label htmlFor="node-config-input-connectionType">
                  <i className="fa fa-wrench" /> Connection
                </label>
                <select
                  type="text"
                  id="node-config-input-connectionType"
                  style={{width: 200}}>
                  <option value="mqtt">MQTT</option>
                  <option value="meshblu">
                    Meshblu (skynet)
                  </option>
                  <option value="webusb-serial">WebUSB Serial</option>
                  <option value="local">Serial Port (plugin)</option>
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

                <div id="node-div-firmwareRow" className="form-row" >
                  <div id="hardwareExtensionFirmwareDiv" className="form-tips">
                    You may optionally write the <a href="https://github.com/firmata/arduino" target="_blank">Firmata</a> sketch to the selected board:<br/><br/>
                    <select id="serialBoardType">
                      <option value="uno">Arduino Uno</option>
                      <option value="micro">Arduino Micro</option>
                      <option value="imuduino">Femtoduino IMUduino</option>
                      <option value="leonardo">Arduino Leonardo</option>
                      <option value="blend-micro">RedBearLab Blend Micro</option>
                      <option value="nano">Arduino Nano</option>
                      <option value="duemilanove168">Arduino Duemilanove (168)</option>
                      <option value="tinyduino">Tinyduino</option>
                      <option value="mega">Arduino Mega</option>
                      <option value="sf-pro-micro">Sparkfun Pro Micro</option>
                      <option value="pro-mini">Arduino Pro Mini</option>
                      <option value="qduino">Qtechknow Qduino</option>
                      <option value="pinoccio">Pinoccio Scout</option>
                    </select>
                    <button id="writeFirmwareButton" style={{margin: '5px'}}><i className="fa fa-upload" /> write</button><br/>
                    <div id="firmwareResults"> </div>
                  </div>
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

                <div
                  className="form-row"
                  id="node-div-tcpHostRow">
                  <label htmlFor="node-config-input-tcpHost">
                    <i className="fa fa-globe" /> Host
                    </label>
                    <input
                      type="text"
                      id="node-config-input-tcpHost" />
                </div>

                <div
                  className="form-row"
                  id="node-div-tcpPortRow">
                  <label htmlFor="node-config-input-tcpPort">
                    <i className="fa fa-random" /> port number
                    </label>
                    <input
                      type="text"
                      id="node-config-input-tcpPort" />
                </div>

                <div className="form-row" id="node-div-mqttRow">
                  <label htmlFor="node-config-input-mqttServer">
                    <i className="fa fa-globe" />
                    MQTT Server
                  </label>
                  <input
                    type="text"
                    id="node-config-input-mqttServer"
                    placeholder="mqtt://my_mqtt_server:1883" />
                </div>

                <div
                  className="form-row"
                  id="node-div-socketServerRow">
                  <label htmlFor="node-config-input-socketServer">
                    <i className="fa fa-globe" />
                    Websocket Server
                  </label>
                  <input
                    type="text"
                    id="node-config-input-socketServer"
                    placeholder="wss://my_socket_server" />
                </div>

                <div
                  className="form-row"
                  id="node-div-meshbluServerRow">
                  <label htmlFor="node-config-input-meshbluServer">
                    <i className="fa fa-globe" />
                    Meshblu Server
                  </label>
                  <input
                    type="text"
                    id="node-config-input-meshbluServer"
                    placeholder="https://meshblu.octoblu.com" />
                </div>

                <div className="form-row" id="node-div-uuidRow">
                  <label htmlFor="node-config-input-uuid"><i className="fa fa-globe" />UUID</label>
                  <input
                    type="text"
                    id="node-config-input-uuid"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                </div>

                <div className="form-row" id="node-div-tokenRow">
                  <label htmlFor="node-config-input-token"><i className="fa fa-globe" />token</label>
                  <input type="text" id="node-config-input-token" />
                </div>

                <div
                  className="form-row"
                  id="node-div-usernameRow">
                  <label htmlFor="node-config-input-username">
                    <i className="fa fa-user" /> username
                    </label>
                    <input
                      type="text"
                      id="node-config-input-username" />
                </div>

                <div
                  className="form-row"
                  id="node-div-passwordRow">
                <label htmlFor="node-config-input-password">
                  <i className="fa fa-lock" /> password
                  </label>
                  <input
                    type="text"
                    id="node-config-input-password" />
                </div>

                <div
                  className="form-row"
                  id="node-div-sendUuidRow">
                  <label htmlFor="node-config-input-sendUuid">
                    <i className="fa fa-globe" />
                    send UUID
                  </label>
                  <input
                    type="text"
                    id="node-config-input-sendUuid"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                </div>

                <div className="form-row" id="node-div-pubRow">
                  <label htmlFor="node-config-input-pubTopic">
                    <i className="fa fa-tag" />
                    Publish Topic
                  </label>
                  <input
                    type="text"
                    id="node-config-input-pubTopic"
                    placeholder="pubTopic" />
                </div>

                <div className="form-row" id="node-div-subRow">
                  <label htmlFor="node-config-input-subTopic">
                    <i className="fa fa-tag" />
                    Subscribe Topic
                  </label>
                  <input
                    type="text"
                    id="node-config-input-subTopic"
                    placeholder="subTopic" />
                </div>

              </div>

              <div className="form-row" id="node-div-sparkRow">
                <div className="form-row">
                  <label htmlFor="node-config-input-sparkId">
                    <i className="fa fa-user" /> Device Id
                    </label>
                    <input
                      type="text"
                      id="node-config-input-sparkId" />
                  </div>

                  <div className="form-row">
                    <label htmlFor="node-config-input-sparkToken">
                      <i className="fa fa-lock" /> Token
                      </label>
                      <input
                        type="text"
                        id="node-config-input-sparkToken" />
                    </div>
                </div>


                    <div className="form-row" id="node-div-impRow">
                      <div className="form-row">
                        <label htmlFor="node-config-input-impId">
                          <i className="fa fa-user" /> Agent Id
                          </label>
                          <input type="text" id="node-config-input-impId" />
                        </div>
                      </div>

                      <div className="form-row" id="node-div-beanRow">
                        <div className="form-row">
                          <label htmlFor="node-config-input-beanId">
                          <i className="fa fa-user" /> UUID (optional)
                          </label>
                          <input
                            type="text"
                            id="node-config-input-beanId" />
                        </div>
                     </div>

                    <div className="form-row">
                      <label htmlFor="node-config-input-name">
                      <i className="fa fa-tag" /> Name
                      </label>
                      <input
                        type="text"
                        id="node-config-input-name"
                        placeholder="Name" />
                    </div>
                </div>
      )
    }
  });


    RED.nodes.registerType('johnny5',{
        color:"#f6de1d",
        category: 'robotics',
        defaults: {
            name: {value:""},
            func: {value:""},
            board: {type:"nodebot", required:true},
            noerr: {value:0,required:true,validate:function(v){ return ((!v) || (v === 0)) ? true : false; }}
        },
        inputs:1,
        outputs:1,
        faChar: "&#xf135;", //rocket
        faColor: "black",
        label: function() {
            return this.name || 'johnny5';
        },
        oneditprepare: function() {
            var that = this;
            $( "#node-input-outputs" ).spinner({
                min:1
            });

            function functionDialogResize() {
                var rows = $("#dialog-form>div:not(.node-text-editor-row)");
                var height = $("#dialog-form").height();
                for (var i=0;i<rows.size();i++) {
                    height -= $(rows[i]).outerHeight(true);
                }
                var editorRow = $("#dialog-form>div.node-text-editor-row");
                height -= (parseInt(editorRow.css("marginTop"), 10)+parseInt(editorRow.css("marginBottom"), 10));
                $(".node-text-editor").css("height",height+"px");
                that.editor.resize();
            }

            $( "#dialog" ).on("dialogresize", functionDialogResize);
            $( "#dialog" ).one("dialogopen", function(ev) {
                var size = $( "#dialog" ).dialog('option','sizeCache-function');
                if (size) {
                    $("#dialog").dialog('option','width',size.width);
                    $("#dialog").dialog('option','height',size.height);
                    functionDialogResize();
                }
            });
            $( "#dialog" ).one("dialogclose", function(ev,ui) {
                var height = $( "#dialog" ).dialog('option','height');
                $( "#dialog" ).off("dialogresize",functionDialogResize);
            });

            this.editor = RED.editor.createEditor({
                id: 'node-input-func-editor',
                mode: 'ace/mode/javascript',
                value: $("#node-input-func").val()
            });

            this.editor.focus();

            loadExamples(this);
        },
        oneditsave: function() {
            var annot = this.editor.getSession().getAnnotations();
            this.noerr = 0;
            $("#node-input-noerr").val(0);
            for (var k=0; k < annot.length; k++) {
                //console.log(annot[k].type,":",annot[k].text, "on line", annot[k].row);
                if (annot[k].type === "error") {
                    $("#node-input-noerr").val(annot.length);
                    this.noerr = annot.length;
                }
            }
            $("#node-input-func").val(this.editor.getValue());
            delete this.editor;
        },
        render: function () {
          return (
            <div>
              <div className="form-row">
                <label htmlFor="node-input-board">
                  <i className="fa fa-tasks" /> Board
                </label>
                <input type="text" id="node-input-board" />
              </div>

              <div className="form-row">
                <label htmlFor="node-input-name">
                  <i className="fa fa-tag" />
                  <span> name</span>
                </label>
                <input type="text" id="node-input-name" style={{width: '40%'}} />
                <a
                  href="#"
                  className="btn"
                  id="node-config-examples"
                  style={{float: 'right'}}>
                  <i className="fa fa-file-o" /> examples
                </a>
              </div>

              <div
                className="form-row"
                style={{marginBottom: 0}}>
                <label htmlFor="node-input-func">
                  <i className="fa fa-wrench" />
                  <span> onReady</span>
                </label>
                <input
                  type="hidden"
                  id="node-input-func" />
                <input type="hidden" id="node-input-noerr" />
              </div>

              <div className="form-row node-text-editor-row">
                <div
                  style={{height: 250}}
                  className="node-text-editor"
                  id="node-input-func-editor" />
              </div>

              <div className="form-tips">
                <span>
                  See the Info tab for help writing johnny-five functions.
                </span>
              </div>

              <div
                id="examplesListDialog"
                title="Code examples"
                className="hide">
                <div className="form-row">
                  <select id="exampleScripts">
                  </select>
                </div>
                <div className="form-row">
                  <textarea id="scriptTextarea" style={{height: '150px', width: '250px'}}></textarea>
                </div>
              </div>

            </div>
          )
        },
        renderHelp: function () {
          return (
            <div>
              <p>
                A function block where you can write code using the amazing <a target="_new" href="http://johnny-five.io">johnny-five</a> robotics library.
              </p>
              <p>
                The function you write is what happens once the specified johnny-five board emits a 'ready' event.
              </p>
              <p>
                Your script executes <strong>ONCE</strong> on deployment, <strong>NOT</strong> each time a message comes.
              </p>
              <strong>
                Using johnny-five components
              </strong>
              <p>
                The "board" and "five" variables are avaiable for use when creating johnny-five component instances such as:
              </p>
              <p>
                <code>var led = new five.Led({`{pin: 13, board: board}`});</code>
              </p>
              <strong>
                Handling inputs and outputs
              </strong>
              <p>
                You handle input and output messages to the node in your code with:
              </p>
              <p>
                <code>{`node.on("input", function(msg){ ... })`}</code><br/>
                  and <br/>
                <code>{`node.send({topic: "myTopic", payload: "myPayload"})`}</code>
              </p>
              <strong>
                Using other modules
              </strong>
              <p>You have a require function available to your scripts to do things such as:
              </p>
              <p>
                <code>
                  var _ = require("lodash");
                </code>
              </p>
              <p />
              <p>Aside from lodash, a few other libraries are available:
              </p>
              <ul>
                <li>
                  <code>node-pixel</code>
                </li>
                <li>
                  <code>oled-js</code>
                </li>
                <li>
                  <code>oled-font-5x7</code>
                </li>
                <li>
                  <code>temporal</code>
                </li>
                <li>
                  <code>tharp</code>
                </li>
                <li>
                  <code>vektor</code>
                </li>
              </ul>
          </div>
          )
        },
        renderDescription: () => <p>GPIO Output Node</p>
    });

};

