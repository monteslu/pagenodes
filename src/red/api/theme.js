/**
 * Copyright 2015 IBM Corp.
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

var util = require("util");
var path = require("path");
var fs = require("fs");
var clone = require("lodash").cloneDeep;

var defaultContext = {
    page: {
        title: "Node-RED",
        favicon: "favicon.ico"
    },
    header: {
        title: "Node-RED",
        image: "red/images/node-red.png"
    },
    asset: {
        red: (process.env.NODE_ENV == "development")? "red/red.js":"red/red.min.js"
    }
};

var themeContext = clone(defaultContext);
var themeSettings = null;

function serveFile(app,baseUrl,file) {
    try {
        var stats = fs.statSync(file);
        var url = baseUrl+path.basename(file);
        //console.log(url,"->",file);
        app.get(url,function(req, res) {
            res.sendFile(file);
        });
        return "theme"+url;
    } catch(err) {
        //TODO: log filenotfound
        return null;
    }
}

module.exports = {
    init: function(settings) {
        console.log('nope');
    },
    context: function() {
        return themeContext;
    },
    settings: function() {
        return themeSettings;
    }
}
