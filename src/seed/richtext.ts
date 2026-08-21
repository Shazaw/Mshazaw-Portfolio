/** Minimal lexical builders — enough to seed prose without hand-writing JSON. */

type Node = Record<string, unknown>

const text = (value: string, format = 0): Node => ({
  type: 'text',
  detail: 0,
  format,
  mode: 'normal',
  style: '',
  text: value,
  version: 1,
})

const block = (type: string, children: Node[], extra: Node = {}): Node => ({
  type,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children,
  ...extra,
})

export const paragraph = (value: string): Node => block('paragraph', [text(value)], { textFormat: 0 })

export const heading = (value: string, tag: 'h2' | 'h3' = 'h3'): Node =>
  block('heading', [text(value, 1)], { tag })

export const bullets = (items: string[]): Node =>
  block(
    'list',
    items.map((item, index) =>
      block('listitem', [text(item)], { value: index + 1, checked: undefined }),
    ),
    { listType: 'bullet', start: 1, tag: 'ul' },
  )

export const doc = (...children: Node[]) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children,
  },
})

/** Shorthand: a document of plain paragraphs. */
export const prose = (...paragraphs: string[]) => doc(...paragraphs.map(paragraph))
