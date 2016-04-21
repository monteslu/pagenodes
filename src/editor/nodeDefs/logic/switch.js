module.exports = function(RED){
  RED.nodes.registerType('switch', {
    color: "#FFC400",
    category: 'function',
    defaults: {
      name: {value:""},
      property: {value:"payload", required:true},
      rules: {value:[{t:"eq", v:""}]},
      checkall: {value:"true", required:true},
      outputs: {value:1}
    },
    inputs: 1,
    outputs: 1,
    icon: "switch.png",
    label: function() {
      return this.name||"switch";
    },
    oneditprepare: function() {

      var operators = [
        {v:"eq",t:"=="},
        {v:"neq",t:"!="},
        {v:"lt",t:"<"},
        {v:"lte",t:"<="},
        {v:"gt",t:">"},
        {v:"gte",t:">="},
        {v:"btwn",t:this._("switch.rules.btwn")},
        {v:"cont",t:this._("switch.rules.cont")},
        {v:"regex",t:this._("switch.rules.regex")},
        {v:"true",t:this._("switch.rules.true")},
        {v:"false",t:this._("switch.rules.false")},
        {v:"null",t:this._("switch.rules.null")},
        {v:"nnull",t:this._("switch.rules.nnull")},
        {v:"else",t:this._("switch.rules.else")}
      ];

      var andLabel = this._("switch.and");
      var caseLabel = this._("switch.ignorecase");

      function resizeRule(rule,width) {
        var selectField = rule.find("select");
        var type = selectField.children("option:selected").val();
        var valueField = rule.find(".node-input-rule-value");
        var btwnField1 = rule.find(".node-input-rule-btwn-value");
        var btwnField2 = rule.find(".node-input-rule-btwn-value2");
        var selectWidth;
        if (type.length < 4) {
          selectWidth = 60;
        } else if (type === "regex") {
          selectWidth = 147;
        } else {
          selectWidth = 120;
        }
        selectField.width(selectWidth);

        if (type === "btwn") {
          var labelWidth = rule.find(".node-input-tule-btwn-label").width();
          btwnField1.width((width-256-labelWidth)/2);
          btwnField2.width((width-256-labelWidth)/2);
        } else {
          if (type === "true" || type === "false" || type === "null" || type === "nnull" || type === "else") {
            // valueField.hide();
          } else {
            valueField.width(width-selectWidth-120);
          }
        }
      }

      function generateRule(i,rule) {
        var container = $('<li/>',{style:"background: #fff; margin:0; padding:8px 0px; border-bottom: 1px solid #ccc;"});
        var row = $('<div/>').appendTo(container);
        var row2 = $('<div/>',{style:"padding-top: 5px; padding-left: 175px;"}).appendTo(container);
        $('<i style="color: #eee; cursor: move;" class="node-input-rule-handle fa fa-bars"></i>').appendTo(row);

        var selectField = $('<select/>',{style:"width:120px; margin-left: 5px; text-align: center;"}).appendTo(row);
        for (var d in operators) {
          selectField.append($("<option></option>").val(operators[d].v).text(operators[d].t));
        }

        var valueField = $('<input/>',{class:"node-input-rule-value",type:"text",style:"margin-left: 5px; width: 145px;"}).appendTo(row);
        var btwnField = $('<span/>').appendTo(row);
        var btwnValueField = $('<input/>',{class:"node-input-rule-btwn-value",type:"text",style:"margin-left: 5px; width: 50px;"}).appendTo(btwnField);
        var btwnAndLabel = $('<span/>',{class:"node-input-tule-btwn-label"}).text(" "+andLabel+" ").appendTo(btwnField);
        var btwnValue2Field = $('<input/>',{class:"node-input-rule-btwn-value2",type:"text",style:"width: 50px;margin-left:2px;"}).appendTo(btwnField);

        var finalspan = $('<span/>',{style:"float: right;margin-right: 10px;"}).appendTo(row);
        finalspan.append(' &#8594; <span class="node-input-rule-index">'+i+'</span> ');

        var deleteButton = $('<a/>',{href:"#",class:"editor-button editor-button-small", style:"margin-top: 7px; margin-left: 5px;"}).appendTo(finalspan);
        $('<i/>',{class:"fa fa-remove"}).appendTo(deleteButton);

        var caseSensitive = $('<input/>',{id:"node-input-rule-case-"+i,class:"node-input-rule-case",type:"checkbox",style:"width:auto;vertical-align:top"}).appendTo(row2);
        $('<label/>',{for:"node-input-rule-case-"+i,style:"margin-left: 3px;"}).text(caseLabel).appendTo(row2);
        selectField.change(function() {
          var width = $("#node-input-rule-container").width();
          resizeRule(container,width);
          var type = selectField.children("option:selected").val();

          if (type === "btwn") {
            valueField.hide();
            btwnField.show();
          } else {
            btwnField.hide();
            if (type === "true" || type === "false" || type === "null" || type === "nnull" || type === "else") {
              valueField.hide();
            } else {
              valueField.show();
            }
          }
          if (type === "regex") {
            row2.show();
          } else {
            row2.hide();
          }
        });

        deleteButton.click(function() {
          container.css({"background":"#fee"});
          container.fadeOut(300, function() {
            $(this).remove();
            $("#node-input-rule-container").children().each(function(i) {
              $(this).find(".node-input-rule-index").html(i+1);
            });

          });
        });

        $("#node-input-rule-container").append(container);

        selectField.find("option").filter(function() {return $(this).val() == rule.t;}).attr('selected',true);
        if (rule.t == "btwn") {
          btwnValueField.val(rule.v);
          btwnValue2Field.val(rule.v2);
        } else if (typeof rule.v != "undefined") {
          valueField.val(rule.v);
        }
        if (rule.case) {
          caseSensitive.prop('checked',true);
        } else {
          caseSensitive.prop('checked',false);
        }
        selectField.change();
      }

      $("#node-input-add-rule").click(function() {
        generateRule($("#node-input-rule-container").children().length+1,{t:"",v:"",v2:""});
        $("#node-input-rule-container-div").scrollTop($("#node-input-rule-container-div").get(0).scrollHeight);
      });

      for (var i=0;i<this.rules.length;i++) {
        var rule = this.rules[i];
        generateRule(i+1,rule);
      }

      function switchDialogResize() {
        var rows = $("#dialog-form>div:not(.node-input-rule-container-row)");
        var height = $("#dialog-form").height();
        for (var i=0;i<rows.size();i++) {
          height -= $(rows[i]).outerHeight(true);
        }
        var editorRow = $("#dialog-form>div.node-input-rule-container-row");
        height -= (parseInt(editorRow.css("marginTop"))+parseInt(editorRow.css("marginBottom")));
        $("#node-input-rule-container-div").css("height",height+"px");

        var rules = $("#node-input-rule-container").children();
        var newWidth = $("#node-input-rule-container").width();
        rules.each(function(i) {
          resizeRule($(this),newWidth);
        })
      };

      $( "#node-input-rule-container" ).sortable({
        axis: "y",
        update: function( event, ui ) {
          var rules = $("#node-input-rule-container").children();
          rules.each(function(i) {
            $(this).find(".node-input-rule-index").html(i+1);
          });
        },
        handle:".node-input-rule-handle",
        cursor: "move"
      });
      $( "#node-input-rule-container .node-input-rule-handle" ).disableSelection();

      $( "#dialog" ).on("dialogresize", switchDialogResize);
      $( "#dialog" ).one("dialogopen", function(ev) {
        var size = $( "#dialog" ).dialog('option','sizeCache-switch');
        if (size) {
          $("#dialog").dialog('option','width',size.width);
          $("#dialog").dialog('option','height',size.height);
          switchDialogResize();
        } else {
          setTimeout(switchDialogResize,10);
        }
      });
      $( "#dialog" ).one("dialogclose", function(ev,ui) {
        $( "#dialog" ).off("dialogresize",switchDialogResize);
      });
    },
    oneditsave: function() {
      var rules = $("#node-input-rule-container").children();
      var ruleset;
      var node = this;
      node.rules= [];
      rules.each(function(i) {
        var rule = $(this);
        var type = rule.find("select option:selected").val();
        var r = {t:type};
        if (!(type === "true" || type === "false" || type === "null" || type === "nnull" || type === "else")) {
          if (type === "btwn") {
            r.v = rule.find(".node-input-rule-btwn-value").val();
            r.v2 = rule.find(".node-input-rule-btwn-value2").val();
          } else {
            r.v = rule.find(".node-input-rule-value").val();
          }
          if (type === "regex") {
            r.case = rule.find(".node-input-rule-case").prop("checked");
          }
        }
        node.rules.push(r);
      });
      node.outputs = node.rules.length;
    },
    render: function () {
      return (
        <div>
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
          <div className="form-row">
            <span data-i18n="switch.label.property">
            </span> msg.<input type="text" id="node-input-property" style={{ width: "200px" }}/>
          </div>
          <div
            className="form-row node-input-rule-container-row"
            style={{ marginBottom: "0px" }}>
            <div
              id="node-input-rule-container-div"
              style={{ boxSizing: "border-box", borderRadius: "5px", height: "310px", padding: "5px", border: "1px solid #ccc", overflowY: "scrolls"}}>
              <ol
                id="node-input-rule-container"
                style={{ listStyleType: "none", margin: "0"}}>
              </ol>
            </div>
          </div>
          <div className="form-row">
            <a
              href="#"
              className="editor-button editor-button-small"
              id="node-input-add-rule"
              style={{ marginTop: "4px" }}>
              <i className="fa fa-plus">
              </i>
              <span data-i18n="switch.label.rule">
              </span>
            </a>
          </div>
          <div className="form-row">
            <select
              id="node-input-checkall"
              style={{ width: "100%", marginRight: "5px" }}>
              <option value="true" data-i18n="switch.checkall">
              </option>
              <option
                value="false"
                data-i18n="switch.stopfirst">
              </option>
            </select>
          </div>
        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>
            A simple function node to route messages based on its properties.
          </p>
          <p>
            When a message arrives, the selected property is evaluated against each
            of the defined rules. The message is then sent to the output of <i>all</i>
          rules that pass.
        </p>
        <p>
          Note: the <i>otherwise</i> rule applies as a "not any of" the rules preceding it.
        </p>
      </div>
      )
    }
  });
};
