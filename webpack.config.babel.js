const path = require('path');

module.exports = {
  entry: {
    ui: path.join(__dirname, './build/editor/main.js'),
    backend: path.join(__dirname, './build/red/main.js'),
    "service-worker": path.join(__dirname, './build/red/service-worker.js')
  },
  output: {
    filename: '[name].bundle.js',
    path: path.join(__dirname, './public/')
  },
  resolveLoader: {
    root: path.join(__dirname, 'node_modules')
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: [
          /node_modules/
        ],
        loader: 'babel-loader'
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
      extras: process.env.EXTRAS || 'pagenodes-extras'
    }
  },
  bail: false
};
