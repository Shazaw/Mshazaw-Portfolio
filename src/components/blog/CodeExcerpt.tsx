import 'server-only'
import Prism from 'prismjs'
import 'prismjs/components/prism-markup-templating.js'
import 'prismjs/components/prism-php.js'
import 'prismjs/components/prism-apacheconf.js'
import 'prismjs/components/prism-python.js'
import 'prismjs/components/prism-c.js'
import 'prismjs/components/prism-bash.js'
import 'prismjs/components/prism-http.js'
import 'prismjs/components/prism-json.js'
import { CopyCode } from './CopyCode'
import type { BlogCode } from '@/payload-types'
import styles from './Blog.module.css'

export const CodeExcerpt = ({ block }: { block: BlogCode }) => {
  const grammar = Prism.languages[block.language]
  const highlighted = grammar ? Prism.highlight(block.code, grammar, block.language) : null

  return (
    <figure className={styles.codeFigure}>
      <div className={styles.codeBlock}>
        <div className={styles.codeHeader}>
          <span>{block.filename || block.language}</span>
          <CopyCode code={block.code} />
        </div>
        <pre tabIndex={0} aria-label={block.filename || `${block.language} excerpt`}>
          {highlighted ? (
            <code className={`language-${block.language}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
          ) : <code>{block.code}</code>}
        </pre>
      </div>
      {block.caption ? <figcaption>{block.caption}</figcaption> : null}
    </figure>
  )
}
