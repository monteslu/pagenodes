
var _ = require('lodash');


function init(RED) {



  function midiInNode(n) {
    var node = this;
    RED.nodes.createNode(node,n);
    node.deviceId = n.deviceId;



    node.status({fill:"yellow",shape:"dot",text:"connecting..."});

    // request MIDI access
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({
            sysex: false
        }).then(onMIDISuccess, onMIDIFailure);
    } else {
        node.error("No MIDI support in your browser.");
    }


    // midi functions
    function onMIDISuccess(midiAccess) {
        // when we get a succesful response, run this code
        node.midi = midiAccess; // this is our raw MIDI data, inputs, outputs, and sysex status

        var inputs = Array.from(node.midi.inputs.values());
        console.log('inputs', inputs);

        _.forEach(inputs, function(input){
          if(!node.deviceId){
            node.device = input;
            return false;
          }
          else if(node.deviceId == input.id){
            node.device = input;
            return false;
          }
        });

        if(node.device){
          node.status({fill:"green",shape:"dot",text:"id: " + node.device.id});
          node.device.onmidimessage = function(message) {
              var data = message.data; // this gives us our [command/channel, note, velocity] data.
              // console.log('MIDI data', data); // MIDI data [144, 63, 73]
              node.send({topic: 'midi', payload: data});
          };
        }
        else{
          node.status({fill:"red",shape:"dot",text:"disconnected"});
        }
    }

    function onMIDIFailure(error) {
        // when we get a failed response, run this code
        node.error("No access to MIDI devices or your browser doesn't support WebMIDI API" + error);
    }


    node.on('close', function(){
      if(node.device){
        node.device.onmidimessage = null;
        node.device.close();
      }
    });


  }
  midiInNode.groupName = 'midi';
  RED.nodes.registerType("midi in",midiInNode);

  function midiOutNode(n) {
    var node = this;
    RED.nodes.createNode(node,n);
    node.deviceId = n.deviceId;



    node.status({fill:"yellow",shape:"dot",text:"connecting..."});

    // request MIDI access
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({
            sysex: false
        }).then(onMIDISuccess, onMIDIFailure);
    } else {
        node.error("No MIDI support in your browser.");
    }


    // midi functions
    function onMIDISuccess(midiAccess) {
        // when we get a succesful response, run this code
        node.midi = midiAccess; // this is our raw MIDI data, inputs, outputs, and sysex status

        var outputs = Array.from(node.midi.outputs.values());
        console.log('outputs', outputs);

        _.forEach(outputs, function(output){
          if(!node.deviceId){
            node.device = output;
            return false;
          }
          else if(node.deviceId == output.id){
            node.device = output;
            return false;
          }
        });

        if(node.device){
          node.status({fill:"green",shape:"dot",text:"id: " + node.device.id});

          node.on('input', function(msg){
            node.device.send(new Buffer(msg.payload));
          });
        }
        else{
          node.status({fill:"red",shape:"dot",text:"disconnected"});
        }
    }

    function onMIDIFailure(error) {
        // when we get a failed response, run this code
        node.error("No access to MIDI devices or your browser doesn't support WebMIDI API" + error);
    }


    node.on('close', function(){
      if(node.device){
        node.device.onmidimessage = null;
        node.device.close();
      }
    });


  }

  midiOutNode.groupName = 'midi';
  RED.nodes.registerType("midi out",midiOutNode);

}

module.exports = init;

