module.exports = function(RED){

  RED.nodes.registerType('gpio in',{
    category: 'input',
    defaults: {
      name: {value:""},
      state: {value:"INPUT",required:true},
      samplingInterval: {value:"300",required:false},
      pin: {value:"",required:false},
      board: {type:"nodebot", required:true}
    },
    color:"#FFEE58",
    inputs:0,
    outputs:1,
    icon: "gpiowhite.png",
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
                    <i className="fa fa-circle" /> Pin
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
    }
  });


  RED.nodes.registerType('gpio out',{
    category: 'output',
    defaults: {
      name: {value:""},
      state: {value:"OUTPUT",required:true},
      pin: {value:"",required:false},
      i2cDelay: {value:"0",required:false},
      i2cAddress: {value:"",required:false},
      i2cRegister: {value:"",required:false},
      outputs: {value:0},
      board: {type:"nodebot", required:true}
    },
    color:"#FFEE58",
    inputs:1,
    outputs:0,
    icon: "gpiowhite.png",
    align: "right",
    label: function() {
      console.log('name', "gpio"+(this.pin || this.i2cAddress || ''));
      return this.name||"gpio"+(this.pin || this.i2cAddress || '');
    },
    oneditprepare: function() {

      var self = this;

      function showI2C(){
        $( "#node-div-i2cAddressRow" ).show();
        $( "#node-div-i2cRegisterRow" ).show();
        $( "#node-div-i2cDelayRow" ).show();
        $( "#node-div-pinRow" ).hide();
        $( "#node-div-formTipRow" ).hide();
      }
      function hideI2C(){
        $( "#node-div-i2cAddressRow" ).hide();
        $( "#node-div-i2cRegisterRow" ).hide();
        $( "#node-div-i2cDelayRow" ).hide();
        $( "#node-div-pinRow" ).show();
        $( "#node-div-formTipRow" ).show();
      }

      if(self.state === 'I2C_READ_REQUEST' || self.state === 'I2C_WRITE_REQUEST' || self.state === 'I2C_DELAY'){
        showI2C();
      }
      else{
        hideI2C();
      }

      var stateInput = $( "#node-input-state" );
      stateInput.change(function(){
        console.log('stateInput changed', this.value);
        if(this.value === 'I2C_READ_REQUEST' || this.value === 'I2C_WRITE_REQUEST' || this.value === 'I2C_DELAY'){
          showI2C();
        }
        else{
          hideI2C();
        }
      });

    },
    oneditsave: function(a) {
      var stateInput = $( "#node-input-state" );
      if(stateInput.val() === 'I2C_READ_REQUEST'){
        this.outputs = 1;
      }
      else{
        this.outputs = 0;
      }
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
                    <option value="I2C_READ_REQUEST">
                      I2C Read Request
                    </option>
                    <option value="I2C_WRITE_REQUEST">
                      I2C Write Request
                    </option>
                    <option value="I2C_DELAY">
                      I2C Delay
                    </option>
                  </select>
                </div>
                <div className="form-row" id="node-div-pinRow">
                  <label htmlFor="node-input-pin">
                    <i className="fa fa-circle" /> Pin
                    </label>
                    <input
                      type="text"
                      id="node-input-pin"
                      placeholder={13} />
                  </div>
                  <div
                    className="form-row"
                    id="node-div-i2cAddressRow">
                    <label htmlFor="node-input-i2cAddress">
                      <i className="fa fa-circle" /> I2C Address
                      </label>
                      <input
                        type="text"
                        id="node-input-i2cAddress"
                        placeholder={13} />
                    </div>
                    <div
                      className="form-row"
                      id="node-div-i2cRegisterRow">
                      <label htmlFor="node-input-i2cRegister">
                        <i className="fa fa-circle" /> Register (optional)
                        </label>
                        <input type="text" id="node-input-i2cRegister" />
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
    }
  });



  RED.nodes.registerType('nodebot',{
    category: 'config',
    defaults: {
      name: {value:"", required:false},
      username: {value:"", required:false},
      password: {value:"", required:false},
      boardType: {value:"firmata", required:true},
      serialportName: {value:"", required:false},
      connectionType: {value: "local", required:false},
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

      var firmataRows = ['serial', 'mqtt', 'socketServer', 'username', 'password', 'pub', 'sub', 'tcpHost', 'tcpPort', 'meshbluServer', 'uuid', 'token', 'sendUuid', 'usb'];
      var firmataToggles = {
        local: ['serial'],
        "webusb-serial": ['usb'],
        mqtt: ['mqtt', 'username', 'password', 'pub', 'sub'],
        meshblu: ['meshbluServer', 'uuid', 'token', 'sendUuid'],
        socketio: ['socketServer', 'pub', 'sub'],
        tcp: ['tcpHost', 'tcpPort'],
        udp: ['tcpHost', 'tcpPort']
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

          $.getJSON('gpioserialports',function(data) {
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
            { 'vendorId': 0x2341, 'productId': 0x8037 }
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
                  </select>
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
                  </a>
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
                      <i className="fa fa-globe" /> TCP Host
                      </label>
                      <input
                        type="text"
                        id="node-config-input-tcpHost" />
                    </div>
                    <div
                      className="form-row"
                      id="node-div-tcpPortRow">
                      <label htmlFor="node-config-input-tcpPort">
                        <i className="fa fa-random" /> TCP port
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
        color:"#FFEE58",
        category: 'function',
        defaults: {
            name: {value:""},
            func: {value:""},
            board: {type:"nodebot", required:true},
            noerr: {value:0,required:true,validate:function(v){ return ((!v) || (v === 0)) ? true : false; }}
        },
        inputs:1,
        outputs:1,
        icon: "johnny5white.png",
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

            </div>
          )
        },
        renderHelp: function () {
          return (
            <div>

            </div>
          )
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
                    <span>name</span>
                  </label>
                  <input type="text" id="node-input-name" />
                </div>
                <div
                  className="form-row"
                  style={{marginBottom: 0}}>
                  <label htmlFor="node-input-func">
                    <i className="fa fa-wrench" />
                    <span>onReady</span>
                  </label>
                  <input
                    type="hidden"
                    id="node-input-func"
                    autofocus="autofocus" />
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
                {`<code>node.on("input", function(msg)`}{`{ ... })</code> and <code>node.send({topic: "myTopic", payload: "myPayload"})</code>`}
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
        }
    });


};
