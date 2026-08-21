import type { FieldHook } from 'payload'

/**
 * Turns any human string into a URL-safe slug.
 * Deliberately conservative: ASCII lowercase, single hyphens, no leading/trailing hyphen.
 */
export const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

/**
 * Field hook: derive `slug` from `sourceField` whenever the slug is left blank.
 * An editor-supplied slug is never overwritten — it is only normalised.
 */
export const formatSlug =
  (sourceField: string): FieldHook =>
  ({ data, operation, originalDoc, value }) => {
    if (typeof value === 'string' && value.trim().length > 0) {
      return slugify(value)
    }

    if (operation === 'create' || operation === 'update') {
      const source = data?.[sourceField] ?? originalDoc?.[sourceField]
      if (typeof source === 'string' && source.trim().length > 0) {
        return slugify(source)
      }
    }

    return value
  }
