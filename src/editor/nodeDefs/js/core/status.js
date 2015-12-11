module.exports = function(RED){
    RED.nodes.registerType('status',{
        category: 'input',
        color:"#c0edc0",
        defaults: {
            name: {value:""},
            scope: {value:null}
        },
        inputs:0,
        outputs:1,
        icon: "alert.png",
        label: function() {
            return this.name||this.scope?this._("status.statusNodes",{number:this.scope.length}):this._("status.status");
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        oneditprepare: function() {
            var nodeList = $("#node-input-status-target-container");
            var node = this;
            function createNodeList() {
                var scope = node.scope || [];
                nodeList.empty();

                var candidateNodes = RED.nodes.filterNodes({z:node.z});
                var allChecked = true;

                candidateNodes.forEach(function(n) {
                    if (n.id === node.id) {
                        return;
                    }
                    var isChecked = scope.indexOf(n.id) !== -1;

                    allChecked = allChecked && isChecked;

                    var container = $('<li/>',{class:"node-input-target-node"});
                    var row = $('<label/>',{for:"node-input-target-node-"+n.id}).appendTo(container);
                    $('<input>',{type:"checkbox",class:"node-input-target-node-checkbox",id:"node-input-target-node-"+n.id})
                        .data('node-id',n.id)
                        .prop('checked', isChecked)
                        .appendTo(row);
                    container.on('mouseover',function(e) {
                        n.highlighted = true;
                        n.dirty = true;
                        RED.view.redraw();
                    });
                    container.on('mouseout',function(e) {
                        n.highlighted = false;
                        n.dirty = true;
                        RED.view.redraw();
                    });
                    var labelSpan = $('<span>');
                    var nodeDef = RED.nodes.getType(n.type);
                    var label;
                    var sublabel;
                    if (nodeDef) {
                        var l = nodeDef.label;
                        label = (typeof l === "function" ? l.call(n) : l)||"";
                        sublabel = n.type;
                        if (sublabel.indexOf("subflow:") === 0) {
                            var subflowId = sublabel.substring(8);
                            var subflow = RED.nodes.subflow(subflowId);
                            sublabel = "subflow : "+subflow.name;
                        }
                    }
                    if (!nodeDef || !label) {
                        label = n.type;
                    }
                    $('<span>',{class:"node-input-target-node-label",style:"white-space:nowrap"}).text(label).appendTo(row);
                    if (sublabel) {
                        $('<span>',{class:"node-input-target-node-sublabel"}).text(sublabel).appendTo(row);
                    }

                    container.appendTo(nodeList);
                });

                $(".node-input-target-node-checkbox").change(function() {
                    if (!this.checked) {
                        $("#node-input-target-node-checkbox-all").prop('checked',false);
                    }
                });

                $("#node-input-target-node-checkbox-all").prop('checked',allChecked);

                sortNodeList('label');
            }

            function sortNodeList(sortOn) {
                var currentSort = nodeList.data('currentSort');
                var currentSortOrder = nodeList.data('currentSortOrder');

                if (!currentSort) {
                    currentSort = sortOn;
                    currentSortOrder = 'a';
                } else {
                    if (currentSort === sortOn) {
                        currentSortOrder = (currentSortOrder === 'a'?'d':'a');
                    } else {
                        currentSortOrder = 'a';
                    }
                    currentSort = sortOn;
                }
                nodeList.data('currentSort',currentSort);
                nodeList.data('currentSortOrder',currentSortOrder);

                $("#node-input-status-target-container-div .fa").hide();
                $(".node-input-status-sort-"+currentSort+"-"+currentSortOrder).show();


                var items = nodeList.find("li").get();
                items.sort(function(a,b) {
                    var labelA = $(a).find(".node-input-target-node-"+currentSort).text().toLowerCase();
                    var labelB = $(b).find(".node-input-target-node-"+currentSort).text().toLowerCase();
                    if (labelA < labelB) { return currentSortOrder==='a'?-1:1; }
                    if (labelA > labelB) { return currentSortOrder==='a'?1:-1; }
                    return 0;
                });
                $.each(items, function(i, li){
                    nodeList.append(li);
                });
            }
            $("#node-input-target-sort-label").click(function(e) {
                e.preventDefault();
                sortNodeList('label');
            });

            $("#node-input-target-sort-type").click(function(e) {
                e.preventDefault();
                sortNodeList('sublabel')
            });
            $("#node-input-target-node-checkbox-all").change(function() {
                $(".node-input-target-node-checkbox").prop('checked',this.checked);
            })



            $("#node-input-scope-select").change(function(e) {
                var scope = $(this).children("option:selected").val();
                if (scope === "target") {
                    createNodeList();
                    $(".node-input-target-row").show();
                } else {
                    $(".node-input-target-row").hide();
                }
            });
            if (this.scope == null) {
                $("#node-input-scope-select").val("all");
            } else {
                $("#node-input-scope-select").val("target");
            }
            $("#node-input-scope-select").change();

            function dialogResize() {
                var rows = $("#dialog-form>div:not(.node-input-target-row)");
                var height = $("#dialog-form").height();
                for (var i=0;i<rows.size();i++) {
                    height -= $(rows[i]).outerHeight(true);
                }
                var editorRow = $("#dialog-form>div.node-input-target-row");
                height -= (parseInt(editorRow.css("marginTop"))+parseInt(editorRow.css("marginBottom")));
                $("#node-input-status-target-container-div").css("height",height+"px");
            };

            $( "#dialog" ).on("dialogresize", dialogResize);
            $( "#dialog" ).one("dialogopen", function(ev) {
                var size = $( "#dialog" ).dialog('option','sizeCache-status');
                if (size) {
                    $("#dialog").dialog('option','width',size.width);
                    $("#dialog").dialog('option','height',size.height);
                    dialogResize();
                }
            });
            $( "#dialog" ).one("dialogclose", function(ev,ui) {
                $( "#dialog" ).off("dialogresize",dialogResize);
            });

        },
        oneditsave: function() {
            var scope = $("#node-input-scope-select").children("option:selected").val();
            if (scope === 'all') {
                this.scope = null;
            } else {
                var node = this;
                node.scope = [];
                $(".node-input-target-node-checkbox").each(function(n) {
                    if ($(this).prop("checked")) {
                        node.scope.push($(this).data('node-id'));
                    }
                })

            }
        }
    });
};