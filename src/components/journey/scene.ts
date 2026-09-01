/**
 * Homepage light world (spec §5, M3 design pass).
 *
 * A three-act journey driven entirely by scroll:
 *
 *   ACT 1 — THE DOOR. A circuit-board portal (concentric instrument rings
 *   around a blank disc, traces running out both sides) fills the hero. The
 *   ring assembly spins with scroll — clockwise on the way down, counter-
 *   clockwise back up, because its rotation is proportional to scroll. At the
 *   end of the hero the wall splits down the middle, both halves slide apart,
 *   and the camera passes through.
 *
 *   ACT 2 — THE NETWORK. Through the door the camera veers right into a
 *   greyscale plexus constellation: fine dark nodes joined by hairline links,
 *   dense on the right, with soft out-of-focus motes behind.
 *
 *   ACT 3 — THE SURVEY. Further down, the wireframe blueprint city fades in
 *   and the camera settles into the slow orbit the later chapters play over.
 *
 * Everything is procedural and seeded — no model files, identical on every
 * load. The door split is done with per-half clipping planes so the rings can
 * keep rotating across the cut while the halves slide.
 */
import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  EdgesGeometry,
  Float32BufferAttribute,
  Fog,
  GridHelper,
  Group,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Plane,
  Points,
  PointsMaterial,
  Scene,
  Sprite,
  SpriteMaterial,
  Vector3,
  WebGLRenderer,
} from 'three'
import { mulberry32 } from '@/lib/random'

const PAPER = 0xf6f8f9
const INK = 0x0c1218
const GRAPHITE = 0x5b6774
const HOLO = 0x3fc6ff
/** Hairline grey, nudged darker than the CSS token so 1px lines survive fog. */
const TRACE = 0xc3d0d9

const TAU = Math.PI * 2

export interface HomeSceneOptions {
  canvas: HTMLCanvasElement
  reducedMotion: boolean
  /** Returns scroll progress 0→1. */
  progress: () => number
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/* ------------------------------------------------------------------ path ---- */

interface Key {
  p: number
  pos: [number, number, number]
  look: [number, number, number]
}

/**
 * The camera path. The door stands at the origin in the XY plane; the network
 * hangs to the right beyond it; the city sits further out still. Stations are
 * placed so each act only enters the fog's range as the camera approaches it.
 */
const KEYS: Key[] = [
  { p: 0.0, pos: [-9, 15.5, 56], look: [-9, 14, 0] },
  { p: 0.07, pos: [-7, 15, 44], look: [-6.5, 14, 0] },
  { p: 0.135, pos: [-3, 14.5, 26], look: [-2, 14, -3] },
  { p: 0.2, pos: [0.5, 14.3, 6], look: [10, 14, -16] },
  { p: 0.29, pos: [20, 15, -18], look: [54, 15, -42] },
  { p: 0.42, pos: [43, 15.5, -30], look: [70, 14.5, -49] },
  { p: 0.54, pos: [72, 18, -45], look: [124, 10, -86] },
  { p: 0.68, pos: [112, 26, -60], look: [170, 8, -110] },
  { p: 0.83, pos: [150, 31, -46], look: [170, 7, -110] },
  { p: 1.0, pos: [218, 25, -80], look: [168, 6, -112] },
]

/* ------------------------------------------------- geometry helpers ---- */

type Pt = [number, number]

const circlePts = (cx: number, cy: number, r: number, n: number): Pt[] => {
  const pts: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return pts
}

const arcPts = (r: number, a0: number, a1: number, n: number): Pt[] => {
  const pts: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n
    pts.push([Math.cos(a) * r, Math.sin(a) * r])
  }
  return pts
}

/** Polyline → line-segment pairs, appended to a flat xyz array. */
const pushPoly = (out: number[], pts: Pt[], z = 0) => {
  for (let i = 0; i < pts.length - 1; i++) {
    out.push(pts[i][0], pts[i][1], z, pts[i + 1][0], pts[i + 1][1], z)
  }
}

const pushSeg = (out: number[], x1: number, y1: number, x2: number, y2: number, z = 0) => {
  out.push(x1, y1, z, x2, y2, z)
}

/* ------------------------------------------------------------ textures ---- */

