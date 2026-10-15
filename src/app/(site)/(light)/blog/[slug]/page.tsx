import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogArticle } from '@/components/blog/BlogArticle'
import { getBlogPost, getBlogSitemap } from '@/lib/blog-data'
import { getProfile } from '@/lib/data'
import { blogImage } from '@/lib/blog'

type Props = { params: Promise<{ slug: string }> }

export const generateStaticParams = async () => (await getBlogSitemap()).map((post) => ({ slug: post.slug! }))

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const post = await getBlogPost((await params).slug)
  if (!post) notFound()
  const profile = await getProfile()
  const image = blogImage(post.cover)
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article', title: post.title, description: post.excerpt,
      url: `/blog/${post.slug}`, publishedTime: post.publishedAt, modifiedTime: post.updatedAt,
      authors: [profile.name], ...(image ? { images: [{ url: image.url, alt: image.alt }] } : {}),
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt, ...(image ? { images: [image.url] } : {}) },
  }
}

const PostPage = async ({ params }: Props) => {
  const post = await getBlogPost((await params).slug)
  if (!post) notFound()
  const profile = await getProfile()
  return <BlogArticle post={post} author={profile.name} />
}
export default PostPage
