import type { CollectionConfig } from 'payload'
import { BLOG_CATEGORIES, estimateReadingMinutes } from '@/lib/blog'
import { slugField, tagsField } from './fields/shared'
import { revalidatePost, revalidatePostDelete } from './hooks/revalidatePost'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Blog post', plural: 'Blog posts' },
  admin: {
    useAsTitle: 'title',
    group: 'Writing',
    defaultColumns: ['title', 'category', 'publishedAt', 'published'],
    description: 'Long-form technical articles, with prose, source excerpts and captioned screenshots.',
  },
  access: {
    read: ({ req }) => req.user ? true : { published: { equals: true } },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [({ data, originalDoc }) => ({
      ...data,
      readingMinutes: estimateReadingMinutes(data.sections ?? originalDoc?.sections),
    })],
    afterChange: [revalidatePost],
    afterDelete: [revalidatePostDelete],
  },
  defaultSort: '-publishedAt',
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 220 },
    slugField('title'),
    { name: 'excerpt', type: 'textarea', required: true, maxLength: 400 },
    {
      type: 'row',
      fields: [
        {
          name: 'category', type: 'select', required: true, defaultValue: 'research',
          options: Object.entries(BLOG_CATEGORIES).map(([value, label]) => ({ value, label })),
          admin: { width: '50%' },
        },
        { name: 'event', type: 'text', admin: { width: '50%', description: 'Optional, e.g. JOINTS CTF 2026.' } },
      ],
    },
    { name: 'challenge', type: 'text', admin: { description: 'Optional challenge name.' } },
    tagsField,
    { name: 'cover', type: 'upload', relationTo: 'media' },
    {
      name: 'sections', type: 'array', required: true, minRows: 1,
      admin: { initCollapsed: true, description: 'Headings automatically populate the article table of contents.' },
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'blocks', type: 'blocks', required: true, minRows: 1,
          blocks: [
            {
              slug: 'prose', interfaceName: 'BlogProse',
              fields: [{ name: 'content', type: 'richText', required: true }],
            },
            {
              slug: 'code', interfaceName: 'BlogCode',
              fields: [
                { name: 'filename', type: 'text', admin: { description: 'Source filename or a descriptive label.' } },
                {
                  name: 'language', type: 'select', required: true, defaultValue: 'text',
                  options: ['text', 'php', 'apacheconf', 'python', 'c', 'bash', 'http', 'json'],
                },
                { name: 'code', type: 'textarea', required: true },
                { name: 'caption', type: 'textarea' },
              ],
            },
            {
              slug: 'image', interfaceName: 'BlogImage',
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                { name: 'caption', type: 'textarea', required: true },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'references', type: 'array', admin: { initCollapsed: true },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    { name: 'publishedAt', type: 'date', required: true, defaultValue: () => new Date().toISOString(), admin: { position: 'sidebar' } },
    { name: 'readingMinutes', type: 'number', admin: { position: 'sidebar', readOnly: true } },
    { name: 'published', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
  ],
}
