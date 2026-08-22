/**
 * The hologram chamber (spec §8.2–8.4).
 *
 * Vanilla Three.js with named imports so the bundler can drop the rest of the
 * library. No react-three-fiber, no model files, no postprocessing — the
 * additive-on-gradient recipe IS the bloom.
 *
 * The engine writes the hover chip and popup positions straight to DOM nodes
 * rather than through React state: those update every frame and must not
 * trigger renders.
 */
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  EdgesGeometry,
  Fog,
  GridHelper,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Raycaster,
  Scene,
  Sprite,
  SpriteMaterial,
  RepeatWrapping,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Texture,
} from 'three'
import { mulberry32, hashSeed } from '@/lib/random'
import type { ChamberNode } from '@/lib/types'
// Beyond this the cluster stops reading as a skyline and starts costing frames.
import { MAX_TOWERS } from '@/lib/chamberConstants'

const HOLO = 0x3fc6ff
const HOLO_HOT = 0xb6ecff
const HOLO_BRIGHT = 0x9fe5ff
const CORE = 0x0a1b2e
const FLOOR_LINE = 0x2b93c4


const GOLDEN_ANGLE = 2.39996
const IDLE_BEFORE_AUTOROTATE = 6000
const CARDS_FRAME_INTERVAL = 100 // ~10fps while the mosaic is up
/** Navbar height plus a margin — the popup never slides under the chrome. */
const NAV_CLEARANCE = 72

export interface ChamberCallbacks {
  onHoverChange: (index: number | null) => void
  onSelectChange: (index: number | null) => void
  onReady: () => void
}

export interface ChamberOptions extends ChamberCallbacks {
  canvas: HTMLCanvasElement
  chipEl: HTMLElement
  popupEl: HTMLElement
  nodes: ChamberNode[]
  reducedMotion: boolean
}

interface Tower {
  group: Group
  edges: LineSegments
  shaft: Sprite
  crown: Sprite
  glow: Sprite
  solid: Mesh
  floors: LineSegments[]
  height: number
  index: number
}

/** Shared 128px radial texture: the only generated asset in the scene. */
const makeGlowTexture = (): CanvasTexture => {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, 'rgba(120,215,255,1)')
    gradient.addColorStop(0.35, 'rgba(63,198,255,.45)')
    gradient.addColorStop(1, 'rgba(63,198,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
  }
  return new CanvasTexture(canvas)
}

/**
 * Surface motif: a dark panel grid with a scattering of lit pads, so a tower
 * face reads as a built thing rather than a flat plane. Deliberately low
 * contrast — the light shafts are the focus, this is only texture underneath
 * them. Seeded per tower so no two facades repeat.
 */
const makePanelTexture = (seed: number): CanvasTexture => {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const random = mulberry32(seed)

  if (ctx) {
    ctx.fillStyle = '#050d16'
    ctx.fillRect(0, 0, size, size)

    // Panel seams, only just there.
    ctx.strokeStyle = 'rgba(22, 62, 92, 0.3)'
    ctx.lineWidth = 1
    for (let i = 1; i < 6; i++) {
      const p = (size / 6) * i
      ctx.beginPath()
      ctx.moveTo(p, 0)
      ctx.lineTo(p, size)
      ctx.moveTo(0, p)
      ctx.lineTo(size, p)
      ctx.stroke()
    }

    // Pads. Mostly barely lit; a handful read as windows with something behind
    // them. Any brighter and the motif starts competing with the shafts.
    for (let i = 0; i < 26; i++) {
      const w = 5 + random() * 16
      const h = 3 + random() * 5
      const x = random() * (size - w)
      const y = random() * (size - h)
      const roll = random()
      ctx.fillStyle =
        roll > 0.93
          ? 'rgba(96, 190, 240, 0.42)'
          : roll > 0.72
            ? 'rgba(34, 92, 130, 0.32)'
            : 'rgba(16, 44, 66, 0.55)'
      ctx.fillRect(x, y, w, h)
    }
  }

  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  return texture
}

