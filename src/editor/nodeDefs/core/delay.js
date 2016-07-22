module.exports = function(RED){

  RED.nodes.registerType('delay',{
    category: 'function',      // the palette category
    color:"#E6E0F8",
    defaults: {             // defines the editable properties of the node
      name: {value:""},   //  along with default values.
      pauseType: {value:"delay", required:true},
      timeout: {value:"5", required:true, validate:RED.validators.number()},
      timeoutUnits: {value:"seconds"},
      rate: {value:"1", required:true, validate:RED.validators.number()},
      rateUnits: {value: "second"},
      randomFirst: {value:"1", required:true, validate:RED.validators.number()},
      randomLast: {value:"5", required:true, validate:RED.validators.number()},
      randomUnits: {value: "seconds"},
      drop: {value:false}
    },
    inputs:1,                // set the number of inputs - only 0 or 1
    outputs:1,               // set the number of outputs - 0 to n
    faChar: "&#xf017;",//clock-o
    label: function() {      // sets the default label contents
      if (this.pauseType == "delay") {
        var units = this.timeoutUnits ? this.timeoutUnits.charAt(0) : "s";
        if (this.timeoutUnits == "milliseconds") { units = "ms"; }
        return this.name||this._("delay.label.delay")+" "+this.timeout+" "+units;
      } else if (this.pauseType == "rate") {
        var units = this.rateUnits ? this.rateUnits.charAt(0) : "s";
        return this.name||this._("delay.label.limit")+" "+this.rate+" msg/"+units;
      } else if (this.pauseType == "random") {
        return this.name || this._("delay.label.random");
      }
      else {
        var units = this.rateUnits ? this.rateUnits.charAt(0) : "s";
        return this.name || this._("delay.label.queue")+" "+this.rate+" msg/"+units;
      }
    },
    labelStyle: function() { // sets the class to apply to the label
      return this.name?"node_label_italic":"";
    },
    oneditprepare: function() {
      $( "#node-input-timeout" ).spinner({min:1});
      $( "#node-input-rate" ).spinner({min:1});

      $( "#node-input-randomFirst" ).spinner({min:0});
      $( "#node-input-randomLast" ).spinner({min:1});

      if (this.pauseType == "delay") {
        $("#delay-details").show();
        $("#rate-details").hide();
        $("#random-details").hide();
        $("#node-input-dr").hide();
      } else if (this.pauseType == "rate") {
        $("#delay-details").hide();
        $("#rate-details").show();
        $("#random-details").hide();
        $("#node-input-dr").show();
      } else if (this.pauseType == "random") {
        $("#delay-details").hide();
        $("#rate-details").hide();
        $("#random-details").show();
        $("#node-input-dr").hide();
      } else if (this.pauseType == "queue") {
        $("#delay-details").hide();
        $("#rate-details").show();
        $("#random-details").hide();
        $("#node-input-dr").hide();
      }

      if (!this.timeoutUnits) {
        $("#node-input-timeoutUnits option").filter(function() {
          return $(this).val() == 'seconds';
        }).attr('selected', true);
      }

      if (!this.randomUnits) {
        $("#node-input-randomUnits option").filter(function() {
          return $(this).val() == 'seconds';
        }).attr('selected', true);
      }

      $("#node-input-pauseType").on("change",function() {
        if (this.value == "delay") {
          $("#delay-details").show();
          $("#rate-details").hide();
          $("#random-details").hide();
          $("#node-input-dr").hide();
        } else if (this.value == "rate") {
          $("#delay-details").hide();
          $("#rate-details").show();
          $("#random-details").hide();
          $("#node-input-dr").show();
        } else if (this.value == "random") {
          $("#delay-details").hide();
          $("#rate-details").hide();
          $("#random-details").show();
          $("#node-input-dr").hide();
        } else if (this.value == "queue") {
          $("#delay-details").hide();
          $("#rate-details").show();
          $("#random-details").hide();
          $("#node-input-dr").hide();
        }
      });
    },
    render: function (){
      return (
        <div>
          <div className="form-row">
            <label htmlFor="node-input-pauseType"><i className="fa fa-tasks"></i> <span>Action</span></label>
            <select id="node-input-pauseType" style={{width: '270px !important'}}>
              <option value="delay">delay</option>
              <option value="random">random</option>
              <option value="rate">rate</option>
              <option value="queue">queue</option>
            </select>
          </div>

          <div id="delay-details" className="form-row">
            <label htmlFor="node-input-timeout"><i className="fa fa-clock-o"></i> <span>For</span></label>
            <input type="text" id="node-input-timeout" placeholder="Time" style={{width: '50px !important'}}></input>
            <select id="node-input-timeoutUnits" style={{width: '200px !important'}}>
              <option value="milliseconds">milliseconds</option>
              <option value="seconds">seconds</option>
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
              <option value="days">days</option>
            </select>
          </div>

          <div id="rate-details" className="form-row">
            <label htmlFor="node-input-rate"><i className="fa fa-clock-o"></i> <span>Rate</span></label>
            <input type="text" id="node-input-rate" placeholder="1" style={{width: '30px !important'}}></input>
            <label htmlFor="node-input-rateUnits"><span>msg(s) per</span></label>
            <select id="node-input-rateUnits" style={{width: '140px !important'}}>
              <option value="second">second</option>
              <option value="minute">minute</option>
              <option value="hour">hour</option>
              <option value="day">day</option>
            </select>
            <br/>
            <div id="node-input-dr"><input style={{margin: '20px 0 20px 100px', width: '30px'}} type="checkbox" id="node-input-drop"></input><label style={{width: '250px'}} htmlFor="node-input-drop"><span>drop intermediate messages</span></label></div>
          </div>


          <div id="random-details" className="form-row">
            <label htmlFor="node-input-randomFirst"><i className="fa fa-clock-o"></i> <span>between</span></label>
            <input type="text" id="node-input-randomFirst" placeholder="" style={{width: '30px !important'}}></input>
            <label htmlFor="node-input-randomLast" style={{width: '20px'}}> &amp; </label>
            <input type="text" id="node-input-randomLast" placeholder="" style={{width: '30px !important'}}></input>
            <select id="node-input-randomUnits" style={{width: '140px !important'}}>
              <option value="milliseconds"></option>
              <option value="seconds"></option>
              <option value="minutes"></option>
              <option value="hours"></option>
              <option value="days"></option>
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="node-input-name"><i className="fa fa-tag"></i> <span>Name</span></label>
            <input type="text" id="node-input-name"></input>
          </div>

        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>Introduces a delay into a flow or rate limits messages.</p>
          <p>Default delay is 5 seconds and rate limit of 1 msg/second, but both can be configured.</p>
          <p>If you select a rate limit you may optionally discard any intermediate messages that arrive.</p>
          <p>The "topic based fair queue" adds messages to a release queue tagged by their <code>msg.topic</code> property.
            At each "tick", derived from the rate, the next "topic" is released.
            Any messages arriving on the same topic before release replace those in that position in the queue.
            So each "topic" gets a turn - but the most recent value is always the one sent.</p>
        </div>
      )
    },
    renderDescription: () => <p>Introduces a delay into a flow or rate limits messages.</p>
  });


};

