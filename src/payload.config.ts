import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Projects } from './collections/Projects'
import { Experiences } from './collections/Experiences'
import { Organizations } from './collections/Organizations'
import { Awards } from './collections/Awards'
import { CtfCompetitions } from './collections/CtfCompetitions'
import { CtfChallenges } from './collections/CtfChallenges'
import { Profile } from './globals/Profile'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · HOLOGRID',
    },
  },
  collections: [Projects, Experiences, Organizations, Awards, CtfCompetitions, CtfChallenges, Media, Users],
  globals: [Profile],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || 'file:./data/holo-grid.db',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Schema push is a development convenience. Production runs the checked-in
    // migrations instead (`npm run migrate`), which is also what the container
    // does on start — a mounted volume gets its schema on first boot.
    push: process.env.NODE_ENV !== 'production',
  }),
  sharp,
  graphQL: {
    disable: false,
  },
  telemetry: false,
})
