import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import { seedBlog } from './blog'

const run = async () => {
  const payload = await getPayload({ config })
  await seedBlog(payload)
  process.exit(0)
}

run().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
