import * as migration_20260821_175034_initial from './20260821_175034_initial';

export const migrations = [
  {
    up: migration_20260821_175034_initial.up,
    down: migration_20260821_175034_initial.down,
    name: '20260821_175034_initial'
  },
];
