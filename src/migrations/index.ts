import * as migration_20260901_141856_initial from './20260901_141856_initial';

export const migrations = [
  {
    up: migration_20260901_141856_initial.up,
    down: migration_20260901_141856_initial.down,
    name: '20260901_141856_initial'
  },
];
