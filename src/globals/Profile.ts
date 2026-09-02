import type { GlobalConfig } from 'payload'
import { revalidateGlobal } from '@/collections/hooks/revalidate'

export const Profile: GlobalConfig = {
  slug: 'profile',
  label: 'Profile & Site',
  admin: {
    group: 'System',
    description: 'Everything the site says about you outside the survey collections.',
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [revalidateGlobal('/projects', '/experience', '/organizations', '/awards', '/ctf')],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Identity',
          fields: [
            { name: 'name', type: 'text', required: true, defaultValue: 'M. Ahsan Zaki Wiryawan' },
            {
              name: 'initials',
              type: 'text',
              maxLength: 4,
              defaultValue: 'AZW',
              admin: { description: 'Used in the OG image and tab title.' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'heroLineOne',
                  type: 'text',
                  required: true,
                  defaultValue: 'M. AHSAN ZAKI',
                  admin: { width: '50%', description: 'First hero line, solid ink.' },
                },
                {
                  name: 'heroLineTwo',
                  type: 'text',
                  required: true,
                  defaultValue: 'WIRYAWAN',
                  admin: { width: '50%', description: 'Second hero line, outlined cyan stroke.' },
                },
              ],
            },
            {
              name: 'heroAccentWord',
              type: 'text',
              defaultValue: 'AHSAN',
              admin: {
                description:
                  'The one word in the hero drawn as an outlined cyan stroke. Must appear in one of the two lines above.',
              },
            },
            {
              name: 'tagline',
              type: 'textarea',
              required: true,
              maxLength: 260,
              admin: { description: 'The paragraph under the hero.' },
            },
            {
              name: 'role',
              type: 'text',
              defaultValue: 'CS undergraduate · cybersecurity',
              admin: { description: 'Short role line for metadata and the OG image.' },
            },
            { name: 'portrait', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          label: 'About',
          fields: [
            {
              name: 'aboutIntro',
              type: 'textarea',
              maxLength: 400,
              admin: { description: 'Lead paragraph of the homepage About chapter, set larger than the body.' },
            },
            {
              name: 'about',
              type: 'richText',
              admin: { description: 'The rest of the About chapter, under the lead paragraph.' },
            },
            {
              name: 'focusAreas',
              type: 'array',
              labels: { singular: 'Focus area', plural: 'Focus areas' },
              admin: { initCollapsed: true, description: 'The connected strip inside the homepage About chapter.' },
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'body', type: 'textarea', required: true, maxLength: 240 },
                { name: 'tag', type: 'text', maxLength: 18 },
              ],
            },
            {
              name: 'skills',
              type: 'array',
              labels: { singular: 'Skill group', plural: 'Skill groups' },
              admin: { initCollapsed: true },
              fields: [
                { name: 'group', type: 'text', required: true },
                { name: 'items', type: 'text', hasMany: true, required: true },
              ],
            },
            {
              name: 'education',
              type: 'array',
              labels: { singular: 'Education entry', plural: 'Education' },
              admin: { initCollapsed: true },
              fields: [
                { name: 'institution', type: 'text', required: true },
                { name: 'program', type: 'text', required: true },
                { name: 'period', type: 'text', required: true },
                { name: 'detail', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'Contact & footer',
          fields: [
            { name: 'email', type: 'text', required: true, defaultValue: 'ahsan.wiryawan@gmail.com' },
            {
              type: 'row',
              fields: [
                {
                  name: 'location',
                  type: 'text',
                  defaultValue: 'Yogyakarta, ID',
                  admin: { width: '50%' },
                },
                {
                  name: 'coordinates',
                  type: 'text',
                  defaultValue: "07°46′S 110°22′E · UGM",
                  admin: { width: '50%', description: 'Mono string in the footer.' },
                },
              ],
            },
            {
              name: 'socials',
              type: 'array',
              labels: { singular: 'Social link', plural: 'Social links' },
              admin: { initCollapsed: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', required: true, admin: { width: '40%' } },
                    { name: 'url', type: 'text', required: true, admin: { width: '60%' } },
                  ],
                },
              ],
            },
            {
              name: 'cvUrl',
              type: 'text',
              admin: { description: 'Link used by the [CV] item in the navbar. Overrides the upload below.' },
            },
            { name: 'cvFile', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          label: 'SEO',
          fields: [
            { name: 'siteTitle', type: 'text', defaultValue: 'M. Ahsan Zaki Wiryawan' },
            {
              name: 'siteDescription',
              type: 'textarea',
              maxLength: 200,
              defaultValue:
                'Portfolio of M. Ahsan Zaki Wiryawan, computer science undergraduate at UGM with a cybersecurity concentration.',
            },
            { name: 'ogImage', type: 'upload', relationTo: 'media' },
          ],
        },
      ],
    },
  ],
}
