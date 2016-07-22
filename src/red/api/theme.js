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
