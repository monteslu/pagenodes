  var functionHTML = require("raw!../../../../nodes/core/core/80-function.html");
  var injectHTML = require("raw!../../../../nodes/core/core/20-inject.html");
  var debugHTML = require("raw!../../../../nodes/core/core/58-debug.html");
  var templateHTML = require("raw!../../../../nodes/core/core/80-template.html");
  var notifyHTML = require("raw!../../../../nodes/core/core/59-notify.html");
  var espeakHTML = require("raw!../../../../nodes/core/core/60-espeak.html");
  var sentimentHTML = require("raw!../../../../nodes/core/analysis/72-sentiment.html");
  var switchHTML = require("raw!../../../../nodes/core/logic/10-switch.html");
  var changeHTML = require("raw!../../../../nodes/core/logic/15-change.html");
  var rangeHTML = require("raw!../../../../nodes/core/logic/16-range.html");
  var commentHTML = require("raw!../../../../nodes/core/core/90-comment.html");
  var httpinHTML = require("raw!../../../../nodes/core/io/21-httpin.html");
  var cameraHTML = require("raw!../../../../nodes/core/io/24-camera.html");
  var socketioHTML = require("raw!../../../../nodes/core/io/15-socketio.html");
  var meshbluHTML = require("raw!../../../../nodes/core/io/meshblu.html");
  var eventsourceHTML = require("raw!../../../../nodes/core/io/17-eventsource.html");
  var peer2peerHTML = require("raw!../../../../nodes/core/io/16-peer2peer.html");
  var gpioHTML = require("raw!../../../../nodes/core/io/gpio.html");
  var JSONHTML = require("raw!../../../../nodes/core/parsers/70-JSON.html");
  var localdbHTML = require("raw!../../../../nodes/core/storage/27-localdb.html");
  var geolocateHTML = require("raw!../../../../nodes/core/io/geolocate.html");

 module.exports.nodeContents = {
    "function.html": functionHTML,
    "debug.html":  debugHTML,
    "template.html": templateHTML,
    "notify.html": notifyHTML,
    "espeak.html": espeakHTML,
    "inject.html":  injectHTML,
    "sentiment.html": sentimentHTML,
    "switch.html": switchHTML,
    "change.html": changeHTML,
    "range.html": rangeHTML,
    "comment.html": commentHTML,
    "httpin.html": httpinHTML,
    "camera.html": cameraHTML,
    "socketio.html": socketioHTML,
    "meshblu.html": meshbluHTML,
    "eventsource.html": eventsourceHTML,
    "peer2peer.html": peer2peerHTML,
    "gpio.html": gpioHTML,
    "JSON.html": JSONHTML,
    "localdb.html": localdbHTML,
    'geolocate.html': geolocateHTML
  };

  var functionNode = require("../../../../nodes/core/core/80-function");
  var injectNode = require("../../../../nodes/core/core/20-inject");
  var debugNode = require("../../../../nodes/core/core/58-debug");
  var templateNode = require("../../../../nodes/core/core/80-template");
  var notifyNode = require("../../../../nodes/core/core/59-notify");
  var espeakNode = require("../../../../nodes/core/core/60-espeak");
  var sentimentNode = require("../../../../nodes/core/analysis/72-sentiment");
  var switchNode = require("../../../../nodes/core/logic/10-switch");
  var changeNode = require("../../../../nodes/core/logic/15-change");
  var rangeNode = require("../../../../nodes/core/logic/16-range");
  var commentNode = require("../../../../nodes/core/core/90-comment");
  var httpinNode = require("../../../../nodes/core/io/21-httpin");
  var cameraNode = require("../../../../nodes/core/io/24-camera");
  var socketioNode = require("../../../../nodes/core/io/15-socketio");
  var meshbluNode = require("../../../../nodes/core/io/meshblu");
  var peer2peerNode = require("../../../../nodes/core/io/16-peer2peer");
  var gpioNode = require("../../../../nodes/core/io/gpio");
  var eventsourceNode = require("../../../../nodes/core/io/17-eventsource");
  var JSONNode = require("../../../../nodes/core/parsers/70-JSON");
  var localdbNode = require("../../../../nodes/core/storage/27-localdb");
  var geolocateNode = require("../../../../nodes/core/io/geolocate");


  module.exports.requiredNodes = {
    "function.js": functionNode,
    "debug.js" : debugNode,
    "template.js": templateNode,
    "notify.js" : notifyNode,
    "espeak.js" : espeakNode,
    "inject.js" : injectNode,
    "sentiment.js": sentimentNode,
    "switch.js": switchNode,
    "change.js": changeNode,
    "range.js": rangeNode,
    "comment.js": commentNode,
    "httpin.js": httpinNode,
    "camera.js": cameraNode,
    "socketio.js": socketioNode,
    "meshblu.js": meshbluNode,
    "eventsource.js": eventsourceNode,
    "peer2peer.js": peer2peerNode,
    "gpio.js": gpioNode,
    "JSON.js": JSONNode,
    "localdb.js": localdbNode,
    "geolocate.js": geolocateNode
  };
