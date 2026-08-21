import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import config from '../payload.config'
import { projects } from './projects'
import { awards, experiences, organizations, profileSeed } from './records'
import { challenges, competitions } from './ctf'

/**
 * Idempotent seed. Documents are matched by slug: existing ones are updated in
 * place, new ones created. `--fresh` wipes the survey collections first.
 *
 * Everything it writes is PLACEHOLDER CONTENT derived from the approved
 * prototype — verify and rewrite it at /admin before publishing.
 */

const FRESH = process.argv.includes('--fresh')

type AnyCollection =
  | 'projects'
  | 'experiences'
  | 'organizations'
  | 'awards'
  | 'ctf-competitions'
  | 'ctf-challenges'

const upsert = async (
  payload: Payload,
  collection: AnyCollection,
  slug: string,
  data: Record<string, unknown>,
): Promise<string | number> => {
  const existing = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })

  if (existing.docs[0]) {
    const updated = await payload.update({
      collection,
      id: existing.docs[0].id,
      data: data as never,
      depth: 0,
    })
    return updated.id
  }

  const created = await payload.create({
    collection,
    data: { ...data, slug } as never,
    depth: 0,
  })
  // Return the id exactly as the adapter produced it. SQLite ids are numbers
  // and relationship validation rejects the string form, so never coerce here.
  return created.id
}

const wipe = async (payload: Payload) => {
  const collections: AnyCollection[] = [
    'ctf-challenges',
    'ctf-competitions',
    'projects',
    'experiences',
    'organizations',
    'awards',
  ]
  for (const collection of collections) {
    await payload.delete({ collection, where: { id: { exists: true } } })
    console.log(`  wiped ${collection}`)
  }
}

const ensureAdmin = async (payload: Payload) => {
  const existing = await payload.find({ collection: 'users', limit: 1, depth: 0 })
  if (existing.totalDocs > 0) {
    console.log('  admin user already exists — leaving it alone')
    return
  }

  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!email || !password) {
    console.log('  SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — create the first user at /admin')
    return
  }

  await payload.create({
    collection: 'users',
    data: { email, password, name: profileSeed.name },
  })
  console.log(`  created admin user ${email}`)
}

const run = async () => {
  const payload = await getPayload({ config })

  console.log('\nHOLOGRID seed')
  console.log('─'.repeat(60))

  if (FRESH) {
    console.log('· wiping survey collections')
    await wipe(payload)
  }

  console.log('· users')
  await ensureAdmin(payload)

  console.log('· profile global')
  await payload.updateGlobal({ slug: 'profile', data: profileSeed as never, depth: 0 })

  console.log('· projects')
  for (const project of projects) {
    const { slug, ...rest } = project
    await upsert(payload, 'projects', slug, { ...rest, published: true })
  }
  console.log(`  ${projects.length} projects`)

  console.log('· experiences')
  for (const experience of experiences) {
    const { slug, highlights, ...rest } = experience
    await upsert(payload, 'experiences', slug, {
      ...rest,
      highlights: highlights.map((text) => ({ text })),
      published: true,
    })
  }
  console.log(`  ${experiences.length} experiences`)

  console.log('· organizations')
  for (const organization of organizations) {
    const { slug, highlights, ...rest } = organization
    await upsert(payload, 'organizations', slug, {
      ...rest,
      highlights: highlights.map((text) => ({ text })),
      published: true,
    })
  }
  console.log(`  ${organizations.length} organizations`)

  console.log('· awards')
  for (const award of awards) {
    const { slug, ...rest } = award
    await upsert(payload, 'awards', slug, { ...rest, published: true })
  }
  console.log(`  ${awards.length} awards`)

  console.log('· ctf competitions')
  // SQLite hands out numeric ids; relationships must receive them unchanged.
  const competitionIds = new Map<string, string | number>()
  for (const competition of competitions) {
    const { slug, ...rest } = competition
    competitionIds.set(slug, await upsert(payload, 'ctf-competitions', slug, { ...rest, published: true }))
  }
  console.log(`  ${competitions.length} competitions`)

  console.log('· ctf challenges')
  for (const challenge of challenges) {
    const { slug, competition, ...rest } = challenge
    const competitionId = competitionIds.get(competition)
    if (!competitionId) {
      console.warn(`  ! unknown competition "${competition}" for challenge "${slug}" — skipped`)
      continue
    }
    await upsert(payload, 'ctf-challenges', slug, {
      ...rest,
      competition: competitionId,
      published: true,
    })
  }
  console.log(`  ${challenges.length} challenges`)

  console.log('─'.repeat(60))
  console.log('Seed complete.')
  console.log('NOTE: every record above is PLACEHOLDER content. Verify and rewrite it at /admin.\n')

  process.exit(0)
}

run().catch((error: unknown) => {
  console.error('\nSeed failed.')
  // Payload validation errors carry the useful part in `data.errors`; the
  // top-level message only names the first offending field.
  const detail = (error as { data?: { errors?: unknown[]; collection?: string } })?.data
  if (detail?.errors) {
    console.error(`collection: ${detail.collection}`)
    console.error(JSON.stringify(detail.errors, null, 2))
  }
  console.error(error)
  process.exit(1)
})
