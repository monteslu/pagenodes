var when = require('when');
var localforage = require('localforage');

var settings;
var flowsFile;
var flowsFullPath;
var credentialsFile;

function getFileMeta(root,path) {
  console.log('getFileMeta', root, path);

  var meta = {};

  return meta;
}

function getFileBody(root,path) {
  console.log('getFileBody', root, path);
  var body = "";
  return body;
}

/**
 * Write content to a file using UTF8 encoding.
 * This forces a fsync before completing to ensure
 * the write hits disk.
 */
function writeFile(path,content) {

  console.log('writeFile', path, content);
  return localforage.setItem(path, content);
}

var localfilesystem = {
  init: function(_settings) {
    settings = _settings;

    settings.userDir = 'PAGENODES';
    flowsFile = 'flows.json';
    flowsFullPath = settings.userDir + '_' + flowsFile;

    credentialsFile = settings.userDir + '_cred';

    return when.resolve('ok');
  },

  getFlows: function() {
    return localforage.getItem(flowsFullPath).then(val =>{
      return val || [];
    });
  },

  saveFlows: function(flows) {

    var flowData;
    return writeFile(flowsFullPath, flows);
  },

  getCredentials: function() {
    return when.resolve('ok');
  },

  saveCredentials: function(credentials) {
    return writeFile(credentialsFile, credentials);
  },

};

module.exports = localfilesystem;