export const createChamber = (options: ChamberOptions) => {
  const { canvas, chipEl, popupEl, nodes, reducedMotion } = options
  const visible = nodes.slice(0, MAX_TOWERS)

  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  // Tighter than the spec's 60–190: the floor is smaller now, and the far edge
  // has to dissolve rather than end on a visible boundary.
  scene.fog = new Fog(0x04070d, 42, 132)

  const camera = new PerspectiveCamera(45, 1, 0.1, 400)

  /* ------------------------------------------------------ atmosphere ---- */
  /* Mandatory: without these the cluster reads as a depressing empty grid. */

  /*
   * The survey floor. It was reading brighter than the cluster and running
   * uniformly to the horizon, which flattened the whole frame — the eye had
   * nowhere to land. Pulled in and dimmed so the fog can eat its edge, it now
   * sits under the towers instead of competing with them.
   */
  const gridA = new GridHelper(150, 30, 0x11577a, 0x0b3a54)
  const gridB = new GridHelper(150, 8, 0x2596c9, 0x2596c9)
  for (const [grid, opacity] of [
    [gridA, 0.34],
    [gridB, 0.26],
  ] as const) {
    const material = grid.material as LineBasicMaterial
    material.transparent = true
    material.opacity = opacity
  }
  gridB.position.y = 0.02
  scene.add(gridA, gridB)

  const glowTexture: Texture = makeGlowTexture()
  const basePanelTexture = makePanelTexture(0x5eed)

  const poolMaterial = new MeshBasicMaterial({
    map: glowTexture,
    transparent: true,
    opacity: 0.26,
    blending: AdditiveBlending,
    depthWrite: false,
  })
  const poolGeometry = new PlaneGeometry(1, 1)
  const pool = new Mesh(poolGeometry, poolMaterial)
  pool.rotation.x = -Math.PI / 2
  pool.scale.set(64, 64, 1)
  pool.position.y = 0.05
  scene.add(pool)

  const PARTICLE_COUNT = 240
  const particlePositions = new Float32Array(PARTICLE_COUNT * 3)
  const particleRandom = mulberry32(99)
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = particleRandom() * Math.PI * 2
    const radius = 8 + particleRandom() * 48
    particlePositions[i * 3] = Math.cos(angle) * radius
    particlePositions[i * 3 + 1] = 1 + particleRandom() * 34
    particlePositions[i * 3 + 2] = Math.sin(angle) * radius
  }
  const particleGeometry = new BufferGeometry()
  particleGeometry.setAttribute('position', new BufferAttribute(particlePositions, 3))
  const particleMaterial = new PointsMaterial({
    color: HOLO,
    size: 0.35,
    transparent: true,
    opacity: 0.5,
    blending: AdditiveBlending,
    depthWrite: false,
    // Untextured points draw as hard squares, and size attenuation turns one
    // that drifts near the camera into a solid cyan block. The shared radial
    // texture makes them soft motes at every distance.
    map: glowTexture,
    sizeAttenuation: true,
  })
  const particles = new Points(particleGeometry, particleMaterial)
  scene.add(particles)

  /* ---------------------------------------------------- the cluster ---- */

  const towers: Tower[] = []
  const pickables: Mesh[] = []
  const disposables: { dispose: () => void }[] = [
    poolGeometry,
    poolMaterial,
    particleGeometry,
    particleMaterial,
    glowTexture,
    basePanelTexture,
  ]
  const birth: number[] = []
  const start = performance.now()

  visible.forEach((node, i) => {
    const random = mulberry32(hashSeed(node.slug || node.id))
    const group = new Group()

    // Phyllotaxis: tight, towers nearly shoulder-to-shoulder. The coefficient is
    // a touch above the spec's 2.05 because the footprints are now wider — at
    // 2.05 they interpenetrate and the cluster reads as one mass.
    const radius = i === 0 ? 0 : 3.0 + 5.6 * Math.sqrt(i)
    group.position.set(Math.cos(i * GOLDEN_ANGLE) * radius, 0, Math.sin(i * GOLDEN_ANGLE) * radius)

    /*
     * Weight drives height (spec) and now footprint as well. With a near-fixed
     * footprint every tower read as the same slab and the only cue was height,
     * which the perspective flattens — coupling both gives the cluster a
     * silhouette you can read at a glance.
     */
    const footprint = 3.5 + node.weight * 0.5 + random() * 0.6
    // The falloff term guarantees the peak sits at centre. Shorter than the
    // spec's (7 + w*4.6): against the wider footprints that read as spires, and
    // the cluster wants to sit down on the floor rather than tower over it.
    const height = (6.2 + node.weight * 3.6) * (1 - 0.028 * i) + random() * 1.2

    const solidGeometry = new BoxGeometry(footprint, height, footprint)
    // Cloned so each tower can scale the pattern to its own size and keep the
    // pads square; clones share the underlying bitmap.
    const panelTexture = basePanelTexture.clone()
    panelTexture.needsUpdate = true
    panelTexture.repeat.set(Math.max(1, Math.round(footprint / 2.6)), Math.max(2, Math.round(height / 5.5)))
    const solidMaterial = new MeshBasicMaterial({ color: 0xffffff, map: panelTexture })
    const solid = new Mesh(solidGeometry, solidMaterial)
    solid.position.y = height / 2
    solid.userData.index = i

    const edgeSource = new BoxGeometry(footprint, height, footprint)
    const edgeGeometry = new EdgesGeometry(edgeSource)
    const edgeMaterial = new LineBasicMaterial({
      color: HOLO,
      transparent: true,
      opacity: 0.7,
      blending: AdditiveBlending,
    })
    const edges = new LineSegments(edgeGeometry, edgeMaterial)
    edges.position.y = height / 2

    /*
     * Storey plates — the spec calls these "what makes towers read as lit,
     * occupied buildings", but at 0.999x they sit INSIDE an opaque core and are
     * occluded on every tower, which is why the cluster read as blank slabs.
     * Drawn slightly proud of the faces instead, they ring each tower as a
     * floor slab and become the cluster's only real texture.
     */
    const floors: LineSegments[] = []
    const floorGeometry = new EdgesGeometry(new PlaneGeometry(footprint * 1.035, footprint * 1.035))
    const floorMaterial = new LineBasicMaterial({
      color: FLOOR_LINE,
      transparent: true,
      opacity: 0.4,
      blending: AdditiveBlending,
    })
    for (let f = 1; f < Math.floor(height / 2.6); f++) {
      const floor = new LineSegments(floorGeometry, floorMaterial)
      floor.rotation.x = -Math.PI / 2
      floor.position.y = f * 2.6
      group.add(floor)
      floors.push(floor)
    }

    /*
     * A light shaft rising out of the roof, in place of the wireframe cap box
     * that used to sit up there looking like freight. This is the tower's
     * signal — the surface motif stays quiet underneath it.
     */
    const shaftHeight = 9.5 + node.weight * 1.9
    const shaftMaterial = new SpriteMaterial({
      map: glowTexture,
      color: HOLO_BRIGHT,
      transparent: true,
      opacity: 0.2,
      blending: AdditiveBlending,
      depthWrite: false,
    })
    const shaft = new Sprite(shaftMaterial)
    shaft.scale.set(footprint * 0.42, shaftHeight, 1)
    shaft.position.y = height + shaftHeight * 0.42

    // Hot spot where the shaft leaves the roof.
    const crownMaterial = new SpriteMaterial({
      map: glowTexture,
      color: HOLO_HOT,
      transparent: true,
      opacity: 0.4,
      blending: AdditiveBlending,
      depthWrite: false,
    })
    const crown = new Sprite(crownMaterial)
    crown.scale.set(footprint * 0.95, footprint * 0.95, 1)
    crown.position.y = height + 0.2

    const glowMaterial = new SpriteMaterial({
      map: glowTexture,
      color: HOLO,
      transparent: true,
      opacity: 0.16,
      blending: AdditiveBlending,
      depthWrite: false,
    })
    const glow = new Sprite(glowMaterial)
    glow.scale.set(footprint * 2.3, height * 1.05, 1)
    glow.position.y = height * 0.55

    /*
     * Contact pool. Without it the towers read as floating in front of a grid
     * rather than standing on it — this is the cheapest possible ground shadow,
     * inverted: light spilling onto the floor instead of shadow.
     */
    const contactMaterial = new SpriteMaterial({
      map: glowTexture,
      color: HOLO,
      transparent: true,
      opacity: 0.15,
      blending: AdditiveBlending,
      depthWrite: false,
    })
    const contact = new Sprite(contactMaterial)
    contact.scale.set(footprint * 2.6, footprint * 2.6, 1)
    contact.position.y = 0.15
    contact.material.rotation = 0

    group.add(solid, edges, shaft, crown, glow, contact)
    group.scale.y = reducedMotion ? 1 : 0.001
    scene.add(group)

    towers.push({ group, edges, shaft, crown, glow, solid, floors, height, index: i })
    pickables.push(solid)
    birth.push(start + i * 45)

    disposables.push(
      solidGeometry,
      solidMaterial,
      edgeSource,
      edgeGeometry,
      edgeMaterial,
      floorGeometry,
      floorMaterial,
      panelTexture,
      shaftMaterial,
      crownMaterial,
      glowMaterial,
      contactMaterial,
    )
  })

  /* ------------------------------------------------- camera & orbit ---- */

  /**
   * The spec fixes the orbit clamp at [16, 66] and the resting target at
   * (0, 7, 0), but not the opening distance. A fixed 40 crops the cluster, and
   * a fixed target of y=7 puts a 30-unit tower's beacon outside the frustum —
   * you cannot see the peak of the skyline the chamber is supposed to be.
   *
   * So both are derived from the cluster that actually exists: the resting
   * target lifts toward the middle of the skyline (never below the spec's 7),
   * and the radius is whatever puts the tallest beacon inside the vertical
   * frustum with a margin. Small clusters land close to the spec's numbers;
   * only tall ones pull back.
   */
  const tallest = towers.reduce((max, tower) => Math.max(max, tower.height), 12)
  const widest = towers.reduce(
    (max, tower) => Math.max(max, Math.hypot(tower.group.position.x, tower.group.position.z)),
    4,
  )
  const restHeight = Math.max(7, tallest * 0.38)
  const halfFov = Math.tan((camera.fov * Math.PI) / 360)
  // Headroom covers the crown and the base of the light shaft; the shaft's soft
  // tip is allowed to leave the frame rather than shrinking the whole cluster.
  const needed = Math.max(tallest + 6 - restHeight, restHeight)
  /*
   * `needed / halfFov` is the distance at which the cluster fits — but that is
   * the distance to its CENTRE, and the towers on the near side sit `widest`
   * closer to the camera, where they project correspondingly larger and fall
   * out of frame. Adding the spread back puts the near face at that distance
   * instead, which is what actually has to fit.
   */
  const framingRadius = Math.max(16, Math.min(100, widest + needed / halfFov))

  const state = {
    theta: 0.8,
    phi: 1.1,
    radius: framingRadius,
    targetTheta: 0.8,
    targetPhi: 1.1,
    targetRadius: framingRadius,
    target: new Vector3(0, restHeight, 0),
    desiredTarget: new Vector3(0, restHeight, 0),
    lastInteraction: performance.now(),
    hovered: null as number | null,
    selected: null as number | null,
    paused: false,
    lowFps: false,
    running: true,
    lastFrame: 0,
  }

  const clampPhi = (value: number) => Math.max(0.55, Math.min(1.42, value))
  /*
   * The spec caps the orbit at 66. A cluster spread wide enough that its towers
   * do not visually collide has to be framed from further out than that, and
   * the clamp only ever bounded how far a visitor may zoom.
   */
  const clampRadius = (value: number) => Math.max(16, Math.min(100, value))

  let dragging = false
  let pointerX = 0
  let pointerY = 0
  let moved = 0
  const activePointers = new Map<number, { x: number; y: number }>()
  let pinchDistance = 0

  const raycaster = new Raycaster()
  const pointer = new Vector2()
  const projected = new Vector3()

  const pick = (event: { clientX: number; clientY: number }): number | null => {
    const rect = canvas.getBoundingClientRect()
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects(pickables, false)[0]
    return hit ? ((hit.object.userData.index as number) ?? null) : null
  }

  const setHovered = (index: number | null) => {
    if (state.hovered === index) return
    state.hovered = index
    canvas.style.cursor = index === null ? 'grab' : 'pointer'
    if (index === null || state.selected !== null) {
      chipEl.style.display = 'none'
    } else {
      chipEl.style.display = 'block'
    }
    options.onHoverChange(index)
  }

  const select = (index: number | null) => {
    if (index === null) {
      state.selected = null
      state.desiredTarget.set(0, restHeight, 0)
      state.targetRadius = framingRadius
      options.onSelectChange(null)
      return
    }
    const tower = towers[index]
    if (!tower) return
    state.selected = index
    chipEl.style.display = 'none'
    state.desiredTarget.set(tower.group.position.x * 0.6, tower.height * 0.4, tower.group.position.z * 0.6)
    state.targetRadius = Math.max(24, state.targetRadius * 0.8)
    state.lastInteraction = performance.now()
    options.onSelectChange(index)
  }

  /* ------------------------------------------------------- listeners ---- */

  const onPointerDown = (event: PointerEvent) => {
    if (state.lowFps) return
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (activePointers.size === 1) {
      dragging = true
      moved = 0
      pointerX = event.clientX
      pointerY = event.clientY
    } else if (activePointers.size === 2) {
      dragging = false
      const [a, b] = Array.from(activePointers.values())
      pinchDistance = Math.hypot(a.x - b.x, a.y - b.y)
    }
    state.lastInteraction = performance.now()
    canvas.setPointerCapture?.(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (state.lowFps) return
    if (activePointers.has(event.pointerId)) {
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    }

    if (activePointers.size === 2) {
      const [a, b] = Array.from(activePointers.values())
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinchDistance > 0) {
        state.targetRadius = clampRadius(state.targetRadius + (pinchDistance - distance) * 0.06)
      }
      pinchDistance = distance
      state.lastInteraction = performance.now()
      return
    }

    if (dragging) {
      const dx = event.clientX - pointerX
      const dy = event.clientY - pointerY
      moved += Math.abs(dx) + Math.abs(dy)
      state.targetTheta -= dx * 0.006
      state.targetPhi = clampPhi(state.targetPhi - dy * 0.004)
      pointerX = event.clientX
      pointerY = event.clientY
      state.lastInteraction = performance.now()
    }

    if (event.pointerType !== 'touch') setHovered(pick(event))
  }

  const onPointerUp = (event: PointerEvent) => {
    if (state.lowFps) return
    const wasDragging = dragging && moved > 6
    activePointers.delete(event.pointerId)
    if (activePointers.size < 2) pinchDistance = 0
    if (activePointers.size === 0) dragging = false
    canvas.releasePointerCapture?.(event.pointerId)

    // A drag must never be read as a click on a tower.
    if (!wasDragging && event.type === 'pointerup') {
      const index = pick(event)
      if (index !== null) select(index)
      else if (state.selected !== null) select(null)
    }
  }

  const onWheel = (event: WheelEvent) => {
    if (state.lowFps) return
    event.preventDefault()
    state.targetRadius = clampRadius(state.targetRadius + event.deltaY * 0.03)
    state.lastInteraction = performance.now()
  }

  const onPointerLeave = () => {
    setHovered(null)
    dragging = false
    activePointers.clear()
  }

  /*
   * Composition offset. The record panel occupies the left of the frame, so the
   * cluster is pushed right by shifting the frustum rather than moving the
   * scene — the orbit maths stays centred on the cluster, and `project()` still
   * returns correct screen positions for the chip and popup because it reads
   * the same offset projection matrix.
   */
  let viewShift = 0
  let leftInset = 0

  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(height, 1)
    if (viewShift !== 0) {
      camera.setViewOffset(width, height, -viewShift * width, 0, width, height)
    } else {
      camera.clearViewOffset()
    }
    camera.updateProjectionMatrix()
  }

  const onVisibility = () => {
    state.paused = document.hidden
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerleave', onPointerLeave)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
  canvas.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', onVisibility)

  resize()
  canvas.style.cursor = 'grab'

  /* ------------------------------------------------------------ loop ---- */

  let frame = 0
  let announced = false

  const tick = () => {
    if (!state.running) return
    frame = requestAnimationFrame(tick)

    const now = performance.now()
    if (state.paused) return
    if (state.lowFps && now - state.lastFrame < CARDS_FRAME_INTERVAL) return
    state.lastFrame = now

    if (!reducedMotion && now - state.lastInteraction > IDLE_BEFORE_AUTOROTATE && state.selected === null) {
      state.targetTheta += 0.0012
    }

    state.theta += (state.targetTheta - state.theta) * 0.08
    state.phi += (state.targetPhi - state.phi) * 0.08
    state.radius += (state.targetRadius - state.radius) * 0.08
    state.target.lerp(state.desiredTarget, 0.06)

    camera.position.set(
      state.target.x + state.radius * Math.sin(state.phi) * Math.sin(state.theta),
      state.target.y + state.radius * Math.cos(state.phi),
      state.target.z + state.radius * Math.sin(state.phi) * Math.cos(state.theta),
    )
    camera.lookAt(state.target)

    if (!reducedMotion) particles.rotation.y = now * 0.00002

    for (const tower of towers) {
      const i = tower.index
      if (tower.group.scale.y < 1 && now > birth[i]) {
        tower.group.scale.y = Math.min(1, tower.group.scale.y + 0.045)
      }

      const isSelected = state.selected === i
      const isHovered = state.hovered === i
      const dimmed = state.selected !== null && !isSelected

      const edgeTarget = dimmed ? 0.2 : isSelected || isHovered ? 1 : 0.7
      const edgeMaterial = tower.edges.material as LineBasicMaterial
      edgeMaterial.opacity += (edgeTarget - edgeMaterial.opacity) * 0.15

      const glowMaterial = tower.glow.material as SpriteMaterial
      const glowTarget = dimmed ? 0.05 : isSelected || isHovered ? 0.34 : 0.16
      glowMaterial.opacity += (glowTarget - glowMaterial.opacity) * 0.12

      const pulse = Math.abs(Math.sin(now * 0.002 + i)) * (dimmed ? 0.3 : 1)
      const lift = isSelected || isHovered ? 1.8 : 1
      ;(tower.shaft.material as SpriteMaterial).opacity = (0.12 + 0.13 * pulse) * lift
      ;(tower.crown.material as SpriteMaterial).opacity = (0.24 + 0.2 * pulse) * lift

      if (isHovered && state.selected === null) {
        projected.set(tower.group.position.x, tower.height + 2.4, tower.group.position.z).project(camera)
        chipEl.style.left = `${(projected.x * 0.5 + 0.5) * canvas.clientWidth}px`
        chipEl.style.top = `${(-projected.y * 0.5 + 0.5) * canvas.clientHeight}px`
      }
    }

    if (state.selected !== null) {
      const tower = towers[state.selected]
      projected.set(tower.group.position.x, tower.height + 1.5, tower.group.position.z).project(camera)
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      // The card is anchored bottom-centre (translate(-50%,-100%)), so the
      // clamp has to be driven by its measured box rather than a fixed 220/300 —
      // a long record grows taller than the spec's reference card.
      const halfWidth = popupEl.offsetWidth / 2 + 20
      const minX = leftInset + halfWidth
      const cardHeight = popupEl.offsetHeight + 24
      const x = Math.max(minX, Math.min(width - halfWidth, (projected.x * 0.5 + 0.5) * width))
      // Floor keeps the card clear of the fixed navbar as well as the top edge.
      const floor = Math.min(cardHeight + NAV_CLEARANCE, height - 40)
      const y = Math.max(floor, Math.min(height - 40, (-projected.y * 0.5 + 0.5) * height))
      popupEl.style.left = `${x}px`
      popupEl.style.top = `${y}px`
    }

    renderer.render(scene, camera)

    if (!announced) {
      announced = true
      options.onReady()
    }
  }

  tick()

  /* ---------------------------------------------------------- public ---- */

  return {
    select,
    deselect: () => select(null),
    /** CARDS mode drops the loop to ~10fps behind the blur. */
    setLowFps: (value: boolean) => {
      state.lowFps = value
      if (value) {
        setHovered(null)
      }
    },
    /** Frame the cluster on one tower without opening its popup. */
    focusIndex: (index: number) => select(index),
    /** Highlight a tower from outside the canvas — used by the record panel. */
    highlight: (index: number | null) => setHovered(index),
    /**
     * `shift` moves the cluster right as a fraction of the viewport width;
     * `inset` is the panel's right edge, which the popup must clear.
     */
    setComposition: (shift: number, inset: number) => {
      viewShift = shift
      leftInset = inset
      resize()
    },
    towerCount: towers.length,
    overflow: Math.max(0, nodes.length - towers.length),
    dispose: () => {
      state.running = false
      cancelAnimationFrame(frame)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)

      for (const item of disposables) item.dispose()
      gridA.geometry.dispose()
      ;(gridA.material as LineBasicMaterial).dispose()
      gridB.geometry.dispose()
      ;(gridB.material as LineBasicMaterial).dispose()
      scene.clear()
      renderer.dispose()
      renderer.forceContextLoss?.()
    },
  }
}

export type ChamberHandle = ReturnType<typeof createChamber>
