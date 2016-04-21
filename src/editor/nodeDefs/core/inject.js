module.exports = function(RED){
  RED.nodes.registerType('inject',{
    category: 'input',
    color:"#8D6E63",
    textcolor: "white",
    defaults: {
      name: {value:""},
      topic: {value:""},
      payload: {value:""},
      payloadType: {value:"date"},
      repeat: {value:""},
      crontab: {value:""},
      once: {value:false},
      allowDebugInput: {value:false}
    },
    inputs:0,
    outputs:1,
    icon: "inject.png",
    label: function() {
      if (this.payloadType === "string") {
        if ((this.topic !== "") && ((this.topic.length + this.payload.length) <= 32)) {
          return this.name||this.topic + ":" + this.payload;
        }
        else if (this.payload.length < 24) {
          return this.name||this.payload;
        }
      }
      if ((this.topic.length < 24) && (this.topic.length > 0)) {
        return this.name||this.topic;
      }
      else { return this.name||(this.payloadType==="date"?this._("inject.timestamp"):null)||this._("inject.inject"); }
    },
    labelStyle: function() {
      return this.name?"node_label_italic":"";
    },
    oneditprepare: function() {
      $("#inject-time-type-select").change(function() {
        $("#node-input-crontab").val('');
        var id = $("#inject-time-type-select option:selected").val();
        $(".inject-time-row").hide();
        $("#inject-time-row-"+id).show();
        if ((id == "none") || (id == "interval")) {
          $("#node-once").show();
        }
        else {
          $("#node-once").hide();
          $("#node-input-once").prop('checked', false);
        }
      });

      $(".inject-time-times").each(function() {
        for (var i=0;i<24;i++) {
          var l = (i<10?"0":"")+i+":00";
          $(this).append($("<option></option>").val(i).text(l));
        }
      });
      $("<option></option>").val(24).text("00:00").appendTo("#inject-time-interval-time-end");
      $("#inject-time-interval-time-start").change(function() {
        var start = Number($("#inject-time-interval-time-start option:selected").val());
        var end = Number($("#inject-time-interval-time-end option:selected").val());
        $("#inject-time-interval-time-end option").remove();
        for (var i=start+1;i<25;i++) {
          var l = (i<10?"0":"")+i+":00";
          if (i==24) {
            l = "00:00";
          }
          var opt = $("<option></option>").val(i).text(l).appendTo("#inject-time-interval-time-end");
          if (i === end) {
            opt.attr("selected","selected");
          }
        }
      });

      $(".inject-time-count").spinner({
        //max:60,
        min:1
      });

      $("#inject-time-interval-units").change(function() {
        var units = $("#inject-time-interval-units option:selected").val();
      });

      $.widget( "ui.injecttimespinner", $.ui.spinner, {
        options: {
          // seconds
          step: 60 * 1000,
          // hours
          page: 60
        },
        _parse: function( value ) {
          if ( typeof value === "string" ) {
            // already a timestamp
            if ( Number( value ) == value ) {
              return Number( value );
            }
            var p = value.split(":");
            var offset = new Date().getTimezoneOffset();
            return (((Number(p[0])+1)*60)+Number(p[1])+offset)*60*1000;
          }
          return value;
        },
        _format: function( value ) {
          var d = new Date(value);
          var h = d.getHours();
          var m = d.getMinutes();
          return ((h < 10)?"0":"")+h+":"+((m < 10)?"0":"")+m;
        }
      });

      $("#inject-time-time").injecttimespinner();

      var repeattype = "none";
      if (this.repeat != "" && this.repeat != 0) {
        repeattype = "interval";
        var r = "s";
        var c = this.repeat;
        if (this.repeat % 60 === 0) { r = "m"; c = c/60; }
        if (this.repeat % 1440 === 0) { r = "h"; c = c/60; }
        $("#inject-time-interval-count").val(c);
        $("#inject-time-interval-units").val(r);
        $("#inject-time-interval-days").prop("disabled","disabled");
      } else if (this.crontab) {
        var cronparts = this.crontab.split(" ");
        var days = cronparts[4];
        if (!isNaN(cronparts[0]) && !isNaN(cronparts[1])) {
          repeattype = "time";
          // Fixed time
          var time = cronparts[1]+":"+cronparts[0];
          $("#inject-time-time").val(time);
          $("#inject-time-type-select option").filter(function() {return $(this).val() == "s";}).attr('selected',true);
          if (days == "*") {
            $("#inject-time-time-days input[type=checkbox]").prop("checked",true);
          } else {
            $("#inject-time-time-days input[type=checkbox]").removeAttr("checked");
            days.split(",").forEach(function(v) {
              $("#inject-time-time-days [value=" + v + "]").prop("checked", true);
            });
          }
        } else {
          repeattype = "interval-time";
          // interval - time period
          var minutes = cronparts[0].slice(2);
          if (minutes === "") { minutes = "0"; }
          $("#inject-time-interval-time-units").val(minutes);
          if (days == "*") {
            $("#inject-time-interval-time-days input[type=checkbox]").prop("checked",true);
          } else {
            $("#inject-time-interval-time-days input[type=checkbox]").removeAttr("checked");
            days.split(",").forEach(function(v) {
              $("#inject-time-interval-time-days [value=" + v + "]").prop("checked", true);
            });
          }
          var time = cronparts[1];
          var timeparts = time.split(",");
          var start;
          var end;
          if (timeparts.length == 1) {
            // 0 or 0-10
            var hours = timeparts[0].split("-");
            if (hours.length == 1) {
              if (hours[0] === "") {
                start = "0";
                end = "0";
              }
              else {
                start = hours[0];
                end = Number(hours[0])+1;
              }
            } else {
              start = hours[0];
              end = Number(hours[1])+1;
            }
          } else {
            // 23,0 or 17-23,0-10 or 23,0-2 or 17-23,0
            var startparts = timeparts[0].split("-");
            start = startparts[0];

            var endparts = timeparts[1].split("-");
            if (endparts.length == 1) {
              end = Number(endparts[0])+1;
            } else {
              end = Number(endparts[1])+1;
            }
          }
          $("#inject-time-interval-time-end option").filter(function() {return $(this).val() == end;}).attr('selected',true);
          $("#inject-time-interval-time-start option").filter(function() {return $(this).val() == start;}).attr('selected',true);

        }
      } else {
        $("#inject-time-type-select option").filter(function() {return $(this).val() == "none";}).attr('selected',true);
      }

      $(".inject-time-row").hide();
      $("#inject-time-type-select option").filter(function() {return $(this).val() == repeattype;}).attr('selected',true);
      $("#inject-time-row-"+repeattype).show();

      if (this.payloadType == null) {
        if (this.payload == "") {
          this.payloadType = "date";
        } else {
          this.payloadType = "string";
        }
      }

      $("#node-input-payloadType").change(function() {
        var id = $("#node-input-payloadType option:selected").val();
        if (id === "string") {
          $("#node-input-row-payload").show();
        } else {
          $("#node-input-row-payload").hide();
        }
      });
      $("#node-input-payloadType").val(this.payloadType);
      $("#node-input-payloadType").change();
      $("#inject-time-type-select").change();
      $("#inject-time-interval-time-start").change();

    },
    oneditsave: function() {
      var repeat = "";
      var crontab = "";
      var type = $("#inject-time-type-select option:selected").val();
      if (type == "none") {
        // nothing
      } else if (type == "interval") {
        var count = $("#inject-time-interval-count").val();
        var units = $("#inject-time-interval-units option:selected").val();
        if (units == "s") {
          repeat = count;
        } else {
          if (units == "m") {
            //crontab = "*/"+count+" * * * "+days;
repeat = count * 60;
          } else if (units == "h") {
            //crontab = "0 */"+count+" * * "+days;
repeat = count * 60 * 60;
          }
        }
      } else if (type == "interval-time") {
        repeat = "";
        var count = $("#inject-time-interval-time-units").val();
        var startTime = Number($("#inject-time-interval-time-start option:selected").val());
        var endTime = Number($("#inject-time-interval-time-end option:selected").val());
        var days = $('#inject-time-interval-time-days  input[type=checkbox]:checked').map(function(_, el) {
          return $(el).val()
        }).get();
        if (days.length == 0) {
          crontab = "";
        } else {
          if (days.length == 7) {
            days="*";
          } else {
            days = days.join(",");
          }
          var timerange = "";
          if (endTime == 0) {
            timerange = startTime+"-23";
          } else if (startTime+1 < endTime) {
            timerange = startTime+"-"+(endTime-1);
          } else if (startTime+1 == endTime) {
            timerange = startTime;
          } else {
            var startpart = "";
            var endpart = "";
            if (startTime == 23) {
              startpart = "23";
            } else {
              startpart = startTime+"-23";
            }
            if (endTime == 1) {
              endpart = "0";
            } else {
              endpart = "0-"+(endTime-1);
            }
            timerange = startpart+","+endpart;
          }
          if (count === "0") {
            crontab = count+" "+timerange+" * * "+days;
          } else {
            crontab = "*/"+count+" "+timerange+" * * "+days;
          }
        }
      } else if (type == "time") {
        var time = $("#inject-time-time").val();
        var days = $('#inject-time-time-days  input[type=checkbox]:checked').map(function(_, el) {
          return $(el).val()
        }).get();
        if (days.length == 0) {
          crontab = "";
        } else {
          if (days.length == 7) {
            days="*";
          } else {
            days = days.join(",");
          }
          var parts = time.split(":");
          repeat = "";
          crontab = parts[1]+" "+parts[0]+" * * "+days;
        }
      }

      $("#node-input-repeat").val(repeat);
      $("#node-input-crontab").val(crontab);
    },
    button: {
      onclick: function() {
        var label = (this.name||this.payload).replace(/&/g,/&/g,"&amp;").replace(/</g,/</g,"&lt;").replace(/>/g,/>/g,"&gt;");
        if (this.payloadType === "date") { label = this._("inject.timestamp"); }
        if (this.payloadType === "none") { label = this._("inject.blank"); }
        var node = this;
        RED.comms.rpc('inject', [this.id], function(result){
          RED.notify(node._("inject.success",{label:label}),"success");
        });
      }
    },
render: function () {
      return (
        <div>
        <style>
        {`
          .inject-time-row {
          padding-left: 110px;
          }
          .inject-time-row select {
          margin: 3px 0;
          }
          .inject-time-days label {
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          vertical-align: top;
          width: 100px;
          }
          .inject-time-days input {
          width: auto;
          }
          .inject-time-times {
          width: 90px;
          }
          .inject-time-row > .ui-spinner {
          height: 28px;
          margin: 3px 0;
          border-color: rgb(204, 204, 204);
          }
          #inject-time-time {
          margin-top: 3px;
          width: 75px;
          }
          .inject-time-count {
          width: 40px !important;
          }
          `}</style>
        <div className="form-row node-input-payload">
          <label htmlFor="node-input-payloadType">
            <i className="fa fa-envelope">
            </i>
            <span data-i18n="common.label.payload">
            </span>
          </label>
          <select
            id="node-input-payloadType"
            style={{width: "73%"}}>
            <option value="date" data-i18n="inject.timestamp">
            </option>
            <option value="string" data-i18n="inject.string">
            </option>
            <option value="none" data-i18n="inject.blank">
            </option>
          </select>
        </div>

        <div
          className="form-row"
          id="node-input-row-payload">
          <label htmlFor="node-input-payload">
          </label>
          <input
            type="text"
            id="node-input-payload"
            style={{ width: "70%" }} />
        </div>

        <div className="form-row">
          <label htmlFor="node-input-topic">
            <i className="fa fa-tasks">
            </i>
            <span data-i18n="common.label.topic">
            </span>
          </label>
          <input
            type="text"
            id="node-input-topic"
            style={{ width: "70%x" }}/>
        </div>

        <div className="form-row">
          <label htmlFor="">
            <i className="fa fa-repeat">
            </i>
            <span data-i18n="inject.label.repeat">
            </span>
          </label>
          <select
            id="inject-time-type-select"
            style={{ width: "73%" }}>
            <option value="none" data-i18n="inject.none">
            </option>
            <option
              value="interval"
              data-i18n="inject.interval">
            </option>
          </select>
          <input type="hidden" id="node-input-repeat"/>
          <input type="hidden" id="node-input-crontab"/>
        </div>

        <div
          className="form-row inject-time-row hidden"
          id="inject-time-row-interval">
          <span data-i18n="inject.every">
          </span>
          <input
            id="inject-time-interval-count"
            className="inject-time-count"
            value="1">
          </input>
          <select
            style={{ width: "100px" }}
            id="inject-time-interval-units">
            <option value="s" data-i18n="inject.seconds">
            </option>
            <option value="m" data-i18n="inject.minutes">
            </option>
            <option value="h" data-i18n="inject.hours">
            </option>
          </select>
          <br/>
        </div>

        <div className="form-row" id="node-once">
          <label>&nbsp;</label>
          <input
            type="checkbox"
            id="node-input-once"
            style={{ display: "inlineBlock", width: "auto", "verticalAlign": "top" }}/>
          <label
            htmlFor="node-input-once"
            style={{ width: "70%" }}
            data-i18n="inject.onstart">
          </label>
        </div>

        <div
          className="form-row"
          id="node-allowDebugInput">
          <label>&nbsp;</label>
          <input
            type="checkbox"
            id="node-input-allowDebugInput"
            style={{ display: "inlineBlock", width: "auto", "verticalAlign": "top" }}/>
          <label
            htmlFor="node-input-allowDebugInput"
            style={{ width: "70%" }}>
            allow debug panel input
          </label>
        </div>

        <div className="form-row">
          <label htmlFor="node-input-name">
            <i className="fa fa-tag">
            </i>
            <span data-i18n="common.label.name">
            </span>
          </label>
          <input
            type="text"
            id="node-input-name"
            data-i18n="[placeholder]common.label.name"/>
        </div>

        <div
          className="form-tips"
          data-i18n="[html]inject.tip">
        </div>
      </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>
            Pressing the button on the left side of the node allows a message on a topic
            to be injected into the flow. This is mainly for test purposes.
          </p>
          <p>
            The payload defaults to the current time in millisecs since 1970, but can
            also be set to a String or left blank.
          </p>
          <p>
            The repeat function allows the payload to be sent on the required schedule.
          </p>
          <p>
            The <i>Fire once at start</i> option actually waits a short interval before firing
            to give other nodes a chance to instantiate properly.
          </p>
          <p>
            <b>Note: </b>
            "Interval between times" and "at a specific time" uses cron.
            This means that 20 minutes will be at the next hour, 20 minutes past and
            40 minutes past - not in 20 minutes time. If you want every 20 minutes
            from now - use the "interval" option.
          </p>
          <p>
            <b>Note: </b>
            all string input is escaped. To add a carriage return to a string
            you should use a following function.
          </p>
        </div>
      )
    }
  });
};
