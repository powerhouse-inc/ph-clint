import { definePublishConfig } from '@powerhousedao/ph-clint-dev/publish';

export default definePublishConfig({
  groups: {
    'connect-agent': {
      version: '0.0.1',
      packages: [
        { path: 'agent-app', category: 'app' },
        { path: 'agent-cli', category: 'cli' },
      ],
    },
  },
});
