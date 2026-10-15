import type { Metadata } from 'next'
import { PostCards } from '@/components/blog/PostCards'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { getBlogPosts } from '@/lib/blog-data'
import styles from '@/components/blog/Blog.module.css'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Technical notes on challenge design, exploit development and security research, written from the problem setter’s side.',
  alternates: { canonical: '/blog' },
}

const Blog = async () => {
  const posts = await getBlogPosts()
  return (
    <main id="main" className={styles.listing}>
      <header className={styles.listingHeader}>
        <Eyebrow>07 · Blog · Field notes</Eyebrow>
        <h1>Excerpts from me</h1>
        <p>Challenge design, vulnerable exploits, random thoughts, and cool things I find</p>
        <div className={styles.listingMeta}>{String(posts.length).padStart(2, '0')} posts</div>
      </header>
      {posts.length ? <PostCards posts={posts} /> : <p>New notes are on their way.</p>}
    </main>
  )
}
export default Blog
