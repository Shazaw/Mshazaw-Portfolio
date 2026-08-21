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
} from './fields/shared'
import { revalidateCollection, revalidateCollectionDelete } from './hooks/revalidate'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: 'Project', plural: 'Projects' },
  admin: {
    useAsTitle: 'title',
    group: 'Survey',
    defaultColumns: ['title', 'year', 'weight', 'featured', 'published'],
    description: 'Builds and research. Weight decides tower height in the chamber.',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [revalidateCollection('/projects')],
    afterDelete: [revalidateCollectionDelete('/projects')],
  },
  defaultSort: '-weight',
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    summaryField,
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'text',
          required: true,
          admin: { width: '50%', description: 'e.g. ENCRYPTION, PLATFORM, RESEARCH.' },
        },
        {
          name: 'year',
          type: 'number',
          required: true,
          min: 2000,
          max: 2100,
          admin: { width: '50%' },
        },
      ],
    },
    subtagField,
    tagsField,
    {
      name: 'description',
      type: 'richText',
      admin: { description: 'Long form. Loaded lazily when the popup card opens.' },
    },
    linksField,
    { name: 'cover', type: 'upload', relationTo: 'media' },
    {
      name: 'stripArtwork',
      type: 'select',
      defaultValue: 'auto',
      options: [
        { label: 'Auto (seeded from slug)', value: 'auto' },
        { label: 'Skyline', value: 'skyline' },
        { label: 'Tower', value: 'tower' },
        { label: 'Bridge', value: 'bridge' },
        { label: 'Lattice', value: 'lattice' },
        { label: 'Radar', value: 'radar' },
        { label: 'Vault', value: 'vault' },
      ],
      admin: {
        description: 'Wireframe motif drawn in the homepage strip cell.',
      },
    },
    weightField,
    mosaicSpanField,
    featuredField,
    {
      name: 'featuredOrder',
      type: 'number',
      admin: {
        position: 'sidebar',
        description: 'Order inside the homepage strip. Lower first.',
        condition: (data) => Boolean(data?.featured),
      },
    },
    publishedField,
  ],
}
