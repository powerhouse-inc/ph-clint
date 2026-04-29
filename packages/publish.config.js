// Publish config for the ph-clint framework itself (bootstrapping).
// No import needed — definePublishConfig is an identity function.
export default {
  groups: {
    'ph-clint': {
      version: '0.1.0',
      packages: [
        { path: 'ph-clint', category: 'lib' },
        { path: 'ph-clint-dev', category: 'lib' },
        { path: 'ph-clint-cli/ph-clint-app', category: 'app' },
        { path: 'ph-clint-cli/ph-clint-cli', category: 'cli' },
      ],
    },
  },
};
