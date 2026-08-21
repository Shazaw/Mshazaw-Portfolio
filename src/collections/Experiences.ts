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

export const Experiences: CollectionConfig = {
  slug: 'experiences',
  labels: { singular: 'Experience', plural: 'Experience' },
  admin: {
    useAsTitle: 'title',
    group: 'Survey',
    defaultColumns: ['title', 'organization', 'year', 'weight', 'published'],
    description: 'Roles held. `title` is the role, e.g. Security Engineering Intern.',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [deriveYear],
    afterChange: [revalidateCollection('/experience')],
    afterDelete: [revalidateCollectionDelete('/experience')],
  },
  defaultSort: '-weight',
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Role' },
    slugField('title'),
    {
      type: 'row',
      fields: [
        { name: 'organization', type: 'text', required: true, admin: { width: '60%' } },
        { name: 'location', type: 'text', admin: { width: '40%' } },
      ],
    },
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
    {
      name: 'employmentType',
      type: 'select',
      defaultValue: 'internship',
      options: [
        { label: 'Internship', value: 'internship' },
        { label: 'Part time', value: 'part-time' },
        { label: 'Freelance / Consulting', value: 'freelance' },
        { label: 'Research', value: 'research' },
        { label: 'Assistantship', value: 'assistantship' },
        { label: 'Volunteer', value: 'volunteer' },
      ],
    },
    summaryField,
    subtagField,
    tagsField,
    {
      name: 'highlights',
      type: 'array',
      labels: { singular: 'Highlight', plural: 'Highlights' },
      admin: { initCollapsed: true, description: 'Bullet outcomes shown in the popup card.' },
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
      admin: {
        position: 'sidebar',
        condition: (data) => Boolean(data?.featured),
      },
    },
    publishedField,
  ],
}
