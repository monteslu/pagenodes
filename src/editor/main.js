/**
 * Copyright 2013, 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

require('babel-core/polyfill'); //@#$! safari

var loadPackedNodes = require('./nodeDefs/js');
// var templateText = require('./nodeDefs/html');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.bundle.js')
  .then(function(reg) {
    console.log('Yey serivceworker!', reg);

  }).catch(function(err) {
    console.log('Boo no serviceWorker!', err);
  });
}

var RED = (function() {


  function loadNodeList() {
    RED.comms.rpc('getNodeList', [], function(data){
      console.log('getNodeList', data);
      RED.nodes.setNodeList(data);

      var nsCount = 0;
      for(var i=0;i<data.length;i++) {
        var ns = data[i];
        if (ns.module != "node-red") {
          nsCount++;
          RED.i18n.loadCatalog(ns.id, function() {
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
    RED.comms.rpc('getNodeConfigs', [], function(data){
      console.log('getNodeConfigs', data.length);
      $("body").append(data);
      // $("body").append(templateText);
      loadPackedNodes(RED);
      $("body").i18n();

      $(".palette-spinner").hide();
      $(".palette-scroll").show();
      $("#palette-search").show();
      loadFlows();
    });
  }

  function loadFlows() {

    RED.comms.rpc('loadFlows', [], function(nodes){
      RED.nodes.import(nodes);
      RED.nodes.dirty(false);
      RED.view.redraw(true);
      RED.comms.subscribe("status/#",function(topic,msg) {
        var parts = topic.split("/");
        var node = RED.nodes.node(parts[1]);
        if (node) {
          if (msg.text) {
            msg.text = node._(msg.text.toString(),{defaultValue:msg.text.toString()});
          }
          node.status = msg;
          if (statusEnabled) {
            node.dirty = true;
            RED.view.redraw();
          }
        }
      });
      RED.comms.subscribe("node/#",function(topic,msg) {
        var i,m;
        var typeList;
        var info;



        if (topic == "node/added") {
          console.log('node/added', topic, msg);
          var addedTypes = [];
          for (i=0;i<msg.length;i++) {
            m = msg[i];
            var id = m.id;
            RED.nodes.addNodeSet(m);
            addedTypes = addedTypes.concat(m.types);
            $.get('nodes/'+id, function(data) {
              $("body").append(data);
            });
          }
          if (addedTypes.length) {
            typeList = "<ul><li>"+addedTypes.join("</li><li>")+"</li></ul>";
            RED.notify(RED._("palette.event.nodeAdded", {count:addedTypes.length})+typeList,"success");
          }
        } else if (topic == "node/removed") {
          for (i=0;i<msg.length;i++) {
            m = msg[i];
            info = RED.nodes.removeNodeSet(m.id);
            if (info.added) {
              typeList = "<ul><li>"+m.types.join("</li><li>")+"</li></ul>";
              RED.notify(RED._("palette.event.nodeRemoved", {count:m.types.length})+typeList,"success");
            }
          }
        } else if (topic == "node/enabled") {
          if (msg.types) {
            info = RED.nodes.getNodeSet(msg.id);
            if (info.added) {
              RED.nodes.enableNodeSet(msg.id);
              typeList = "<ul><li>"+msg.types.join("</li><li>")+"</li></ul>";
              RED.notify(RED._("palette.event.nodeEnabled", {count:msg.types.length})+typeList,"success");
            } else {
              $.get('nodes/'+msg.id, function(data) {
                $("body").append(data);
                typeList = "<ul><li>"+msg.types.join("</li><li>")+"</li></ul>";
                RED.notify(RED._("palette.event.nodeAdded", {count:msg.types.length})+typeList,"success");
              });
            }
          }
        } else if (topic == "node/disabled") {
          if (msg.types) {
            RED.nodes.disableNodeSet(msg.id);
            typeList = "<ul><li>"+msg.types.join("</li><li>")+"</li></ul>";
            RED.notify(RED._("palette.event.nodeDisabled", {count:msg.types.length})+typeList,"success");
          }
        }
      });
    });

  }

  var statusEnabled = false;
  function toggleStatus(state) {
    statusEnabled = state;
    RED.view.status(statusEnabled);
  }

  // this corresponds with /src/editor/ui/menu.js
  function loadEditor() {
    console.log('Loading Sidebar');
    RED.menu.init({id:"btn-sidemenu",
                  options: [
                    {id:"menu-item-sidebar-menu",label:RED._("menu.label.sidebar.sidebar"),options:[
                      {id:"menu-item-sidebar",label:RED._("menu.label.sidebar.show"),toggle:true,onselect:RED.sidebar.toggleSidebar, selected: true},
                      null
                    ]},
                    {id:"menu-item-status",label:RED._("menu.label.displayStatus"),toggle:true,onselect:toggleStatus, selected: true},
                    null,
                    {id:"menu-item-import",label:RED._("menu.label.import"),options:[
                      {id:"menu-item-import-clipboard",label:RED._("menu.label.clipboard"),onselect:RED.clipboard.import},
                      {id:"menu-item-import-library",label:RED._("menu.label.library"),options:[]}
                    ]},
                    {id:"menu-item-export",label:RED._("menu.label.export"),disabled:true,options:[
                      {id:"menu-item-export-clipboard",label:RED._("menu.label.clipboard"),disabled:true,onselect:RED.clipboard.export},
                      {id:"menu-item-export-library",label:RED._("menu.label.library"),disabled:true,onselect:RED.library.export}
                    ]},
                    null,
                    {id:"menu-item-subflow",label:RED._("menu.label.subflows"), options: [
                      {id:"menu-item-subflow-create",label:RED._("menu.label.createSubflow"),onselect:RED.subflow.createSubflow},
                      {id:"menu-item-subflow-convert",label:RED._("menu.label.selectionToSubflow"),disabled:true,onselect:RED.subflow.convertToSubflow},
                    ]},
                    null,
                    {id:"menu-item-workspace",label:RED._("menu.label.flows"),options:[
                      {id:"menu-item-workspace-add",label:RED._("menu.label.add"),onselect:RED.workspaces.add},
                      {id:"menu-item-workspace-edit",label:RED._("menu.label.rename"),onselect:RED.workspaces.edit},
                      {id:"menu-item-workspace-delete",label:RED._("menu.label.delete"),onselect:RED.workspaces.remove},
                      null
                    ]},
                    null,
                    {id:"menu-item-keyboard-shortcuts",label:RED._("menu.label.keyboardShortcuts"),onselect:RED.keyboard.showHelp},
                    {id:"menu-item-help",label: RED.settings.theme("menu.menu-item-help.label","Pagenodes Website"),href: RED.settings.theme("menu.menu-item-help.url","http://www.pagenodes.com")},
                    {id:"auth0login",label:RED._("menu.label.login"),onselect: RED.auth0.logIn,href: "#"},
                    {id:"auth0logout",label:RED._("menu.label.logout"),onselect: RED.auth0.logOut,href: "/"}
                  ]
    });


    console.log('verify auth0:', RED.auth0.auth0test);

    RED.auth0.checkAuth();
    RED.library.init();
    RED.palette.init();
    RED.sidebar.init();
    RED.subflow.init();
    RED.workspaces.init();
    RED.clipboard.init();
    RED.view.init();
    RED.editor.init();

    RED.deploy.init(RED.settings.theme("deployButton",null));

    RED.keyboard.add(/* ? */ 191,{shift:true},function(){RED.keyboard.showHelp();d3.event.preventDefault();});
    RED.comms.connect();

    $("#main-container").show();
    $(".header-toolbar").show();

    loadNodeList();
  }


  $(function() {

    if ((window.location.hostname !== "localhost") && (window.location.hostname !== "127.0.0.1")) {
      document.title = document.title+" : "+window.location.hostname;
    }

    ace.require("ace/ext/language_tools");

    RED.i18n.init(function() {
      RED.settings.init(function(){
        RED.events.on('serverReady', function(){
          loadEditor();
        });
      });
    })
  });


  return {
  };
})();

window.RED = RED;

require('./ui/auth0')(RED);
require('./events')(RED);
require('./i18n')(RED);
require('./settings')(RED);
require('./user')(RED);
require('./comms')(RED);
require('./ui/state')(RED);
require('./nodes')(RED);
require('./history')(RED);
require('./validators')(RED);
require('./ui/deploy')(RED);
require('./ui/menu')(RED);
require('./ui/keyboard')(RED);
require('./ui/tabs')(RED);
require('./ui/popover')(RED);
require('./ui/workspaces')(RED);
require('./ui/view')(RED);
require('./ui/sidebar')(RED);
require('./ui/palette')(RED);
require('./ui/tab-info')(RED);
require('./ui/tab-config')(RED);
require('./ui/editor')(RED);
require('./ui/clipboard')(RED);
require('./ui/library')(RED);
require('./ui/notifications')(RED);
require('./ui/subflow')(RED);
require('./ui/touch/radialMenu')(RED);



// require('extras').loadClient(RED);
