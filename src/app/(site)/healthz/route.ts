import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

/** Liveness + database reachability, for the container healthcheck. */
export const dynamic = 'force-dynamic'

export const GET = async () => {
  try {
    const payload = await getPayloadClient()
    await payload.count({ collection: 'projects' })
    return NextResponse.json({ status: 'ok', db: 'ok' })
  } catch {
    return NextResponse.json({ status: 'degraded', db: 'unreachable' }, { status: 503 })
  }
}
