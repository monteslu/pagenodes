/**
 * Copyright 2013, 2014 IBM Corp.
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

var when = require('when');
var nodeFn = require('when/node/function');
var keys = require('when/keys');

var log = require("../log");


var settings;
var flowsFile;
var flowsFullPath;
var flowsFileBackup;
var credentialsFile;
var credentialsFileBackup;
var oldCredentialsFile;
var sessionsFile;
var libDir;
var libFlowsDir;
var globalSettingsFile;

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
    return when.promise(function(resolve,reject) {
        localStorage[path] = content;
        resolve('ok');
    });
}

var localfilesystem = {
    init: function(_settings) {
        settings = _settings;

        console.log('localfilesystem init', _settings);
        settings.userDir = 'NODE_RED_HOME';
        flowsFile = 'flows.json';
        flowsFullPath = settings.userDir + '_' + flowsFile;

        credentialsFile = settings.userDir + '_cred';
        credentialsFileBackup = settings.userDir + '_cred.backup';

        oldCredentialsFile = settings.userDir + '_credentials.json';

        flowsFileBackup = flowsFullPath + ".backup";

        sessionsFile = settings.userDir + '_sessions.json';

        libDir = settings.userDir + '_lib';
        libFlowsDir = libDir + "_flows";

        globalSettingsFile = settings.userDir + '_config.json';

        return when.resolve('ok');
    },

    getFlows: function() {
        console.log('getFlows from localstorage');
        return when.promise(function(resolve) {

            if (localStorage[flowsFullPath]) {
                resolve(JSON.parse(localStorage[flowsFullPath]));
            } else {
                log.info(log._("storage.localfilesystem.create"));
                resolve([]);
            }

        });
    },

    saveFlows: function(flows) {

        var flowData;

        if (settings.flowFilePretty) {
            flowData = JSON.stringify(flows,null,4);
        } else {
            flowData = JSON.stringify(flows);
        }
        return writeFile(flowsFullPath, flowData);
    },

    getCredentials: function() {
        return when.resolve('ok');
    },

    saveCredentials: function(credentials) {
        var credentialData;
        if (settings.flowFilePretty) {
            credentialData = JSON.stringify(credentials,null,4);
        } else {
            credentialData = JSON.stringify(credentials);
        }
        return writeFile(credentialsFile, credentialData);
    },

    getSettings: function() {
        console.log('getSettings');
        return when.promise(function(resolve) {

          if (localStorage[globalSettingsFile]) {
              resolve(JSON.parse(localStorage[globalSettingsFile]));
          } else {
              resolve({});
          }

        });
    },
    saveSettings: function(settings) {
        console.log('saveSettings', settings);
        return writeFile(globalSettingsFile,JSON.stringify(settings,null,1));
    },
    getSessions: function() {
        console.log('getSessions');
        return when.promise(function(resolve) {

          if (localStorage[sessionsFile]) {
              resolve(JSON.parse(localStorage[sessionsFile]));
          } else {
              resolve({});
          }

        });
    },
    saveSessions: function(sessions) {
        return writeFile(sessionsFile,JSON.stringify(sessions));
    },

    getLibraryEntry: function(type,path) {
        //TODO read from localstorage
        return when.resolve([]);
    },

    saveLibraryEntry: function(type,path,meta,body) {
        var fn = [libDir , type, path].join('_');
        var headers = "";
        for (var i in meta) {
            if (meta.hasOwnProperty(i)) {
                headers += "// "+i+": "+meta[i]+"\n";
            }
        }

        writeFile(fn,headers+body);

        return when.resolve('ok');
    }
};

module.exports = localfilesystem;
