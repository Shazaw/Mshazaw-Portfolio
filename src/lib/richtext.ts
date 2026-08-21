import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'

type LexicalValue = { root?: { children?: unknown[] } } | null | undefined

/** True when a lexical field actually holds something worth rendering. */
export const hasRichText = (value: LexicalValue): boolean => {
  const children = value?.root?.children
  if (!Array.isArray(children) || children.length === 0) return false
  return children.some((node) => {
    const n = node as { type?: string; text?: string; children?: unknown[] }
    if (n.type === 'paragraph') {
      return Array.isArray(n.children) && n.children.length > 0
    }
    return true
  })
}

export const richTextToHTML = (value: LexicalValue): string => {
  if (!hasRichText(value)) return ''
  try {
    return convertLexicalToHTML({ data: value as never })
  } catch {
    return ''
  }
}
