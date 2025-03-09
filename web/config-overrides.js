const webpack = require('webpack');
const path = require('path');

module.exports = function override(config) {
  // Add polyfills for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "url": require.resolve("url"),
    "buffer": require.resolve("buffer"),
    "timers": require.resolve("timers-browserify"),
    "stream": require.resolve("stream-browserify"),
    "crypto": false,
    "zlib": false,
    "path": false,
    "fs": false,
    "process": require.resolve("process/browser"),
  };

  // Add plugins
  config.plugins = [
    ...config.plugins,
    // Provide process and Buffer as globals
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    // Define process.env
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env)
    }),
  ];

  // Fix for clearCache not defined error
  config.module.rules.push({
    test: /\.js$/,
    enforce: 'pre',
    use: ['source-map-loader'],
    exclude: /node_modules/,
  });

  // Fix for process/browser resolution
  config.resolve.alias = {
    ...config.resolve.alias,
    'process/browser': require.resolve('process/browser'),
  };

  // Ignore source map warnings
  config.ignoreWarnings = [/Failed to parse source map/];

  return config;
}; 