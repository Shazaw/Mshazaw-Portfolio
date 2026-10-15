import * as migration_20260902_021311_initial from './20260902_021311_initial';
import * as migration_20261015_103441_add_blog_posts from './20261015_103441_add_blog_posts';

export const migrations = [
  {
    up: migration_20260902_021311_initial.up,
    down: migration_20260902_021311_initial.down,
    name: '20260902_021311_initial',
  },
  {
    up: migration_20261015_103441_add_blog_posts.up,
    down: migration_20261015_103441_add_blog_posts.down,
    name: '20261015_103441_add_blog_posts'
  },
];
