import type { CollectionConfig } from 'payload'
import { linksField, publishedField, slugField, subtagField, summaryField, tagsField } from './fields/shared'
import { revalidateCtf } from './hooks/revalidate'
import { deriveYearFromDate } from './hooks/deriveYear'

export const CtfCompetitions: CollectionConfig = {
  slug: 'ctf-competitions',
  labels: { singular: 'CTF Competition', plural: 'CTF Competitions' },
  admin: {
    useAsTitle: 'title',
    group: 'CTF',
    defaultColumns: ['title', 'organizer', 'date', 'placement', 'published'],
    description: 'One entry per event. Challenges attach to these.',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [deriveYearFromDate],
    afterChange: [
      ({ doc }) => {
        revalidateCtf(doc?.slug)
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        revalidateCtf(doc?.slug)
        return doc
      },
    ],
  },
  defaultSort: '-date',
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Competition' },
    slugField('title'),
    {
      type: 'row',
      fields: [
        { name: 'organizer', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'team', type: 'text', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
          admin: { width: '50%', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd MMM yyyy' } },
        },
        {
          name: 'placement',
          type: 'text',
          admin: { width: '50%', description: 'e.g. 3RD / 412 TEAMS. Leave blank if not placed.' },
        },
      ],
    },
    {
      name: 'format',
      type: 'select',
      defaultValue: 'jeopardy',
      options: [
        { label: 'Jeopardy', value: 'jeopardy' },
        { label: 'Attack / Defense', value: 'attack-defense' },
        { label: 'King of the Hill', value: 'koth' },
        { label: 'Mixed', value: 'mixed' },
      ],
    },
    summaryField,
    subtagField,
    tagsField,
    { name: 'description', type: 'richText' },
    linksField,
    { name: 'logo', type: 'upload', relationTo: 'media' },
    {
      name: 'year',
      type: 'number',
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'weight',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 5,
      admin: { position: 'sidebar', description: '1-5. Orders the competition mosaic.' },
    },
    publishedField,
  ],
}
