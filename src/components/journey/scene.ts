/**
 * Homepage light world (spec §5).
 *
 * A white survey field the camera walks through as the page scrolls. Built
 * data-light and fully parameterised: the structure catalogue and the camera
 * stations below are the two knobs a future design pass turns.
 */
import {
  BoxGeometry,
  EdgesGeometry,
  Fog,
  GridHelper,
  Group,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from 'three'
import { mulberry32 } from '@/lib/random'

const HOLO = 0x3fc6ff
const INK = 0x0c1218
const PAPER = 0xf6f8f9

/** One camera station per chapter; scroll progress slides between them. */
export interface CameraStation {
  /** Orbit angle in radians. */
  angle: number
  radius: number
  height: number
  look: [number, number, number]
}

export const CAMERA_STATIONS: CameraStation[] = [
  { angle: 0.0, radius: 62, height: 16, look: [0, 7, 0] },
  { angle: 0.32, radius: 56, height: 19, look: [4, 8, -3] },
  { angle: 0.68, radius: 49, height: 23, look: [-3, 9, 2] },
  { angle: 1.02, radius: 45, height: 26, look: [2, 10, 4] },
  { angle: 1.3, radius: 42, height: 29, look: [-5, 9, -2] },
  { angle: 1.62, radius: 40, height: 31, look: [0, 11, 0] },
  { angle: 1.95, radius: 44, height: 27, look: [3, 8, -4] },
  { angle: 2.3, radius: 50, height: 22, look: [0, 7, 0] },
]

export interface HomeSceneOptions {
  canvas: HTMLCanvasElement
  reducedMotion: boolean
  /** Returns scroll progress 0→1. */
  progress: () => number
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const sampleStations = (stations: CameraStation[], p: number): CameraStation => {
  const clamped = Math.max(0, Math.min(1, p))
  const scaled = clamped * (stations.length - 1)
  const i = Math.min(stations.length - 2, Math.floor(scaled))
  const t = scaled - i
  // Smoothstep between stations so chapter boundaries never snap.
  const e = t * t * (3 - 2 * t)
  const a = stations[i]
  const b = stations[i + 1]
  return {
    angle: lerp(a.angle, b.angle, e),
    radius: lerp(a.radius, b.radius, e),
    height: lerp(a.height, b.height, e),
    look: [lerp(a.look[0], b.look[0], e), lerp(a.look[1], b.look[1], e), lerp(a.look[2], b.look[2], e)],
  }
}

export const createHomeScene = (options: HomeSceneOptions) => {
  const { canvas, reducedMotion, progress } = options

  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))

  const scene = new Scene()
  scene.fog = new Fog(PAPER, 30, 130)

  const camera = new PerspectiveCamera(46, 1, 0.1, 320)

  const grid = new GridHelper(240, 60, 0xbfd4de, 0xe2eaef)
  grid.position.y = -0.01
  scene.add(grid)

  const holoMaterial = new LineBasicMaterial({ color: HOLO, transparent: true, opacity: 0.34 })
  const inkMaterial = new LineBasicMaterial({ color: INK, transparent: true, opacity: 0.1 })
  const geometries: BufferGeometry[] = []

  /** Wireframe box helper — every structure below is assembled from these. */
  const box = (w: number, h: number, d: number, material: Material) => {
    const source = new BoxGeometry(w, h, d)
    const edges = new EdgesGeometry(source)
    geometries.push(source, edges)
    return new LineSegments(edges, material)
  }

  const random = mulberry32(20260821)
  const pick = () => (random() > 0.25 ? holoMaterial : inkMaterial)
  const field = new Group()

  /* --- structural variety: slabs, stepped towers, cranes, gantries --- */

  for (let i = 0; i < 22; i++) {
    const w = 2 + random() * 4
    const h = 4 + random() * 22
    const d = 2 + random() * 4
    const mesh = box(w, h, d, pick())
    mesh.position.set((random() - 0.5) * 92, h / 2, (random() - 0.5) * 92)
    field.add(mesh)
  }

  for (let i = 0; i < 6; i++) {
    // Stepped tower: three shrinking stacked volumes.
    const material = pick()
    const x = (random() - 0.5) * 78
    const z = (random() - 0.5) * 78
    let base = 5 + random() * 3
    let y = 0
    for (let step = 0; step < 3; step++) {
      const h = 6 + random() * 9
      const mesh = box(base, h, base, material)
      mesh.position.set(x, y + h / 2, z)
      field.add(mesh)
      y += h
      base *= 0.68
    }
  }

  for (let i = 0; i < 4; i++) {
    const x = (random() - 0.5) * 72
    const z = (random() - 0.5) * 72
    const h = 20 + random() * 14
    const mast = box(0.7, h, 0.7, holoMaterial)
    mast.position.set(x, h / 2, z)
    const arm = box(14, 0.6, 0.6, holoMaterial)
    arm.position.set(x + 4, h, z)
    const weight = box(1.6, 1.6, 1.6, holoMaterial)
    weight.position.set(x - 3.4, h, z)
    field.add(mast, arm, weight)
  }

  for (let i = 0; i < 3; i++) {
    // Gantry: two legs and a span.
    const x = (random() - 0.5) * 70
    const z = (random() - 0.5) * 70
    const h = 10 + random() * 8
    const span = 12 + random() * 10
    const legA = box(0.6, h, 0.6, inkMaterial)
    legA.position.set(x - span / 2, h / 2, z)
    const legB = box(0.6, h, 0.6, inkMaterial)
    legB.position.set(x + span / 2, h / 2, z)
    const deck = box(span, 0.5, 1.4, holoMaterial)
    deck.position.set(x, h, z)
    field.add(legA, legB, deck)
  }

  for (let i = 0; i < 5; i++) {
    // Ground plates — low footprints that keep the horizon populated.
    const w = 6 + random() * 14
    const d = 6 + random() * 14
    const plate = box(w, 0.35, d, inkMaterial)
    plate.position.set((random() - 0.5) * 100, 0.18, (random() - 0.5) * 100)
    field.add(plate)
  }

  scene.add(field)

  const look = new Vector3()
  let frame = 0
  let running = true
  let paused = false
  let time = 0

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

  // Damped so a fast scroll glides instead of whipping the camera.
  let smoothed = progress()

  const tick = () => {
    if (!running) return
    frame = requestAnimationFrame(tick)
    if (paused) return

    const p = progress()
    smoothed += (p - smoothed) * 0.08
    if (!reducedMotion) time += 0.0025

    const station = sampleStations(CAMERA_STATIONS, smoothed)
    const angle = station.angle + (reducedMotion ? 0 : time * 0.4)

    camera.position.set(
      Math.sin(angle) * station.radius,
      station.height,
      Math.cos(angle) * station.radius,
    )
    look.set(station.look[0], station.look[1], station.look[2])
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
      for (const geometry of geometries) geometry.dispose()
      grid.geometry.dispose()
      ;(grid.material as Material).dispose()
      holoMaterial.dispose()
      inkMaterial.dispose()
      scene.clear()
      renderer.dispose()
      renderer.forceContextLoss?.()
    },
  }
}

export type HomeSceneHandle = ReturnType<typeof createHomeScene>
