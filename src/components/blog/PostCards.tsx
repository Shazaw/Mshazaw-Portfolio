import Image from 'next/image'
import Link from 'next/link'
import { BLOG_CATEGORIES, blogDate, blogImage } from '@/lib/blog'
import type { PostSummary } from '@/lib/blog-data'
import styles from './Blog.module.css'

export const PostCards = ({ posts, headingLevel = 2, preview = false }: { posts: PostSummary[]; headingLevel?: 2 | 3; preview?: boolean }) => {
  const Heading = headingLevel === 3 ? 'h3' : 'h2'
  return (
    <div className={[styles.postGrid, preview ? styles.previewGrid : ''].filter(Boolean).join(' ')}>
      {posts.map((post) => {
        const cover = blogImage(post.cover)
        return (
          <article className={styles.postCard} key={post.id}>
            <div className={styles.cardVisual} aria-hidden="true">
              {cover ? <Image src={cover.url} alt="" width={cover.width} height={cover.height} sizes="(max-width: 860px) 100vw, 50vw" /> : (
                <div className={styles.visualDiagram}>
                  <span>{post.challenge || 'RESEARCH'}</span>
                  <code>{post.category === 'pwn' ? 'BUFFER → ACOPY → ARRAY' : 'INPUT → BOUNDARY → IMPACT'}</code>
                  <span className={styles.diagramDetail}>{post.category === 'pwn' ? '0x17 · type / length / data' : 'Notes from the source'}</span>
                </div>
              )}
            </div>
            <div className={styles.cardBody}>
              <p className={styles.utility}>{BLOG_CATEGORIES[post.category]} · Setter&apos;s notes</p>
              <Heading className={styles.cardTitle}><Link href={`/blog/${post.slug}`}>{post.title}</Link></Heading>
              <p className={styles.cardExcerpt}>{post.excerpt}</p>
              <div className={styles.cardMeta}><time dateTime={post.publishedAt}>{blogDate(post.publishedAt)}</time><span>{post.readingMinutes ?? 1} min read ↗</span></div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
