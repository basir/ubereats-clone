const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Polyfill Node's `buffer` module which react-native-svg tries to import
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  buffer: path.resolve(__dirname, 'bufferShim.js'),
};

module.exports = withNativeWind(config, { input: './global.css' });
