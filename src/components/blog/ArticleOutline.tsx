'use client'

import { useEffect, useState } from 'react'
import styles from './Blog.module.css'

export const ArticleOutline = ({ sections }: { sections: { id: string; title: string }[] }) => {
  const [active, setActive] = useState(sections[0]?.id ?? '')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const body = document.querySelector('[data-article-body]')
      if (!body) return
      const box = body.getBoundingClientRect()
      const length = Math.max(1, box.height - window.innerHeight + 100)
      setProgress(Math.round(Math.max(0, Math.min(1, (100 - box.top) / length)) * 100))
      const current = sections.filter((section) => (document.getElementById(section.id)?.getBoundingClientRect().top ?? Infinity) <= 150).at(-1)
      setActive(current?.id ?? sections[0]?.id ?? '')
    }
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(measure) }
    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [sections])

  const links = (mobile = false) => (
    <nav aria-label={mobile ? 'Article contents (mobile)' : 'Article contents'}>
      <ol>
        {sections.map((section, index) => (
          <li key={section.id}>
            <a href={`#${section.id}`} aria-current={active === section.id ? 'location' : undefined}
              onClick={(event) => { if (mobile) event.currentTarget.closest('details')?.removeAttribute('open') }}>
              <span>{String(index + 1).padStart(2, '0')}</span>{section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )

  return (
    <aside className={styles.outline}>
      <div className={styles.desktopOutline}>
        <p className={styles.utility}>On this page <span>{progress}% read</span></p>
        <progress aria-label="Article reading progress" value={progress} max={100} />
        {links()}
        <a className={styles.topLink} href="#article-top">Back to top ↑</a>
      </div>
      <details className={styles.mobileOutline}>
        <summary>On this page · {sections.length} sections</summary>
        {links(true)}
      </details>
    </aside>
  )
}
