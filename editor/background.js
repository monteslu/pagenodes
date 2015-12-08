'use strict';

function noop(){}

function closeSerialPorts(){
  chrome.serial.getConnections(function(connections){
    connections.forEach(function(connection){
      chrome.serial.disconnect(connection.connectionId, noop);
    });
  });
}

// Listens for the app launching then creates the window
chrome.app.runtime.onLaunched.addListener(function() {
  var width = 1000;
  var height = 500;

  var windowOpts = {
    id: 'main',
    state: 'maximized',
    bounds: {
      width: width,
      height: height,
      left: Math.round((screen.availWidth - width) / 2),
      top: Math.round((screen.availHeight - height) / 2)
    }
  };

  chrome.app.window.create('index.html', windowOpts, function(win){
    win.onClosed.addListener(closeSerialPorts);
  });
});

chrome.runtime.onInstalled.addListener(function(evt){
  chrome.storage.local.set({newVersion: 'newVersion'});
});
