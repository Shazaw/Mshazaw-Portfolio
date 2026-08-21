import type { Field } from 'payload'
import { formatSlug } from '@/lib/slug'

/** URL-safe identifier, auto-derived from `source` when left blank. */
export const slugField = (source = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  index: true,
  unique: true,
  admin: {
    position: 'sidebar',
    description: 'Leave blank to derive from the title.',
  },
  hooks: {
    beforeValidate: [formatSlug(source)],
  },
})

/**
 * Weight drives everything visual: tower height in the chamber, ordering in the
 * mosaic, and which items surface on the homepage. 5 = flagship.
 */
export const weightField: Field = {
  name: 'weight',
  type: 'number',
  required: true,
  defaultValue: 3,
  min: 1,
  max: 5,
  admin: {
    position: 'sidebar',
    description: '1–5. Drives tower height in the chamber and ordering everywhere.',
  },
}

/** The short mono tag shown beside titles in cells and cards, e.g. `RUST`. */
export const subtagField: Field = {
  name: 'subtag',
  type: 'text',
  maxLength: 18,
  admin: {
    description: 'Short mono tag shown beside the title. Defaults to the first tag.',
  },
}

export const tagsField: Field = {
  name: 'tags',
  type: 'text',
  hasMany: true,
  admin: {
    description: 'Short uppercase keywords, e.g. RUST, CRYPTO, X3DH.',
  },
}

export const summaryField: Field = {
  name: 'summary',
  type: 'textarea',
  required: true,
  maxLength: 180,
  admin: {
    description: 'One line. Shown in mosaic cells and homepage strips.',
  },
}

export const linksField: Field = {
  name: 'links',
  type: 'array',
  labels: { singular: 'Link', plural: 'Links' },
  admin: {
    description: 'Buttons rendered inside the popup card.',
    initCollapsed: true,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: { width: '40%', description: 'e.g. GITHUB, WRITE-UP, LIVE' },
        },
        { name: 'url', type: 'text', required: true, admin: { width: '60%' } },
      ],
    },
  ],
}

/** Editors can pin a wide cell for flagship work; `auto` defers to the pattern algorithm. */
export const mosaicSpanField: Field = {
  name: 'mosaicSpan',
  type: 'select',
  defaultValue: 'auto',
  options: [
    { label: 'Auto (pattern)', value: 'auto' },
    { label: '2 / 6', value: '2' },
    { label: '3 / 6', value: '3' },
    { label: '4 / 6', value: '4' },
  ],
  admin: {
    position: 'sidebar',
    description: 'Width of this item inside the CARDS mosaic.',
  },
}

export const featuredField: Field = {
  name: 'featured',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    position: 'sidebar',
    description: "Show in this section's homepage card strip.",
  },
}

export const publishedField: Field = {
  name: 'published',
  type: 'checkbox',
  defaultValue: true,
  admin: {
    position: 'sidebar',
    description: 'Unpublished items are hidden from the public site.',
  },
}

export const yearField: Field = {
  name: 'year',
  type: 'number',
  index: true,
  admin: {
    position: 'sidebar',
    readOnly: true,
    description: 'Derived from the dates above.',
  },
}
