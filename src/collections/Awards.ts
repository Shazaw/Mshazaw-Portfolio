import type { CollectionConfig } from 'payload'
import {
  featuredField,
  linksField,
  mosaicSpanField,
  publishedField,
  slugField,
  subtagField,
  summaryField,
  tagsField,
  weightField,
  yearField,
} from './fields/shared'
import { revalidateCollection, revalidateCollectionDelete } from './hooks/revalidate'
import { deriveYearFromDate } from './hooks/deriveYear'

export const Awards: CollectionConfig = {
  slug: 'awards',
  labels: { singular: 'Award', plural: 'Awards' },
  admin: {
    useAsTitle: 'title',
    group: 'Survey',
    defaultColumns: ['title', 'issuer', 'placement', 'year', 'published'],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [deriveYearFromDate],
    afterChange: [revalidateCollection('/awards')],
    afterDelete: [revalidateCollectionDelete('/awards')],
  },
  defaultSort: '-weight',
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    {
      type: 'row',
      fields: [
        { name: 'issuer', type: 'text', required: true, admin: { width: '55%' } },
        {
          name: 'placement',
          type: 'text',
          admin: { width: '45%', description: 'e.g. 1ST PLACE, FINALIST, GOLD MEDAL.' },
        },
      ],
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'monthOnly', displayFormat: 'MMM yyyy' } },
    },
    {
      name: 'scope',
      type: 'select',
      defaultValue: 'national',
      options: [
        { label: 'International', value: 'international' },
        { label: 'National', value: 'national' },
        { label: 'Regional', value: 'regional' },
        { label: 'University', value: 'university' },
      ],
    },
    summaryField,
    subtagField,
    tagsField,
    { name: 'description', type: 'richText' },
    linksField,
    { name: 'media', type: 'upload', relationTo: 'media' },
    yearField,
    weightField,
    mosaicSpanField,
    featuredField,
    {
      name: 'featuredOrder',
      type: 'number',
      admin: { position: 'sidebar', condition: (data) => Boolean(data?.featured) },
    },
    publishedField,
  ],
}
