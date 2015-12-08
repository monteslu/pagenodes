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
    color:"#f6de1d",
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
    color:"#f6de1d",
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

      var firmataRows = ['serial', 'mqtt', 'socketServer', 'username', 'password', 'pub', 'sub', 'tcpHost', 'tcpPort', 'meshbluServer', 'uuid', 'token', 'sendUuid'];
      var firmataToggles = {
        local: ['serial'],
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

      console.log('prepped', self);

    },
    oneditsave: function(a) {
      console.log('saving', this, a);
    }
  });


    RED.nodes.registerType('johnny5',{
        color:"#f6de1d",
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
        }
    });


};
