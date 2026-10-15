import Image from 'next/image'
import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { BLOG_CATEGORIES, blogDate, blogImage, sectionAnchor } from '@/lib/blog'
import type { Post } from '@/payload-types'
import { ArticleOutline } from './ArticleOutline'
import { CodeExcerpt } from './CodeExcerpt'
import styles from './Blog.module.css'

export const BlogArticle = ({ post, author }: { post: Post; author: string }) => {
  const outline = post.sections.map((section, index) => ({ id: sectionAnchor(index, section.title), title: section.title }))
  if (post.references?.length) outline.push({ id: 'references', title: 'References' })

  return (
    <main id="main" className={styles.articleMain}>
      <header id="article-top" className={styles.articleHeader}>
        <Link href="/blog" className={styles.backLink}>← All posts</Link>
        <p className={styles.utility}>{BLOG_CATEGORIES[post.category]} · {post.event || 'Research'} · Setter&apos;s notes</p>
        <h1>{post.title}</h1>
        <p className={styles.dek}>{post.excerpt}</p>
        <div className={styles.byline}><span>{author}</span><time dateTime={post.publishedAt}>{blogDate(post.publishedAt)}</time><span>{post.readingMinutes ?? 1} min read</span></div>
        <ul className={styles.tags} aria-label="Topics">{(post.tags ?? []).map((tag) => <li key={tag}>{tag}</li>)}</ul>
      </header>

      <div className={styles.articleGrid}>
        <ArticleOutline sections={outline} />
        <article className={styles.articleBody} data-article-body>
          {post.sections.map((section, index) => (
            <section key={section.id ?? index} id={outline[index].id} className={styles.articleSection}>
              <h2>{section.title}</h2>
              {section.blocks.map((block, blockIndex) => {
                const key = block.id ?? blockIndex
                if (block.blockType === 'prose') return <div className={styles.prose} key={key}><RichText data={block.content} /></div>
                if (block.blockType === 'code') return <CodeExcerpt key={key} block={block} />
                const image = blogImage(block.image)
                return image ? (
                  <figure key={key} className={styles.screenshot}>
                    <a href={image.url} target="_blank" rel="noreferrer" aria-label={`Open full-size image: ${image.alt}`}>
                      <Image src={image.url} alt={image.alt} width={image.width} height={image.height} sizes="(max-width: 1100px) 100vw, (max-width: 1900px) 80vw, 1482px" />
                    </a>
                    <figcaption>{block.caption}</figcaption>
                  </figure>
                ) : null
              })}
            </section>
          ))}
          {post.references?.length ? (
            <section id="references" className={styles.articleSection}>
              <h2>References</h2>
              <ul className={styles.references}>{post.references.map((reference) => <li key={reference.id ?? reference.url}><a href={reference.url} target="_blank" rel="noreferrer">{reference.label} ↗</a></li>)}</ul>
            </section>
          ) : null}
          <div className={styles.articleEnd}><span>End of notes · {post.challenge || 'Research'}</span><Link href="/blog">Back to all posts ↗</Link></div>
        </article>
      </div>
    </main>
  )
}
