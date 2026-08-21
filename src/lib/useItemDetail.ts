'use client'

import { useEffect, useState } from 'react'
import type { ItemDetail } from './types'

/**
 * Popup bodies are fetched once per item and cached for the session — the
 * chamber payload stays primitive and rich text never ships with the page (§13.5).
 */
const cache = new Map<string, ItemDetail>()
const inflight = new Map<string, Promise<ItemDetail | null>>()

const load = async (collection: string, slug: string): Promise<ItemDetail | null> => {
  const key = `${collection}/${slug}`
  const cached = cache.get(key)
  if (cached) return cached

  const existing = inflight.get(key)
  if (existing) return existing

  const request = fetch(`/detail/${collection}/${encodeURIComponent(slug)}`, {
    headers: { accept: 'application/json' },
  })
    .then(async (res) => {
      if (!res.ok) return null
      const data = (await res.json()) as ItemDetail
      cache.set(key, data)
      return data
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, request)
  return request
}

export const useItemDetail = (collection: string, slug: string | null) => {
  const [detail, setDetail] = useState<ItemDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!slug) {
      setDetail(null)
      return
    }

    const key = `${collection}/${slug}`
    const cached = cache.get(key)
    if (cached) {
      setDetail(cached)
      setLoading(false)
      return
    }

    let active = true
    setDetail(null)
    setLoading(true)
    void load(collection, slug).then((data) => {
      if (!active) return
      setDetail(data)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [collection, slug])

  return { detail, loading }
}
