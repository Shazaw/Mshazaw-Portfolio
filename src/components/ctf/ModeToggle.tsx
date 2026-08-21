'use client'

import type { CtfMode } from '@/lib/ctf'
import styles from './Ctf.module.css'

/** `[ SOLVED | AUTHORED ]` — the switch the whole CTF area hangs off. */
export const ModeToggle = ({ mode, onChange }: { mode: CtfMode; onChange: (mode: CtfMode) => void }) => (
  <div className={styles.toggle} role="group" aria-label="Challenge mode">
    <button type="button" aria-pressed={mode === 'solved'} onClick={() => onChange('solved')}>
      Solved
    </button>
    <button type="button" aria-pressed={mode === 'authored'} onClick={() => onChange('authored')}>
      Authored
    </button>
  </div>
)
