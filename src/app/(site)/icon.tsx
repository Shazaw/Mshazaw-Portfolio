import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

/** The static monogram cube, doubling as the favicon (spec §9). */
const Icon = () =>
  new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#04070D',
        }}
      >
        <svg viewBox="0 0 32 32" width={26} height={26}>
          <path
            d="M6 10 L16 4 L26 10 L26 22 L16 28 L6 22 Z M6 10 L16 16 L26 10 M16 16 L16 28"
            fill="none"
            stroke="#3FC6FF"
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    size,
  )

export default Icon
