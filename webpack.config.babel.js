const path = require('path');

module.exports = {
  entry: {
    ui: path.join(__dirname, './build/main.js'),
    "service-worker": path.join(__dirname, './build/backend/service-worker.js'),
    "function-worker": path.join(__dirname, './build/backend/function-worker.js'),
    "j5-worker": path.join(__dirname, './build/backend/j5-worker.js')
  },
  output: {
    filename: '[name].bundle.js',
    path: path.join(__dirname, './public/')
  },
  resolveLoader: {
    root: path.join(__dirname, 'node_modules')
  },
  module: {
    noParse: /node_modules\/localforage\/dist\/localforage.js/,
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react']
        }
      },
      {
        test: /\.json$/,
        loader: "json"
      }
    ]
  },
  resolve: {
    // this is a workaround for aliasing a top level dependency
    // inside a symlinked subdependency
    root: path.join(__dirname, 'node_modules'),
    alias: {
      // replacing `fs` with a browser-compatible version
      net: 'chrome-net',
      fs: 'level-fs-browser',
      serialport: 'browser-serialport',
      bcrypt: 'bcryptjs',
      extras: process.env.EXTRAS || 'pagenodes-extras',
      vm: 'vm-browserify'
    }
  },
  bail: false
};
