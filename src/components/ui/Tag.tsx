import styles from './Tag.module.css'

export const TagList = ({
  tags,
  onDark = false,
  max,
  className,
}: {
  tags: string[]
  onDark?: boolean
  max?: number
  className?: string
}) => {
  if (tags.length === 0) return null
  const shown = typeof max === 'number' ? tags.slice(0, max) : tags
  return (
    <div className={[styles.tags, className].filter(Boolean).join(' ')}>
      {shown.map((tag) => (
        <span key={tag} className={[styles.tag, onDark ? styles.onDark : ''].filter(Boolean).join(' ')}>
          {tag}
        </span>
      ))}
    </div>
  )
}
