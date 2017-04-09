var fs = require('fs');
var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: path.join(__dirname, 'lib/browser.js'),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'tinyget.js',
    library: 'Tinyget',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  node: {
    console: false,
    global: false,
    process: false,
    Buffer: false,
    setImmediate: false
  },
  devtool: 'source-map'
};

