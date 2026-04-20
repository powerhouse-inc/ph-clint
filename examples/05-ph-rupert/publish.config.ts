import { definePublishConfig } from '@powerhousedao/ph-clint-dev/publish';

export default definePublishConfig({
  groups: {
    'rupert-cli': {
      version: '0.0.1',
      packages: [
        { path: '.', category: 'cli' },
      ],
    },
  },
});
