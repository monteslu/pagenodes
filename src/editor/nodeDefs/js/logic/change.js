module.exports = function(RED){
  RED.nodes.registerType('change', {
        color: "#E2D96E",
        category: 'function',
        defaults: {
            name: {value:""},
            rules:{value:[{t:"set",p:"payload",to:""}]},
            // legacy
            action: {value:""},
            property: {value:""},
            from: {value:""},
            to: {value:""},
            reg: {value:false}
        },
        inputs: 1,
        outputs: 1,
        icon: "swap.png",
        label: function() {
            if (this.name) {
                return this.name;
            }
            if (!this.rules) {
                if (this.action === "replace") {
                    return this._("change.label.set",{property:"msg."+this.property});
                } else if (this.action === "change") {
                    return this._("change.label.change",{property:"msg."+this.property});
                } else {
                    return this._("change.label.delete",{property:"msg."+this.property});
                }
            } else {
                if (this.rules.length == 1) {
                    if (this.rules[0].t === "set") {
                        return this._("change.label.set",{property:"msg."+this.rules[0].p});
                    } else if (this.rules[0].t === "change") {
                        return this._("change.label.change",{property:"msg."+this.rules[0].p});
                    } else {
                        return this._("change.label.delete",{property:"msg."+this.rules[0].p});
                    }
                } else {
                    return this._("change.label.changeCount",{count:this.rules.length});
                }
            }
        },
        labelStyle: function() {
            return this.name ? "node_label_italic" : "";
        },
        oneditprepare: function() {
            var set = this._("change.action.set");
            var change = this._("change.action.change");
            var del = this._("change.action.delete");
            var to = this._("change.action.to");
            var search = this._("change.action.search");
            var replace = this._("change.action.replace");
            var regex = this._("change.label.regex");
            if (this.reg === null) { $("#node-input-reg").prop('checked', true); }
            $("#node-input-action").change();

            function resizeRule(rule,width) {
                rule.find('input[type="text"]').width(width-220);
            }

            function generateRule(rule) {
                var container = $('<li/>',{style:"background: #fff; margin:0; padding:8px 0px; border-bottom: 1px solid #ccc;"});

                var row1 = $('<div/>').appendTo(container);

                var row2 = $('<div/>',{style:"margin-top:8px;"}).appendTo(container);
                var row3 = $('<div/>',{style:"margin-top:8px;"}).appendTo(container);

                var selectField = $('<select/>',{class:"node-input-rule-type",style:"width: 100px"}).appendTo(row1);
                var selectOptions = [{v:"set",l:set},{v:"change",l:change},{v:"delete",l:del}];
                for (var i=0;i<3;i++) {
                    selectField.append($("<option></option>").val(selectOptions[i].v).text(selectOptions[i].l));
                }

                $('<div/>',{style:"display:inline-block; width: 50px; text-align: right;"}).text("msg.").appendTo(row1);
                var propertyName = $('<input/>',{style:"width: 220px",class:"node-input-rule-property-name",type:"text"}).appendTo(row1);


                var finalspan = $('<span/>',{style:"float: right; margin-right: 10px;"}).appendTo(row1);
                var deleteButton = $('<a/>',{href:"#",class:"editor-button editor-button-small", style:"margin-top: 7px; margin-left: 5px;"}).appendTo(finalspan);
                $('<i/>',{class:"fa fa-remove"}).appendTo(deleteButton);


                $('<div/>',{style:"display: inline-block;text-align:right; width:150px;padding-right: 10px; box-sizing: border-box;"}).text(to).appendTo(row2);
                var propertyValue = $('<input/>',{style:"width: 220px",class:"node-input-rule-property-value",type:"text"}).appendTo(row2);

                var row3_1 = $('<div/>').appendTo(row3);
                $('<div/>',{style:"display: inline-block;text-align:right; width:150px;padding-right: 10px; box-sizing: border-box;"}).text(search).appendTo(row3_1);
                var fromValue = $('<input/>',{style:"width: 220px",class:"node-input-rule-property-search-value",type:"text"}).appendTo(row3_1);

                var row3_2 = $('<div/>',{style:"margin-top:8px;"}).appendTo(row3);
                $('<div/>',{style:"display: inline-block;text-align:right; width:150px;padding-right: 10px; box-sizing: border-box;"}).text(replace).appendTo(row3_2);
                var toValue = $('<input/>',{style:"width: 220px",class:"node-input-rule-property-replace-value",type:"text"}).appendTo(row3_2);

                var row3_3 = $('<div/>',{style:"margin-top:8px;"}).appendTo(row3);
                var id = "node-input-rule-property-regex-"+Math.floor(Math.random()*10000);
                var useRegExp = $('<input/>',{id:id,class:"node-input-rule-property-re",type:"checkbox", style:"margin-left: 150px; margin-right: 10px; display: inline-block; width: auto; vertical-align: top;"}).appendTo(row3_3);
                $('<label/>',{for:id,style:"width: auto;"}).text(regex).appendTo(row3_3);


                selectField.change(function() {
                    var width = $("#node-input-rule-container").width();
                    resizeRule(container,width);
                    var type = $(this).val();
                    if (type == "set") {
                        row2.show();
                        row3.hide();
                    } else if (type == "change") {
                        row2.hide();
                        row3.show();
                    } else if (type == "delete") {
                        row2.hide();
                        row3.hide();
                    }
                });
                deleteButton.click(function() {
                    container.css({"background":"#fee"});
                    container.fadeOut(300, function() {
                        $(this).remove();
                    });
                });

                selectField.find("option").filter(function() {return $(this).val() == rule.t;}).attr('selected',true);
                propertyName.val(rule.p);
                propertyValue.val(rule.to);
                fromValue.val(rule.from);
                toValue.val(rule.to);
                useRegExp.prop('checked', rule.re);
                selectField.change();

                $("#node-input-rule-container").append(container);
            }
            $("#node-input-add-rule").click(function() {
                generateRule({t:"replace",p:"payload"});
            });

            if (!this.rules) {
                var rule = {
                    t:(this.action=="replace"?"set":this.action),
                    p:this.property
                }

                if (rule.t === "set") {
                    rule.to = this.to;
                } else if (rule.t === "change") {
                    rule.from = this.from;
                    rule.to = this.to;
                    rule.re = this.reg;
                }

                delete this.to;
                delete this.from;
                delete this.reg;
                delete this.action;
                delete this.property;

                this.rules = [rule];
            }

            for (var i=0;i<this.rules.length;i++) {
                generateRule(this.rules[i]);
            }

            function changeDialogResize() {
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
            $( "#dialog" ).on("dialogresize", changeDialogResize);
            $( "#dialog" ).one("dialogopen", function(ev) {
                var size = $( "#dialog" ).dialog('option','sizeCache-change');
                if (size) {
                    $("#dialog").dialog('option','width',size.width);
                    $("#dialog").dialog('option','height',size.height);
                    changeDialogResize();
                } else {
                    setTimeout(changeDialogResize,10);
                }
            });
            $( "#dialog" ).one("dialogclose", function(ev,ui) {
                $( "#dialog" ).off("dialogresize",changeDialogResize);
            });
        },
        oneditsave: function() {
            var rules = $("#node-input-rule-container").children();
            var ruleset;
            var node = this;
            node.rules= [];
            rules.each(function(i) {
                var rule = $(this);
                var type = rule.find(".node-input-rule-type option:selected").val();
                var r = {
                    t:type,
                    p:rule.find(".node-input-rule-property-name").val()
                };
                if (type === "set") {
                    r.to = rule.find(".node-input-rule-property-value").val();
                } else if (type === "change") {
                    r.from = rule.find(".node-input-rule-property-search-value").val();
                    r.to = rule.find(".node-input-rule-property-replace-value").val();
                    r.re = rule.find(".node-input-rule-property-re").prop('checked');
                }
                node.rules.push(r);
            });
        }
    });
};