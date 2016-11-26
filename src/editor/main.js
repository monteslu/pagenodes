const extras = require('extras');
const extrasSW = require('extras/service-worker');

const nodeDefs = require('pagenodes-nodes/src/editor'); //require('./nodeDefs');


extrasSW.registerServiceWorker();

var PN = {};

const util = require('./util');
PN.util = util;


function loadNodeList() {
  PN.comms.rpc('getNodeList', [], function(data){
    PN.nodes.setNodeList(data);
    var nsCount = 0;
    for(var i=0;i<data.length;i++) {
      var ns = data[i];
      if (ns.module != "node-red") {
        nsCount++;
        PN.i18n.loadCatalog(ns.id, function() {
          nsCount--;
          if (nsCount === 0) {
            loadNodes();
          }
        });
      }
    }
    if (nsCount === 0) {
      loadNodes();
    }
  });
}

function loadNodes() {
  //PN.comms.rpc('getNodeConfigs', [], function(){
    // console.log('getNodeConfigs', data.length);
    // $("body").append(data);
    // $("body").append(templateText);
    nodeDefs.forEach(function(n){
      n(PN);
    });
    extras.loadClient(PN);

    $("body").i18n();

    $(".palette-spinner").hide();
    $(".palette-scroll").show();
    $("#palette-search").show();
    loadFlows();
  //});
}

function loadFlows() {

  PN.comms.rpc('loadFlows', [], function(nodes){
    PN.nodes.import(nodes);
    PN.nodes.dirty(false);
    PN.view.redraw(true);
    PN.comms.subscribe("status/#",function(topic,msg) {
      var parts = topic.split("/");
      var node = PN.nodes.node(parts[1]);
      if (node) {
        if (msg.text) {
          msg.text = node._(msg.text.toString(),{defaultValue:msg.text.toString()});
        }
        node.status = msg;
        if (statusEnabled) {
          node.dirty = true;
          PN.view.redraw();
        }
      }
    });
    PN.comms.subscribe("node/#",function(topic,msg) {
      var i,m;
      var typeList;
      var info;

      if (topic == "node/added") {
        console.log('node/added', topic, msg);
        var addedTypes = [];
        for (i=0;i<msg.length;i++) {
          m = msg[i];
          var id = m.id;
          PN.nodes.addNodeSet(m);
          addedTypes = addedTypes.concat(m.types);
          $.get('nodes/'+id, function(data) {
            $("body").append(data);
          });
        }
        if (addedTypes.length) {
          typeList = "<ul><li>"+addedTypes.join("</li><li>")+"</li></ul>";
          PN.notify(PN._("palette.event.nodeAdded", {count:addedTypes.length})+typeList,"success");
        }
      } else if (topic == "node/removed") {
        for (i=0;i<msg.length;i++) {
          m = msg[i];
          info = PN.nodes.removeNodeSet(m.id);
          if (info.added) {
            typeList = "<ul><li>"+m.types.join("</li><li>")+"</li></ul>";
            PN.notify(PN._("palette.event.nodeRemoved", {count:m.types.length})+typeList,"success");
          }
        }
      } else if (topic == "node/enabled") {
        if (msg.types) {
          info = PN.nodes.getNodeSet(msg.id);
          if (info.added) {
            PN.nodes.enableNodeSet(msg.id);
            typeList = "<ul><li>"+msg.types.join("</li><li>")+"</li></ul>";
            PN.notify(PN._("palette.event.nodeEnabled", {count:msg.types.length})+typeList,"success");
          } else {
            $.get('nodes/'+msg.id, function(data) {
              $("body").append(data);
              typeList = "<ul><li>"+msg.types.join("</li><li>")+"</li></ul>";
              PN.notify(PN._("palette.event.nodeAdded", {count:msg.types.length})+typeList,"success");
            });
          }
        }
      } else if (topic == "node/disabled") {
        if (msg.types) {
          PN.nodes.disableNodeSet(msg.id);
          typeList = "<ul><li>"+msg.types.join("</li><li>")+"</li></ul>";
          PN.notify(PN._("palette.event.nodeDisabled", {count:msg.types.length})+typeList,"success");
        }
      }
    });
  });
}

var statusEnabled = false;
var remoteEnabled = false;
function toggleStatus(state) {
  statusEnabled = state;
  PN.view.status(statusEnabled);
}
function toggleRemote(state) {
  remoteEnabled = state;
  PN.view.remoteControl(remoteEnabled);
}

