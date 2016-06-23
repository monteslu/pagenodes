const firebase = require('firebase/app');
require('firebase/auth');
require('firebase/database');
var _ = require('lodash');


function init(RED) {

  function firebaseserverNode(n) {
    var node = this;
    RED.nodes.createNode(node,n);


    var config = {
      apiKey: n.apiKey,
      authDomain: n.authDomain,
      databaseURL: n.databaseURL,
      storageBucket: n.storageBucket,
    };
    node.app = firebase.initializeApp(config);
    node.database = node.app.database();
    node.auth = node.app.auth();



    node.on('close', function() {
      console.log('close firebase connection');
    });

  }
  firebaseserverNode.groupName = 'firebase';
  RED.nodes.registerType("firebase-server", firebaseserverNode);

  function firebaseInNode(n) {
    const topic = 'firebase';
    var node = this;
    RED.nodes.createNode(node,n);
    node.databaseRef = n.databaseRef;
    node.action = n.action;
    node.server = n.server;
    node.serverConfig = RED.nodes.getNode(node.server);


    try{
      if(node.serverConfig.database){
        setTimeout(function(){
          node.ref = node.serverConfig.database.ref().child(node.databaseRef);
          console.log('node.ref', node.ref, node.action, node.serverConfig, node.serverConfig.databaseRef);
          node.ref.on(node.action, function(snapshot) {
            // Get the chat message from the snapshot and add it to the UI
            var msg = {
              topic: topic,
              key: snapshot.getKey(),
              databaseRef: node.databaseRef,
              payload: snapshot.val()
            };
            node.send(msg);
          });
        }, 500);
      }
    }catch(exp){
      console.log('error in firebase in node', exp);
    }
  }
  firebaseInNode.groupName = 'firebase';
  RED.nodes.registerType("firebase in",firebaseInNode);

  function firebaseOutNode(n) {
    var node = this;
    RED.nodes.createNode(node,n);
    node.server = n.server;
    node.databaseRef = n.databaseRef;
    node.action = n.action;
    node.serverConfig = RED.nodes.getNode(node.server);

    node.on('input', function(msg){
      if(node.serverConfig.database){
        var databaseRef = msg.databaseRef || node.databaseRef;
        var ref = node.serverConfig.database.ref().child(databaseRef);
        var action = msg.action || node.action
        try{
          if(action === 'update'){
            ref.update(msg.payload);
          }
          else if(action === 'remove'){
            ref.remove();
          }
          else if(action === 'add'){
            ref.push().set(msg.payload);
          }
        }catch(exp){
          node.error(exp);
        }

      }
    });

  }

  firebaseOutNode.groupName = 'firebase';
  RED.nodes.registerType("firebase out",firebaseOutNode);


}

module.exports = init;
