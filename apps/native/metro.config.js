// Metro config so the native app can resolve the shared monorepo packages
// (@nekko/journal-core, @nekko/journal-shared) from ../../packages while it
// lives outside the web npm workspace.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root so edits to packages/* hot-reload.
config.watchFolders = [monorepoRoot];

// Resolve modules from the native app first, then the monorepo root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
