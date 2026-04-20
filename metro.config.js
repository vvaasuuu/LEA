const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Force all React-family packages to resolve from the root node_modules only,
// preventing the duplicate-React problem caused by frontend/node_modules having
// its own copy of react (19.2.5) alongside the root copy (19.1.0).
const rootNodeModules = path.resolve(projectRoot, 'node_modules');

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: path.resolve(rootNodeModules, 'react'),
  'react-native': path.resolve(rootNodeModules, 'react-native'),
  'react-dom': path.resolve(rootNodeModules, 'react-dom'),
};

// Also block Metro from watching frontend/node_modules so it never
// accidentally resolves modules from there.
config.watchFolders = [projectRoot];
config.resolver.blockList = [
  /frontend[/\\]node_modules[/\\].*/,
];

module.exports = config;
