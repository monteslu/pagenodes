const gifshot = require('gifshot');


// The width and height of the captured photo. We will set the
// width to the value defined here, but the height will be
// calculated based on the aspect ratio of the input stream.

var width = 640;    // We will scale the photo width to this
var height = 0;     // This will be computed based on the input stream

// |streaming| indicates whether or not we're currently streaming
// video from the camera. Obviously, we start at false.

var streaming = false;

// The various HTML elements we need to configure or control. These
// will be set by the startup() function.


var startbutton = null;

//var initialized = false;
var mediaStream;

var gifWidth = 200;
var gifHeight = 200;

function takepicture(cb) {

  var container = document.createElement('div');
  var video = document.createElement('video');
  var canvas = document.createElement('canvas');

  navigator.getMedia = ( navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia);

  navigator.getMedia(
    {
      video: true,
      audio: false
    },
    function(stream) {
      mediaStream = stream;
      if (navigator.mozGetUserMedia) {
        video.mozSrcObject = stream;
      } else {
        var vendorURL = window.URL || window.webkitURL;
        video.src = vendorURL.createObjectURL(stream);
      }
      video.play();

    },
    function(err) {
      console.log("An error occured! " + err);
    }
  );

  video.addEventListener('canplay', function(ev){
    if (!streaming) {
      height = video.videoHeight / (video.videoWidth/width);

      // Firefox currently has a bug where the height can't be read from
      // the video, so we will make assumptions if this happens.

      if (isNaN(height)) {
        height = width / (4/3);
      }

      video.setAttribute('width', width);
      video.setAttribute('height', height);
      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);
      var context = canvas.getContext('2d');
      if (width && height) {
        canvas.width = width;
        canvas.height = height;

        setTimeout(function(){
          context.drawImage(video, 0, 0, width, height);
          var data = canvas.toDataURL('image/png');
          mediaStream.getTracks().forEach(function(track){track.stop()});
          cb(data);
        }, 700);
      }
    }
  }, false);
}

function takeGif(cb){
  gifshot.createGIF({}, function(obj) {
    // callback object properties
    // --------------------------
    // image - Base 64 image
    // cameraStream - The webRTC MediaStream object
    // error - Boolean that determines if an error occurred
    // errorCode - Helpful error label
    // errorMsg - Helpful error message
    // savedRenderingContexts - An array of canvas image data (will only be set if the saveRenderingContexts option was used)
    cb(obj.image);
    obj.cameraStream.getTracks().forEach(function(track){track.stop()});
  });
}

module.exports = function(RED) {

  function CamerNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    node.animated = n.animated;

    this.on("input",function(msg) {
      console.log('adding image', msg);
      if(node.animated){
        takeGif(function(image){
          msg.image = image;
          node.send(msg);
        });
      }else{
        takepicture(function(image){
          msg.image = image;
          node.send(msg);
        });
      }

    });
  }

  RED.nodes.registerType("camera",CamerNode);
}

