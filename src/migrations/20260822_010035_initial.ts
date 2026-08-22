import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`projects_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`projects_links_order_idx\` ON \`projects_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`projects_links_parent_id_idx\` ON \`projects_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`projects\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text,
  	\`summary\` text NOT NULL,
  	\`category\` text NOT NULL,
  	\`year\` numeric NOT NULL,
  	\`subtag\` text,
  	\`description\` text,
  	\`repo_url\` text,
  	\`live_url\` text,
  	\`role\` text,
  	\`screenshot_id\` integer,
  	\`strip_artwork\` text DEFAULT 'auto',
  	\`weight\` numeric DEFAULT 3 NOT NULL,
  	\`mosaic_span\` text DEFAULT 'auto',
  	\`featured\` integer DEFAULT false,
  	\`featured_order\` numeric,
  	\`published\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`screenshot_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`projects_slug_idx\` ON \`projects\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`projects_screenshot_idx\` ON \`projects\` (\`screenshot_id\`);`)
  await db.run(sql`CREATE INDEX \`projects_updated_at_idx\` ON \`projects\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`projects_created_at_idx\` ON \`projects\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`projects_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`projects_texts_order_parent\` ON \`projects_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`experiences_highlights\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`experiences\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`experiences_highlights_order_idx\` ON \`experiences_highlights\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`experiences_highlights_parent_id_idx\` ON \`experiences_highlights\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`experiences_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`experiences\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`experiences_links_order_idx\` ON \`experiences_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`experiences_links_parent_id_idx\` ON \`experiences_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`experiences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text,
  	\`organization\` text NOT NULL,
  	\`location\` text,
  	\`start_date\` text NOT NULL,
  	\`end_date\` text,
  	\`current\` integer,
  	\`employment_type\` text DEFAULT 'internship',
  	\`summary\` text NOT NULL,
  	\`subtag\` text,
  	\`description\` text,
  	\`logo_id\` integer,
  	\`year\` numeric,
  	\`weight\` numeric DEFAULT 3 NOT NULL,
  	\`mosaic_span\` text DEFAULT 'auto',
  	\`featured\` integer DEFAULT false,
  	\`featured_order\` numeric,
  	\`published\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`experiences_slug_idx\` ON \`experiences\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`experiences_logo_idx\` ON \`experiences\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`experiences_year_idx\` ON \`experiences\` (\`year\`);`)
  await db.run(sql`CREATE INDEX \`experiences_updated_at_idx\` ON \`experiences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`experiences_created_at_idx\` ON \`experiences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`experiences_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`experiences\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`experiences_texts_order_parent\` ON \`experiences_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`organizations_highlights\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`organizations\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`organizations_highlights_order_idx\` ON \`organizations_highlights\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`organizations_highlights_parent_id_idx\` ON \`organizations_highlights\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`organizations_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`organizations\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`organizations_links_order_idx\` ON \`organizations_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`organizations_links_parent_id_idx\` ON \`organizations_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`organizations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text,
  	\`role\` text NOT NULL,
  	\`start_date\` text NOT NULL,
  	\`end_date\` text,
  	\`current\` integer,
  	\`summary\` text NOT NULL,
  	\`subtag\` text,
  	\`description\` text,
  	\`logo_id\` integer,
  	\`year\` numeric,
  	\`weight\` numeric DEFAULT 3 NOT NULL,
  	\`mosaic_span\` text DEFAULT 'auto',
  	\`featured\` integer DEFAULT false,
  	\`featured_order\` numeric,
  	\`published\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`organizations_slug_idx\` ON \`organizations\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`organizations_logo_idx\` ON \`organizations\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`organizations_year_idx\` ON \`organizations\` (\`year\`);`)
  await db.run(sql`CREATE INDEX \`organizations_updated_at_idx\` ON \`organizations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`organizations_created_at_idx\` ON \`organizations\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`organizations_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`organizations\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`organizations_texts_order_parent\` ON \`organizations_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`awards_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`awards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`awards_links_order_idx\` ON \`awards_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`awards_links_parent_id_idx\` ON \`awards_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`awards\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text,
  	\`issuer\` text NOT NULL,
  	\`placement\` text,
  	\`date\` text NOT NULL,
  	\`scope\` text DEFAULT 'national',
  	\`summary\` text NOT NULL,
  	\`subtag\` text,
  	\`description\` text,
  	\`media_id\` integer,
  	\`year\` numeric,
  	\`weight\` numeric DEFAULT 3 NOT NULL,
  	\`mosaic_span\` text DEFAULT 'auto',
  	\`featured\` integer DEFAULT false,
  	\`featured_order\` numeric,
  	\`published\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`awards_slug_idx\` ON \`awards\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`awards_media_idx\` ON \`awards\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`awards_year_idx\` ON \`awards\` (\`year\`);`)
  await db.run(sql`CREATE INDEX \`awards_updated_at_idx\` ON \`awards\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`awards_created_at_idx\` ON \`awards\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`awards_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`awards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`awards_texts_order_parent\` ON \`awards_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`ctf_competitions_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`ctf_competitions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`ctf_competitions_links_order_idx\` ON \`ctf_competitions_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`ctf_competitions_links_parent_id_idx\` ON \`ctf_competitions_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`ctf_competitions\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text,
  	\`organizer\` text NOT NULL,
  	\`team\` text,
  	\`date\` text NOT NULL,
  	\`placement\` text,
  	\`format\` text DEFAULT 'jeopardy',
  	\`summary\` text NOT NULL,
  	\`subtag\` text,
  	\`description\` text,
  	\`logo_id\` integer,
  	\`year\` numeric,
  	\`weight\` numeric DEFAULT 3,
  	\`published\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`ctf_competitions_slug_idx\` ON \`ctf_competitions\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`ctf_competitions_logo_idx\` ON \`ctf_competitions\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`ctf_competitions_year_idx\` ON \`ctf_competitions\` (\`year\`);`)
  await db.run(sql`CREATE INDEX \`ctf_competitions_updated_at_idx\` ON \`ctf_competitions\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`ctf_competitions_created_at_idx\` ON \`ctf_competitions\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`ctf_competitions_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`ctf_competitions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`ctf_competitions_texts_order_parent\` ON \`ctf_competitions_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`ctf_challenges_attachments\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`file_id\` integer NOT NULL,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`ctf_challenges\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`ctf_challenges_attachments_order_idx\` ON \`ctf_challenges_attachments\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`ctf_challenges_attachments_parent_id_idx\` ON \`ctf_challenges_attachments\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`ctf_challenges_attachments_file_idx\` ON \`ctf_challenges_attachments\` (\`file_id\`);`)
  await db.run(sql`CREATE TABLE \`ctf_challenges\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text,
  	\`competition_id\` integer NOT NULL,
  	\`mode\` text DEFAULT 'solved' NOT NULL,
  	\`category\` text NOT NULL,
  	\`difficulty\` text DEFAULT 'medium' NOT NULL,
  	\`points\` numeric,
  	\`solves\` numeric,
  	\`summary\` text,
  	\`writeup\` text,
  	\`external_url\` text,
  	\`published\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`competition_id\`) REFERENCES \`ctf_competitions\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`ctf_challenges_slug_idx\` ON \`ctf_challenges\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`ctf_challenges_competition_idx\` ON \`ctf_challenges\` (\`competition_id\`);`)
  await db.run(sql`CREATE INDEX \`ctf_challenges_updated_at_idx\` ON \`ctf_challenges\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`ctf_challenges_created_at_idx\` ON \`ctf_challenges\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`ctf_challenges_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`ctf_challenges\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`ctf_challenges_texts_order_parent\` ON \`ctf_challenges_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text NOT NULL,
  	\`caption\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric,
  	\`sizes_thumbnail_url\` text,
  	\`sizes_thumbnail_width\` numeric,
  	\`sizes_thumbnail_height\` numeric,
  	\`sizes_thumbnail_mime_type\` text,
  	\`sizes_thumbnail_filesize\` numeric,
  	\`sizes_thumbnail_filename\` text,
  	\`sizes_card_url\` text,
  	\`sizes_card_width\` numeric,
  	\`sizes_card_height\` numeric,
  	\`sizes_card_mime_type\` text,
  	\`sizes_card_filesize\` numeric,
  	\`sizes_card_filename\` text,
  	\`sizes_og_url\` text,
  	\`sizes_og_width\` numeric,
  	\`sizes_og_height\` numeric,
  	\`sizes_og_mime_type\` text,
  	\`sizes_og_filesize\` numeric,
  	\`sizes_og_filename\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_thumbnail_sizes_thumbnail_filename_idx\` ON \`media\` (\`sizes_thumbnail_filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_card_sizes_card_filename_idx\` ON \`media\` (\`sizes_card_filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_og_sizes_og_filename_idx\` ON \`media\` (\`sizes_og_filename\`);`)
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
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
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`profile_focus_areas\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`body\` text NOT NULL,
  	\`tag\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`profile\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`profile_focus_areas_order_idx\` ON \`profile_focus_areas\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`profile_focus_areas_parent_id_idx\` ON \`profile_focus_areas\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`profile_skills\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`group\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`profile\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`profile_skills_order_idx\` ON \`profile_skills\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`profile_skills_parent_id_idx\` ON \`profile_skills\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`profile_education\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`institution\` text NOT NULL,
  	\`program\` text NOT NULL,
  	\`period\` text NOT NULL,
  	\`detail\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`profile\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`profile_education_order_idx\` ON \`profile_education\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`profile_education_parent_id_idx\` ON \`profile_education\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`profile_socials\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`profile\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`profile_socials_order_idx\` ON \`profile_socials\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`profile_socials_parent_id_idx\` ON \`profile_socials\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`profile\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text DEFAULT 'M. Ahsan Zaki Wiryawan' NOT NULL,
  	\`initials\` text DEFAULT 'AZW',
  	\`hero_line_one\` text DEFAULT 'M. AHSAN ZAKI' NOT NULL,
  	\`hero_line_two\` text DEFAULT 'WIRYAWAN' NOT NULL,
  	\`tagline\` text NOT NULL,
  	\`role\` text DEFAULT 'CS undergraduate · cybersecurity',
  	\`portrait_id\` integer,
  	\`about_intro\` text,
  	\`about\` text,
  	\`email\` text DEFAULT 'ahsan.wiryawan@gmail.com' NOT NULL,
  	\`location\` text DEFAULT 'Yogyakarta, ID',
  	\`coordinates\` text DEFAULT '07°46′S 110°22′E · UGM',
  	\`cv_url\` text,
  	\`cv_file_id\` integer,
  	\`site_title\` text DEFAULT 'M. Ahsan Zaki Wiryawan',
  	\`site_description\` text DEFAULT 'Portfolio of M. Ahsan Zaki Wiryawan — computer science undergraduate at UGM, cybersecurity concentration.',
  	\`og_image_id\` integer,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`portrait_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`cv_file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`profile_portrait_idx\` ON \`profile\` (\`portrait_id\`);`)
  await db.run(sql`CREATE INDEX \`profile_cv_file_idx\` ON \`profile\` (\`cv_file_id\`);`)
  await db.run(sql`CREATE INDEX \`profile_og_image_idx\` ON \`profile\` (\`og_image_id\`);`)
  await db.run(sql`CREATE TABLE \`profile_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`profile\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`profile_texts_order_parent\` ON \`profile_texts\` (\`order\`,\`parent_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`projects_links\`;`)
  await db.run(sql`DROP TABLE \`projects\`;`)
  await db.run(sql`DROP TABLE \`projects_texts\`;`)
  await db.run(sql`DROP TABLE \`experiences_highlights\`;`)
  await db.run(sql`DROP TABLE \`experiences_links\`;`)
  await db.run(sql`DROP TABLE \`experiences\`;`)
  await db.run(sql`DROP TABLE \`experiences_texts\`;`)
  await db.run(sql`DROP TABLE \`organizations_highlights\`;`)
  await db.run(sql`DROP TABLE \`organizations_links\`;`)
  await db.run(sql`DROP TABLE \`organizations\`;`)
  await db.run(sql`DROP TABLE \`organizations_texts\`;`)
  await db.run(sql`DROP TABLE \`awards_links\`;`)
  await db.run(sql`DROP TABLE \`awards\`;`)
  await db.run(sql`DROP TABLE \`awards_texts\`;`)
  await db.run(sql`DROP TABLE \`ctf_competitions_links\`;`)
  await db.run(sql`DROP TABLE \`ctf_competitions\`;`)
  await db.run(sql`DROP TABLE \`ctf_competitions_texts\`;`)
  await db.run(sql`DROP TABLE \`ctf_challenges_attachments\`;`)
  await db.run(sql`DROP TABLE \`ctf_challenges\`;`)
  await db.run(sql`DROP TABLE \`ctf_challenges_texts\`;`)
  await db.run(sql`DROP TABLE \`media\`;`)
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
  await db.run(sql`DROP TABLE \`profile_focus_areas\`;`)
  await db.run(sql`DROP TABLE \`profile_skills\`;`)
  await db.run(sql`DROP TABLE \`profile_education\`;`)
  await db.run(sql`DROP TABLE \`profile_socials\`;`)
  await db.run(sql`DROP TABLE \`profile\`;`)
  await db.run(sql`DROP TABLE \`profile_texts\`;`)
}
