import type { CollectionBeforeChangeHook } from 'payload'

/**
 * `year` is stored (not computed at read time) so it can be sorted and queried
 * cheaply, and so the chamber JSON stays a flat primitive record.
 * Ongoing roles report their start year; finished ones report the end year.
 */
export const deriveYear: CollectionBeforeChangeHook = ({ data }) => {
  const source = data?.current ? data?.startDate : (data?.endDate ?? data?.startDate)
  if (source) {
    const parsed = new Date(source)
    if (!Number.isNaN(parsed.getTime())) {
      return { ...data, year: parsed.getUTCFullYear() }
    }
  }
  return data
}

/** Same idea for collections that carry a single `date` field. */
export const deriveYearFromDate: CollectionBeforeChangeHook = ({ data }) => {
  if (data?.date) {
    const parsed = new Date(data.date)
    if (!Number.isNaN(parsed.getTime())) {
      return { ...data, year: parsed.getUTCFullYear() }
    }
  }
  return data
}

/**
 * Projects carry an optional month. When one is set it wins, so the year can
 * never drift out of step with the date shown beside it.
 */
export const deriveProjectYear: CollectionBeforeChangeHook = ({ data }) => {
  if (data?.date) {
    const parsed = new Date(data.date)
    if (!Number.isNaN(parsed.getTime())) {
      return { ...data, year: parsed.getUTCFullYear() }
    }
  }
  return data
}
