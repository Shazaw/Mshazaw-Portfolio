import styles from './SurveyLabel.module.css'

export const SurveyLabel = ({
  children,
  onDark = false,
  className,
}: {
  children: React.ReactNode
  onDark?: boolean
  className?: string
}) => (
  <div className={[styles.label, onDark ? styles.onDark : '', className].filter(Boolean).join(' ')}>
    {children}
  </div>
)