/** White radial dot, tinted by material colour. Hard edge = printed dot; soft = bokeh. */
const makeDotTexture = (hard: boolean): CanvasTexture => {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    if (hard) {
      g.addColorStop(0, 'rgba(255,255,255,1)')
      g.addColorStop(0.55, 'rgba(255,255,255,1)')
      g.addColorStop(0.78, 'rgba(255,255,255,0.6)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
    } else {
      g.addColorStop(0, 'rgba(255,255,255,0.9)')
      g.addColorStop(0.5, 'rgba(255,255,255,0.35)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
    }
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }
  return new CanvasTexture(canvas)
}

/* ============================================================ the scene ---- */

export const createHomeScene = (options: HomeSceneOptions) => {
  const { canvas, reducedMotion, progress } = options

  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  // The door halves are cut by clipping planes so the rings can rotate across
  // the split while the halves slide apart.
  renderer.localClippingEnabled = true

  const scene = new Scene()
  scene.fog = new Fog(PAPER, 26, 115)

  const camera = new PerspectiveCamera(46, 1, 0.1, 400)

  const disposables: { dispose(): void }[] = []
  const track = <T extends { dispose(): void }>(item: T): T => {
    disposables.push(item)
    return item
  }

  const dotSharp = track(makeDotTexture(true))
  const dotSoft = track(makeDotTexture(false))

  const segGeometry = (segments: number[]): BufferGeometry => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(segments, 3))
    return track(geometry)
  }

  /* ====================================================== ACT 1: door ---- */
  /*
   * The wall is authored once as flat segment lists (rotating ring layer and
   * static circuit layer), then instantiated twice — one half clipped to each
   * side of x=0. Both halves hold the FULL wall; the clipping plane does the
   * cutting, so the seam is invisible while closed and the rings can spin
   * freely while open.
   */

  const ringHair: number[] = []
  const ringInk: number[] = []
  const ringGraphite: number[] = []
  const ringHolo: number[] = []
  const flatHair: number[] = []
  const flatGraphite: number[] = []
  const flatHolo: number[] = []
  const flatDots: number[] = []

  // --- rotating instrument rings, outermost to innermost ---
  pushPoly(ringHair, circlePts(0, 0, 16.8, 128))

  for (let i = 0; i < 72; i++) {
    // Fine tick ring just inside the rim.
    const a = (i / 72) * TAU
    const long = i % 6 === 0
    const r0 = 16.2 - (long ? 0.55 : 0)
    pushSeg(ringInk, Math.cos(a) * r0, Math.sin(a) * r0, Math.cos(a) * 16.55, Math.sin(a) * 16.55)
  }

  {
    // Broken bold ring: five arcs with gaps, double-struck to read heavier.
    const rndArc = mulberry32(1207)
    let a = rndArc() * TAU
    for (let i = 0; i < 5; i++) {
      const span = 0.55 + rndArc() * 0.8
      pushPoly(ringGraphite, arcPts(14.72, a, a + span, 28))
      pushPoly(ringGraphite, arcPts(14.48, a, a + span, 28))
      a += span + 0.35 + rndArc() * 0.5
    }
  }

  // Accent arcs — the one touch of site colour on the door.
  pushPoly(ringHolo, arcPts(12.9, -0.4, 1.35, 32))
  pushPoly(ringHolo, arcPts(12.9, 2.3, 3.3, 24))

  for (let i = 0; i < 46; i++) {
    // Dashed ring.
    const a0 = (i / 46) * TAU
    pushPoly(ringHair, arcPts(11.6, a0, a0 + TAU / 46 / 2, 3))
  }

  for (let i = 0; i < 4; i++) {
    // Bracket arcs with radial end caps.
    const a0 = (i / 4) * TAU + 0.35
    const a1 = a0 + 0.85
    pushPoly(ringGraphite, arcPts(10.3, a0, a1, 20))
    for (const a of [a0, a1]) {
      pushSeg(ringGraphite, Math.cos(a) * 9.8, Math.sin(a) * 9.8, Math.cos(a) * 10.8, Math.sin(a) * 10.8)
    }
  }

  pushPoly(ringHair, circlePts(0, 0, 8.9, 96))
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + 0.26
    pushSeg(ringHair, Math.cos(a) * 8.9, Math.sin(a) * 8.9, Math.cos(a) * 9.55, Math.sin(a) * 9.55)
  }

  // --- static circuit layer: traces out both sides, hexes, stray marks ---
  const rndWall = mulberry32(4242)

  for (const side of [-1, 1]) {
    const offsets = [-11.5, -7, -3, 2.5, 7, 11]
    for (let t = 0; t < offsets.length; t++) {
      const y0 = offsets[t] + (rndWall() - 0.5) * 1.6
      const major = rndWall() > 0.45
      const target = major ? flatGraphite : flatHair
      let x = side * (19 + rndWall() * 2)
      let y = y0
      const pts: Pt[] = [[x, y]]
      const jogs = 1 + Math.floor(rndWall() * 2)
      for (let j = 0; j < jogs; j++) {
        x += side * (4 + rndWall() * 9)
        pts.push([x, y])
        const dy = (rndWall() > 0.5 ? 1 : -1) * (2 + rndWall() * 3.5)
        // 45° dog-leg, like a routed board trace.
        x += side * Math.abs(dy)
        y += dy
        pts.push([x, y])
      }
      x += side * (5 + rndWall() * 16)
      pts.push([x, y])
      pushPoly(target, pts)

      if (rndWall() > 0.35) {
        // Terminal pad: small circle at the end of the run.
        const r = 0.7 + rndWall() * 0.7
        pushPoly(target, circlePts(x + side * r, y, r, 20))
      } else {
        flatDots.push(x + side * 0.4, y, 0)
      }
      if (major && rndWall() > 0.5) {
        // Short parallel companion run.
        const px0 = pts[0][0]
        pushSeg(flatHair, px0, y0 + 0.7, px0 + side * (6 + rndWall() * 6), y0 + 0.7)
      }
    }

    // One long fine rule per side, like the reference's horizontal keylines.
    const ry = side === -1 ? 6.4 : 21.6
    pushSeg(flatHair, side * 20, ry, side * (52 + rndWall() * 12), ry)
  }

  for (let i = 0; i < 7; i++) {
    // Scattered hexagons.
    const a = rndWall() * TAU
    const d = 24 + rndWall() * 30
    const cx = Math.cos(a) * d * 1.35
    const cy = Math.sin(a) * d * 0.5
    const r = 1.2 + rndWall() * 1.6
    const target = i === 2 ? flatHolo : flatHair
    const hex: Pt[] = []
    for (let k = 0; k <= 6; k++) {
      const ha = (k / 6) * TAU + 0.5
      hex.push([cx + Math.cos(ha) * r, cy + Math.sin(ha) * r])
    }
    pushPoly(target, hex)
  }

  for (let i = 0; i < 10; i++) {
    // Stray pads and pinholes.
    const a = rndWall() * TAU
    const d = 21 + rndWall() * 34
    const cx = Math.cos(a) * d * 1.3
    const cy = Math.sin(a) * d * 0.55
    if (rndWall() > 0.5) flatDots.push(cx, cy, 0)
    else pushPoly(flatHair, circlePts(cx, cy, 0.5 + rndWall() * 0.5, 14))
  }

  const ringGeoms = {
    hair: segGeometry(ringHair),
    ink: segGeometry(ringInk),
    graphite: segGeometry(ringGraphite),
    holo: segGeometry(ringHolo),
  }
  const flatGeoms = {
    hair: segGeometry(flatHair),
    graphite: segGeometry(flatGraphite),
    holo: segGeometry(flatHolo),
  }
  const dotsGeom = track(new BufferGeometry())
  dotsGeom.setAttribute('position', new Float32BufferAttribute(flatDots, 3))
  const discGeom = track(new CircleGeometry(7.6, 72))

  const wall = new Group()
  wall.position.set(0, 14, 0)
  scene.add(wall)

  interface Half {
    group: Group
    ring: Group
    plane: Plane
    side: number
  }
  const halves: Half[] = []

  for (const side of [-1, 1]) {
    // side -1 keeps x ≤ constant·(-1)… both planes share constant = -d.
    const plane = new Plane(new Vector3(side, 0, 0), 0)
    const clippedLine = (color: number, opacity: number) =>
      track(new LineBasicMaterial({ color, transparent: true, opacity, clippingPlanes: [plane] }))

    const group = new Group()
    const ring = new Group()
    ring.add(new LineSegments(ringGeoms.hair, clippedLine(TRACE, 0.6)))
    ring.add(new LineSegments(ringGeoms.ink, clippedLine(INK, 0.3)))
    ring.add(new LineSegments(ringGeoms.graphite, clippedLine(GRAPHITE, 0.5)))
    ring.add(new LineSegments(ringGeoms.holo, clippedLine(HOLO, 0.34)))

    group.add(ring)
    group.add(new LineSegments(flatGeoms.hair, clippedLine(TRACE, 0.65)))
    group.add(new LineSegments(flatGeoms.graphite, clippedLine(GRAPHITE, 0.45)))
    group.add(new LineSegments(flatGeoms.holo, clippedLine(HOLO, 0.24)))

    const pads = new Points(
      dotsGeom,
      track(
        new PointsMaterial({
          color: INK,
          size: 4,
          sizeAttenuation: false,
          map: dotSharp,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
        }),
      ),
    )
    group.add(pads)

    const disc = new Mesh(
      discGeom,
      track(new MeshBasicMaterial({ color: 0xfcfdfe, clippingPlanes: [plane] })),
    )
    disc.position.z = 0.02
    group.add(disc)

    wall.add(group)
    halves.push({ group, ring, plane, side })
  }

  // Soft drop shadow lifting the disc off the page, and a whisper of accent
  // glow — both fade out as the door opens, since they sit across the split.
  const shadowMat = track(
    new SpriteMaterial({ map: dotSoft, color: 0x2b3742, transparent: true, opacity: 0.16, depthWrite: false }),
  )
  const shadow = new Sprite(shadowMat)
  shadow.scale.set(24, 24, 1)
  shadow.position.set(0, -1, -1.2)
  wall.add(shadow)

  const haloMat = track(
    new SpriteMaterial({ map: dotSoft, color: HOLO, transparent: true, opacity: 0.07, depthWrite: false }),
  )
  const halo = new Sprite(haloMat)
  halo.scale.set(46, 46, 1)
  halo.position.set(0, 0, -1.8)
  wall.add(halo)

  /* =================================================== ACT 2: network ---- */

  interface Fadeable {
    material: Material & { opacity: number }
    base: number
  }
  const plexusMats: Fadeable[] = []
  const fadeMat = <T extends Material & { opacity: number }>(list: Fadeable[], material: T, base: number): T => {
    material.transparent = true
    material.opacity = 0
    list.push({ material, base })
    return track(material)
  }

  const plexus = new Group()
  plexus.position.set(66, 15, -47)
  plexus.rotation.y = -0.95
  scene.add(plexus)

  const rndNet = mulberry32(9021)
  const nodes: [number, number, number][] = []
  for (let i = 0; i < 170; i++) {
    // Right-heavy: two thirds of the nodes pile toward local +x, the rest thin
    // out across the left — the reference constellation's weighting.
    const right = rndNet() < 0.66
    const x = right ? 34 - rndNet() * rndNet() * 42 : -34 + rndNet() * 46
    const y = -21 + rndNet() * 44
    const z = (rndNet() - 0.5) * 11
    nodes.push([x, y, z])
  }

  // Three point sizes so the field reads like the reference's mixed dots.
  const sharpBuckets: number[][] = [[], [], []]
  nodes.forEach((node, i) => sharpBuckets[i % 3].push(...node))
  const sharpSizes = [2.6, 4.2, 6]
  sharpBuckets.forEach((bucket, i) => {
    const geometry = track(new BufferGeometry())
    geometry.setAttribute('position', new Float32BufferAttribute(bucket, 3))
    const material = fadeMat(
      plexusMats,
      new PointsMaterial({
        color: INK,
        size: sharpSizes[i],
        sizeAttenuation: false,
        map: dotSharp,
        depthWrite: false,
      }),
      0.78,
    )
    plexus.add(new Points(geometry, material))
  })

  {
    // Out-of-focus motes floating behind the constellation.
    const soft: number[] = []
    for (let i = 0; i < 34; i++) {
      soft.push(34 - rndNet() * rndNet() * 52, -22 + rndNet() * 46, -8 - rndNet() * 8)
    }
    const geometry = track(new BufferGeometry())
    geometry.setAttribute('position', new Float32BufferAttribute(soft, 3))
    const material = fadeMat(
      plexusMats,
      new PointsMaterial({
        color: 0x39434c,
        size: 15,
        sizeAttenuation: false,
        map: dotSoft,
        depthWrite: false,
      }),
      0.14,
    )
    plexus.add(new Points(geometry, material))
  }

  {
    // Links: connect neighbours, capped so the dense side stays lacework
    // rather than becoming a solid mesh.
    const links: number[] = []
    let count = 0
    for (let i = 0; i < nodes.length && count < 300; i++) {
      for (let j = i + 1; j < nodes.length && count < 300; j++) {
        const dx = nodes[i][0] - nodes[j][0]
        const dy = nodes[i][1] - nodes[j][1]
        const dz = nodes[i][2] - nodes[j][2]
        if (dx * dx + dy * dy + dz * dz < 8.5 * 8.5) {
          links.push(...nodes[i], ...nodes[j])
          count++
        }
      }
    }
    const material = fadeMat(plexusMats, new LineBasicMaterial({ color: INK }), 0.16)
    plexus.add(new LineSegments(segGeometry(links), material))
  }

  /* ====================================================== ACT 3: city ---- */

  const cityMats: Fadeable[] = []
  const city = new Group()
  city.position.set(170, 0, -110)
  scene.add(city)

  const grid = new GridHelper(240, 60, 0xbfd4de, 0xe2eaef)
  grid.position.y = -0.01
  const gridMaterial = grid.material as LineBasicMaterial
  gridMaterial.transparent = true
  gridMaterial.opacity = 0
  cityMats.push({ material: gridMaterial, base: 1 })
  track(grid.geometry)
  track(gridMaterial)
  city.add(grid)

  const holoMaterial = fadeMat(cityMats, new LineBasicMaterial({ color: HOLO }), 0.34)
  const inkMaterial = fadeMat(cityMats, new LineBasicMaterial({ color: INK }), 0.1)

  const box = (w: number, h: number, d: number, material: Material) => {
    const source = new BoxGeometry(w, h, d)
    const edges = new EdgesGeometry(source)
    track(source)
    track(edges)
    return new LineSegments(edges, material)
  }

  const rndCity = mulberry32(20260821)
  const pick = () => (rndCity() > 0.25 ? holoMaterial : inkMaterial)

  for (let i = 0; i < 22; i++) {
    const w = 2 + rndCity() * 4
    const h = 4 + rndCity() * 22
    const d = 2 + rndCity() * 4
    const mesh = box(w, h, d, pick())
    mesh.position.set((rndCity() - 0.5) * 92, h / 2, (rndCity() - 0.5) * 92)
    city.add(mesh)
  }

  for (let i = 0; i < 6; i++) {
    // Stepped tower: three shrinking stacked volumes.
    const material = pick()
    const x = (rndCity() - 0.5) * 78
    const z = (rndCity() - 0.5) * 78
    let base = 5 + rndCity() * 3
    let y = 0
    for (let step = 0; step < 3; step++) {
      const h = 6 + rndCity() * 9
      const mesh = box(base, h, base, material)
      mesh.position.set(x, y + h / 2, z)
      city.add(mesh)
      y += h
      base *= 0.68
    }
  }

  for (let i = 0; i < 4; i++) {
    const x = (rndCity() - 0.5) * 72
    const z = (rndCity() - 0.5) * 72
    const h = 20 + rndCity() * 14
    const mast = box(0.7, h, 0.7, holoMaterial)
    mast.position.set(x, h / 2, z)
    const arm = box(14, 0.6, 0.6, holoMaterial)
    arm.position.set(x + 4, h, z)
    const weight = box(1.6, 1.6, 1.6, holoMaterial)
    weight.position.set(x - 3.4, h, z)
    city.add(mast, arm, weight)
  }

  for (let i = 0; i < 3; i++) {
    // Gantry: two legs and a span.
    const x = (rndCity() - 0.5) * 70
    const z = (rndCity() - 0.5) * 70
    const h = 10 + rndCity() * 8
    const span = 12 + rndCity() * 10
    const legA = box(0.6, h, 0.6, inkMaterial)
    legA.position.set(x - span / 2, h / 2, z)
    const legB = box(0.6, h, 0.6, inkMaterial)
    legB.position.set(x + span / 2, h / 2, z)
    const deck = box(span, 0.5, 1.4, holoMaterial)
    deck.position.set(x, h, z)
    city.add(legA, legB, deck)
  }

  for (let i = 0; i < 5; i++) {
    // Ground plates keeping the horizon populated.
    const w = 6 + rndCity() * 14
    const d = 6 + rndCity() * 14
    const plate = box(w, 0.35, d, inkMaterial)
    plate.position.set((rndCity() - 0.5) * 100, 0.18, (rndCity() - 0.5) * 100)
    city.add(plate)
  }

  /* -------------------------------------------------------- lifecycle ---- */

  const look = new Vector3()
  let frame = 0
  let running = true
  let paused = false

  const resize = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(height, 1)
    camera.updateProjectionMatrix()
  }

  const onVisibility = () => {
    paused = document.hidden
  }

  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', onVisibility)
  resize()

  // Damped so a fast scroll glides instead of snapping between acts.
  let smoothed = progress()

  const applyFades = (list: Fadeable[], fade: number) => {
    for (const entry of list) entry.material.opacity = entry.base * fade
  }

  const tick = () => {
    if (!running) return
    frame = requestAnimationFrame(tick)
    if (paused) return

    const now = performance.now()
    const p = progress()
    smoothed += (p - smoothed) * (reducedMotion ? 1 : 0.075)
    const s = smoothed

    /* --- door --- */
    wall.visible = s < 0.45
    if (wall.visible) {
      const open = smoothstep(0.09, 0.18, s)
      const gap = open * 36
      for (const half of halves) {
        half.group.position.x = half.side * gap
        half.plane.constant = -gap
        // Scroll-proportional spin: down = clockwise, up = counter-clockwise.
        half.ring.rotation.z = -s * 14
      }
      shadowMat.opacity = 0.16 * (1 - open)
      haloMat.opacity = 0.07 * (1 - open)
    }

    /* --- network --- */
    const fadeNetwork = smoothstep(0.13, 0.25, s) * (1 - smoothstep(0.58, 0.75, s))
    plexus.visible = fadeNetwork > 0.01
    if (plexus.visible) {
      applyFades(plexusMats, fadeNetwork)
      if (!reducedMotion) plexus.rotation.z = Math.sin(now * 0.00005) * 0.03
    }

    /* --- city --- */
    const fadeCity = smoothstep(0.46, 0.62, s)
    city.visible = fadeCity > 0.01
    if (city.visible) applyFades(cityMats, fadeCity)

    // Fog opens up with the city so its far edge still dissolves.
    const fogT = smoothstep(0.48, 0.64, s)
    const fog = scene.fog as Fog
    fog.near = lerp(26, 40, fogT)
    fog.far = lerp(115, 205, fogT)

    /* --- camera along the keyframed path --- */
    let i = 0
    while (i < KEYS.length - 2 && s > KEYS[i + 1].p) i++
    const a = KEYS[i]
    const b = KEYS[i + 1]
    const t = smoothstep(a.p, b.p, s)
    camera.position.set(
      lerp(a.pos[0], b.pos[0], t),
      lerp(a.pos[1], b.pos[1], t) + (reducedMotion ? 0 : Math.sin(now * 0.0004) * 0.35),
      lerp(a.pos[2], b.pos[2], t),
    )
    look.set(lerp(a.look[0], b.look[0], t), lerp(a.look[1], b.look[1], t), lerp(a.look[2], b.look[2], t))
    camera.lookAt(look)

    renderer.render(scene, camera)
  }

  tick()

  return {
    dispose: () => {
      running = false
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      for (const item of disposables) item.dispose()
      scene.clear()
      renderer.dispose()
      renderer.forceContextLoss?.()
    },
  }
}

export type HomeSceneHandle = ReturnType<typeof createHomeScene>
