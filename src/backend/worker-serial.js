var stream = require('stream');
var util = require('util');


function WorkerSerialPort(tx) {

  console.log('new WorkerSerialPort');

  var self = this;
  self.tx = tx;

  process.nextTick(function(){
    self.emit('open');
  });

}

util.inherits(WorkerSerialPort, stream.Stream);


WorkerSerialPort.prototype.open = function (callback) {
  this.emit('open');
  if (callback) {
    callback();
  }

};



WorkerSerialPort.prototype.write = function (data, callback) {

  var self = this;

  if (!Buffer.isBuffer(data)) {
    data = new Buffer(data);
  }

  this.tx(data);

};



WorkerSerialPort.prototype.close = function (callback) {
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

};

WorkerSerialPort.prototype.flush = function (callback) {
  console.log('flush');
  if(callback){
    callback();
  }
};

WorkerSerialPort.prototype.drain = function (callback) {
  console.log('drain');
  if(callback){
    callback();
  }
};



module.exports = {
  SerialPort: WorkerSerialPort
};
