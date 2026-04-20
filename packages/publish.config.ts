import { definePublishConfig } from './ph-clint-dev/src/publish/index.js';

export default definePublishConfig({
  groups: {
    'ph-clint': {
      version: '0.1.0',
      packages: [
        { path: 'ph-clint', category: 'lib' },
        { path: 'ph-clint-dev', category: 'lib' },
      ],
    },
    'ph-clint-cli': {
      version: '0.1.0',
      packages: [
        { path: 'ph-clint-cli/ph-clint-app', category: 'app' },
        { path: 'ph-clint-cli/ph-clint-cli', category: 'cli' },
      ],
    },
  },
});
