import type { CollectionConfig } from 'payload'
import { publishedField, slugField, tagsField } from './fields/shared'
import { revalidateCtf } from './hooks/revalidate'
import { CTF_CATEGORIES, CTF_DIFFICULTIES } from '@/lib/ctf'

/**
 * A challenge belongs to exactly one competition and exactly one mode.
 * `mode` is what drives the SOLVED | AUTHORED split across the whole CTF area —
 * category and competition mosaics only ever show buckets that are non-empty
 * for the active mode.
 */
export const CtfChallenges: CollectionConfig = {
  slug: 'ctf-challenges',
  labels: { singular: 'CTF Challenge', plural: 'CTF Challenges' },
  admin: {
    useAsTitle: 'title',
    group: 'CTF',
    defaultColumns: ['title', 'competition', 'mode', 'category', 'difficulty', 'points'],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        const competitionId = typeof doc.competition === 'object' ? doc.competition?.id : doc.competition
        let slug: string | undefined
        if (competitionId) {
          try {
            const comp = await req.payload.findByID({
              collection: 'ctf-competitions',
              id: competitionId,
              depth: 0,
            })
            slug = comp?.slug ?? undefined
          } catch {
            /* competition may have been removed in the same request */
          }
        }
        revalidateCtf(slug)
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        revalidateCtf()
        return doc
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    {
      type: 'row',
      fields: [
        {
          name: 'competition',
          type: 'relationship',
          relationTo: 'ctf-competitions',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'mode',
          type: 'select',
          required: true,
          defaultValue: 'solved',
          options: [
            { label: 'Solved', value: 'solved' },
            { label: 'Authored', value: 'authored' },
          ],
          admin: { width: '50%', description: 'Which side of the board.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'select',
          required: true,
          options: CTF_CATEGORIES.map((c) => ({ label: c.label, value: c.value })),
          admin: { width: '34%' },
        },
        {
          name: 'difficulty',
          type: 'select',
          required: true,
          defaultValue: 'medium',
          options: CTF_DIFFICULTIES.map((d) => ({ label: d.label, value: d.value })),
          admin: { width: '33%' },
        },
        { name: 'points', type: 'number', min: 0, admin: { width: '33%' } },
      ],
    },
    {
      name: 'solves',
      type: 'number',
      min: 0,
      admin: {
        description: 'How many teams solved it. Authored challenges only.',
        condition: (data) => data?.mode === 'authored',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      maxLength: 180,
      admin: { description: 'One line shown in the challenge row.' },
    },
    tagsField,
    {
      name: 'writeup',
      type: 'richText',
      admin: { description: 'Write-up body. Loaded lazily when the popup opens.' },
    },
    { name: 'externalUrl', type: 'text', admin: { description: 'Off-site write-up or source.' } },
    {
      name: 'attachments',
      type: 'array',
      labels: { singular: 'Attachment', plural: 'Attachments' },
      admin: { initCollapsed: true },
      fields: [{ name: 'file', type: 'upload', relationTo: 'media', required: true }],
    },
    publishedField,
  ],
}
