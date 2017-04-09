var fs = require('fs');
var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: {
    app: path.join(__dirname, 'docs/src/index.js')
  },
  output: {
    path: path.join(__dirname, 'docs/js'),
    filename: '[name].js',
  },
  resolve: {
    alias: {
      tinyget: __dirname
    }
  },
  devtool: 'source-map'
};
