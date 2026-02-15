const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@': path.join(projectRoot, 'src'),
};

module.exports = config;
