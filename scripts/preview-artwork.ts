import { writeFileSync } from 'fs'
import { ART_VIEWBOX, buildArtwork, MOTIF_KEYS } from '../src/components/strips/artwork'

const vb = `${ART_VIEWBOX.x} ${ART_VIEWBOX.y} ${ART_VIEWBOX.w} ${ART_VIEWBOX.h}`
const cells = MOTIF_KEYS.flatMap((key) => [key, `auto:${key}-variant`])
  .map((key) => {
    const art = buildArtwork(key)
    return `<figure><figcaption>${key}</figcaption>
    <div class="band">
      <svg viewBox="${vb}" preserveAspectRatio="xMidYMax slice">${art.muted.map((d) => `<path class="m" d="${d}"/>`).join('')}</svg>
      <svg viewBox="${vb}" preserveAspectRatio="xMidYMax slice">${art.main.map((d) => `<path d="${d}"/>`).join('')}</svg>
    </div></figure>`
  })
  .join('')

writeFileSync(
  process.argv[2],
  `<html><head><style>
body{margin:0;background:#F6F8F9;font:12px/1.4 monospace;display:grid;grid-template-columns:repeat(3,1fr);gap:0}
figure{margin:0;border:1px solid #DDE4E9}
figcaption{padding:6px 10px;letter-spacing:.12em;text-transform:uppercase;color:#5B6774}
.band{position:relative;height:300px;overflow:hidden;background:linear-gradient(160deg,#EEF4F7,#E2EDF3 55%,#D6E7F0)}
svg{position:absolute;inset:0;width:100%;height:100%}
path{fill:none;stroke:#3FC6FF;stroke-width:1.3;opacity:.8}
path.m{stroke:#9FB8C6;opacity:.5}
</style></head><body>${cells}</body></html>`,
)
console.log('written')
