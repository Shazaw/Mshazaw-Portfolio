import { ImageResponse } from 'next/og'
import { getProfile } from '@/lib/data'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'HOLOGRID — portfolio'

/** OG template on paper + blueprint grid (spec §11). */
const OpengraphImage = async () => {
  const profile = await getProfile()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#F6F8F9',
          backgroundImage:
            'linear-gradient(#DDE4E9 1px, transparent 1px), linear-gradient(90deg, #DDE4E9 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <svg viewBox="0 0 32 32" width={40} height={40}>
            <path
              d="M6 10 L16 4 L26 10 L26 22 L16 28 L6 22 Z M6 10 L16 16 L26 10 M16 16 L16 28"
              fill="none"
              stroke="#3FC6FF"
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ fontSize: 20, letterSpacing: 6, color: '#5B6774' }}>HOLOGRID · SURVEY</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 84, lineHeight: 1.02, color: '#0C1218', letterSpacing: -2 }}>
            {profile.heroLineOne}
          </div>
          <div style={{ fontSize: 84, lineHeight: 1.02, color: '#3FC6FF', letterSpacing: -2 }}>
            {profile.heroLineTwo}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, color: '#5B6774' }}>
          <span>{profile.role ?? ''}</span>
          <span>{profile.coordinates ?? ''}</span>
        </div>
      </div>
    ),
    size,
  )
}

export default OpengraphImage