function loadEditor() {
  PN.menu.init({id:"btn-sidemenu",
    options: [
      {id:"menu-item-sidebar-menu",label:PN._("menu.label.sidebar.sidebar"),options:[
        {id:"menu-item-sidebar",label:PN._("menu.label.sidebar.show"),toggle:true,onselect:PN.sidebar.toggleSidebar, selected: true},
        null
      ]},
      {id:"menu-item-status",label:PN._("menu.label.displayStatus"),toggle:true,onselect:toggleStatus, selected: true},
      null,
      {id:"menu-item-import",label:PN._("menu.label.import"),options:[
        {id:"menu-item-import-clipboard",label:PN._("menu.label.clipboard"),onselect:PN.clipboard.import}
      ]},
      {id:"menu-item-export",label:PN._("menu.label.export"),disabled:true,options:[
        {id:"menu-item-export-clipboard",label:PN._("menu.label.clipboard"),disabled:true,onselect:PN.clipboard.export},
        //{id:"menu-item-export-library",label:PN._("menu.label.library"),disabled:true,onselect:PN.library.export}
      ]},
      null,
      {id:"menu-item-subflow",label:PN._("menu.label.subflows"), options: [
        {id:"menu-item-subflow-create",label:PN._("menu.label.createSubflow"),onselect:PN.subflow.createSubflow},
        {id:"menu-item-subflow-convert",label:PN._("menu.label.selectionToSubflow"),disabled:true,onselect:PN.subflow.convertToSubflow},
      ]},
      null,
      {id:"menu-item-workspace",label:PN._("menu.label.flows"),options:[
        {id:"menu-item-workspace-add",label:PN._("menu.label.add"),onselect:PN.workspaces.add},
        {id:"menu-item-workspace-edit",label:PN._("menu.label.rename"),onselect:PN.workspaces.edit},
        {id:"menu-item-workspace-delete",label:PN._("menu.label.delete"),onselect:PN.workspaces.remove},
        null
      ]},
      null,
      {id:"menu-item-keyboard-shortcuts",label:PN._("menu.label.keyboardShortcuts"),onselect:PN.keyboard.showHelp},
      // {id:"menu-item-help", label: "Pagenodes Website", href: PN.settings.theme("menu.menu-item-help.url","https://github.com/monteslu/pagenodes")},
      {id:"menu-item-remote",label:"IoT Remote Buttons",toggle:true,onselect:toggleRemote, selected: false}
    ]
  });

  PN.user.init();
  PN.library.init();
  PN.palette.init();
  PN.sidebar.init();
  PN.subflow.init();
  PN.workspaces.init();
  PN.clipboard.init();
  PN.view.init();
  PN.editor.init();
  PN.remoteControl.init();

  PN.deploy.init(PN.settings.theme("deployButton",null));

  PN.keyboard.add(/* ? */ 191,{shift:true},function(){PN.keyboard.showHelp();d3.event.preventDefault();});
  PN.comms.connect();

  $("#main-container").show();
  $(".header-toolbar").show();
  extras.initUI(PN);

}

PN.loadEditor = loadEditor;
PN.loadNodeList = loadNodeList;

PN.extras = extras;




global.PNFE = PN;

require('./events')(PN);
require('./i18n')(PN);
require('./settings')(PN);
require('./user')(PN);
require('./comms')(PN);
require('./ui/state')(PN);
require('./nodes')(PN);
require('./history')(PN);
require('./validators')(PN);
require('./ui/deploy')(PN);
require('./ui/menu')(PN);
require('./ui/keyboard')(PN);
require('./ui/tabs')(PN);
require('./ui/popover')(PN);
require('./ui/workspaces')(PN);
require('./ui/view')(PN);
require('./ui/sidebar')(PN);
require('./ui/palette')(PN);
require('./ui/tab-info')(PN);
require('./ui/tab-config')(PN);
require('./ui/editor')(PN);
require('./ui/clipboard')(PN);
require('./ui/library')(PN);
require('./ui/notifications')(PN);
require('./ui/subflow')(PN);
require('./ui/touch/radialMenu')(PN);
require('./ui/remote-control')(PN);
require('./ui/typedInput')(PN);
require('./ui/editableList')(PN);
require('./ui/searchField')(PN);
PN.components = require('./ui/components');
module.exports = PN;

