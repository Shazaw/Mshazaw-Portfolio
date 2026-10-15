import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`posts_blocks_prose\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`_path\` text NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`content\` text NOT NULL,
    \`block_name\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`posts_blocks_prose_order_idx\` ON \`posts_blocks_prose\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`posts_blocks_prose_parent_id_idx\` ON \`posts_blocks_prose\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`posts_blocks_prose_path_idx\` ON \`posts_blocks_prose\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`posts_blocks_code\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`_path\` text NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`filename\` text,
    \`language\` text DEFAULT 'text' NOT NULL,
    \`code\` text NOT NULL,
    \`caption\` text,
    \`block_name\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`posts_blocks_code_order_idx\` ON \`posts_blocks_code\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`posts_blocks_code_parent_id_idx\` ON \`posts_blocks_code\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`posts_blocks_code_path_idx\` ON \`posts_blocks_code\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`posts_blocks_image\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`_path\` text NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`image_id\` integer NOT NULL,
    \`caption\` text NOT NULL,
    \`block_name\` text,
    FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`posts_blocks_image_order_idx\` ON \`posts_blocks_image\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`posts_blocks_image_parent_id_idx\` ON \`posts_blocks_image\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`posts_blocks_image_path_idx\` ON \`posts_blocks_image\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`posts_blocks_image_image_idx\` ON \`posts_blocks_image\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`posts_sections\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`title\` text NOT NULL,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`posts_sections_order_idx\` ON \`posts_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`posts_sections_parent_id_idx\` ON \`posts_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`posts_references\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`label\` text NOT NULL,
    \`url\` text NOT NULL,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`posts_references_order_idx\` ON \`posts_references\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`posts_references_parent_id_idx\` ON \`posts_references\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`posts\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`title\` text NOT NULL,
    \`slug\` text,
    \`excerpt\` text NOT NULL,
    \`category\` text DEFAULT 'research' NOT NULL,
    \`event\` text,
    \`challenge\` text,
    \`cover_id\` integer,
    \`published_at\` text NOT NULL,
    \`reading_minutes\` numeric,
    \`published\` integer DEFAULT false,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    FOREIGN KEY (\`cover_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`posts_slug_idx\` ON \`posts\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`posts_cover_idx\` ON \`posts\` (\`cover_id\`);`)
  await db.run(sql`CREATE INDEX \`posts_updated_at_idx\` ON \`posts\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`posts_created_at_idx\` ON \`posts\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`posts_texts\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`order\` integer NOT NULL,
    \`parent_id\` integer NOT NULL,
    \`path\` text NOT NULL,
    \`text\` text,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`posts_texts_order_parent\` ON \`posts_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`posts_id\` integer REFERENCES posts(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`posts_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`posts_blocks_prose\`;`)
  await db.run(sql`DROP TABLE \`posts_blocks_code\`;`)
  await db.run(sql`DROP TABLE \`posts_blocks_image\`;`)
  await db.run(sql`DROP TABLE \`posts_sections\`;`)
  await db.run(sql`DROP TABLE \`posts_references\`;`)
  await db.run(sql`DROP TABLE \`posts\`;`)
  await db.run(sql`DROP TABLE \`posts_texts\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`order\` integer,
    \`parent_id\` integer NOT NULL,
    \`path\` text NOT NULL,
    \`projects_id\` integer,
    \`experiences_id\` integer,
    \`organizations_id\` integer,
    \`awards_id\` integer,
    \`ctf_competitions_id\` integer,
    \`ctf_challenges_id\` integer,
    \`media_id\` integer,
    \`users_id\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`projects_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`experiences_id\`) REFERENCES \`experiences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`organizations_id\`) REFERENCES \`organizations\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`awards_id\`) REFERENCES \`awards\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`ctf_competitions_id\`) REFERENCES \`ctf_competitions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`ctf_challenges_id\`) REFERENCES \`ctf_challenges\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "projects_id", "experiences_id", "organizations_id", "awards_id", "ctf_competitions_id", "ctf_challenges_id", "media_id", "users_id") SELECT "id", "order", "parent_id", "path", "projects_id", "experiences_id", "organizations_id", "awards_id", "ctf_competitions_id", "ctf_challenges_id", "media_id", "users_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_projects_id_idx\` ON \`payload_locked_documents_rels\` (\`projects_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_experiences_id_idx\` ON \`payload_locked_documents_rels\` (\`experiences_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_organizations_id_idx\` ON \`payload_locked_documents_rels\` (\`organizations_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_awards_id_idx\` ON \`payload_locked_documents_rels\` (\`awards_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_ctf_competitions_id_idx\` ON \`payload_locked_documents_rels\` (\`ctf_competitions_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_ctf_challenges_id_idx\` ON \`payload_locked_documents_rels\` (\`ctf_challenges_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
}
