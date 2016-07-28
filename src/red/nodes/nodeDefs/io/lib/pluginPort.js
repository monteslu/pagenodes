var stream = require('stream');
var util = require('util');

module.exports = function(RED){

  function PluginSerialPort(type, name, options) {

    console.log('new PluginSerialPort', type, name, options);

    var self = this;
    self.type = type;
    self.name = name;
    self.options = options;

    self.dataListener = function(data){
      // console.log('data from wire', new Buffer(data).toString('hex'));
      self.emit('data', new Buffer(data));
    };

    RED.events.on('data_' + self.type + '_' + self.name, self.dataListener);

    RED.plugin.rpc('connect', [type, name, options], function(result){
      console.log('PluginSerialPort connect result', result);
      if(result.error){
        return self.emit('error', result.error);
      }
      self.emit('open');
    });

  }

  util.inherits(PluginSerialPort, stream.Stream);


  PluginSerialPort.prototype.open = function (callback) {
    this.emit('open');
    if (callback) {
      callback();
    }

  };



  PluginSerialPort.prototype.write = function (data, callback) {

    var self = this;

    if (!Buffer.isBuffer(data)) {
      data = new Buffer(data);
    }

    // console.log('data to wire', data.toString('hex'));
    RED.plugin.postMessage({type: 'data', conType: self.type, name: self.name, data});

  };



  PluginSerialPort.prototype.close = function (callback) {
    console.log('closing');
    var self = this;
    RED.plugin.rpc('disconnect', [self.type, self.name], function(result){
      if(result.error){
        return self.emit('error', result.error);
      }
      if(callback){
        callback();
      }
    });
    RED.events.removeListener('data_' + self.type + '_' + self.name, self.dataListener);

  };

  PluginSerialPort.prototype.flush = function (callback) {
    console.log('flush');
    if(callback){
      callback();
    }
  };

  PluginSerialPort.prototype.drain = function (callback) {
    console.log('drain');
    if(callback){
      callback();
    }
  };


  return {
    SerialPort: PluginSerialPort
  };

};

