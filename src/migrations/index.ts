import * as migration_20260822_023035_initial from './20260822_023035_initial';

export const migrations = [
  {
    up: migration_20260822_023035_initial.up,
    down: migration_20260822_023035_initial.down,
    name: '20260822_023035_initial'
  },
];
