/**
 * Copyright 2013,2015 IBM Corp.
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

  // The width and height of the captured photo. We will set the
  // width to the value defined here, but the height will be
  // calculated based on the aspect ratio of the input stream.

  var width = 64;    // We will scale the photo width to this
  var height = 0;     // This will be computed based on the input stream

  // |streaming| indicates whether or not we're currently streaming
  // video from the camera. Obviously, we start at false.

  var streaming = false;

  // The various HTML elements we need to configure or control. These
  // will be set by the startup() function.


  var startbutton = null;

  //var initialized = false;
  var mediaStream;

  function takepicture(cb) {

    var container = document.createElement('div');
    var video = document.createElement('video');
    var canvas = document.createElement('canvas');
    //photo = document.getElementById('cameraphoto');
    // startbutton = document.getElementById('startbutton');

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
        //streaming = true;
        var context = canvas.getContext('2d');
        if (width && height) {
          canvas.width = width;
          canvas.height = height;

          setTimeout(function(){
            context.drawImage(video, 0, 0, width, height);
            var data = canvas.toDataURL('image/png');
            // mediaStream.active = false;
            mediaStream.getTracks().forEach(function(track){track.stop()});
            cb(data);
          }, 700);
          //photo.setAttribute('src', data);

        }


      }
    }, false);

    // startbutton.addEventListener('click', function(ev){
    //   takepicture();
    //   ev.preventDefault();
    // }, false);

    // clearphoto();
  }

  // Fill the photo with an indication that none has been
  // captured.

  // function clearphoto() {
  //   var context = canvas.getContext('2d');
  //   context.fillStyle = "#AAA";
  //   context.fillRect(0, 0, canvas.width, canvas.height);

  //   var data = canvas.toDataURL('image/png');
  //   photo.setAttribute('src', data);
  // }

  // Capture a photo by fetching the current contents of the video
  // and drawing it into a canvas, then converting that to a PNG
  // format data URL. By drawing it on an offscreen canvas and then
  // drawing that to the screen, we can change its size and/or apply
  // other changes before drawing it.

  // function takepicture(cb) {
  //   startup(function(){
  //       else {
  //         clearphoto();
  //       }
  //   });

  // }




module.exports = function(RED) {

    function CamerNode(n) {
        //console.log('creating CamerNode node', n);
        RED.nodes.createNode(this,n);
        var node = this;

        this.on("input",function(msg) {
            console.log('adding image', msg);

            takepicture(function(image){
                msg.image = image;
                node.send(msg);
            });

            //msg.image = 'hello.gif';
            //node.send(msg);
            // sendCamera({id:this.id,name:this.name,topic:msg.topic,msg:msg});
        });
    }

    RED.nodes.registerType("camera",CamerNode);
}
