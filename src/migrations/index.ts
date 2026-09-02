import * as migration_20260902_021311_initial from './20260902_021311_initial';

export const migrations = [
  {
    up: migration_20260902_021311_initial.up,
    down: migration_20260902_021311_initial.down,
    name: '20260902_021311_initial'
  },
];
