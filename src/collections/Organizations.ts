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
import { deriveYear } from './hooks/deriveYear'

export const Organizations: CollectionConfig = {
  slug: 'organizations',
  labels: { singular: 'Organization', plural: 'Organizations' },
  admin: {
    useAsTitle: 'title',
    group: 'Survey',
    defaultColumns: ['title', 'role', 'year', 'weight', 'published'],
    description: 'Societies, chapters and student bodies. `title` is the organization.',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [deriveYear],
    afterChange: [revalidateCollection('/organizations')],
    afterDelete: [revalidateCollectionDelete('/organizations')],
  },
  defaultSort: '-weight',
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Organization' },
    slugField('title'),
    { name: 'role', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          admin: { width: '34%', date: { pickerAppearance: 'monthOnly', displayFormat: 'MMM yyyy' } },
        },
        {
          name: 'endDate',
          type: 'date',
          admin: {
            width: '33%',
            date: { pickerAppearance: 'monthOnly', displayFormat: 'MMM yyyy' },
            condition: (data) => !data?.current,
          },
        },
        { name: 'current', type: 'checkbox', label: 'Ongoing', admin: { width: '33%' } },
      ],
    },
    summaryField,
    subtagField,
    tagsField,
    {
      name: 'highlights',
      type: 'array',
      labels: { singular: 'Highlight', plural: 'Highlights' },
      admin: { initCollapsed: true },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    { name: 'description', type: 'richText' },
    linksField,
    { name: 'logo', type: 'upload', relationTo: 'media' },
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
