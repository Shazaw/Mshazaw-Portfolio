/** The interactive neural map. Three.js is loaded only when this view opens. */
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color,
  Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial,
  PerspectiveCamera, Points, PointsMaterial, QuadraticBezierCurve3, Raycaster,
  Scene, ShaderMaterial, SphereGeometry, Sprite, SpriteMaterial, TubeGeometry,
  Vector2, Vector3, WebGLRenderer,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { mulberry32 } from '@/lib/random'
import { buildNeuralMap } from '@/lib/neuralMap'
import type { ChamberNode } from '@/lib/types'

const NAV_CLEARANCE = 80
const IDLE_BEFORE_AUTOROTATE = 9000
const TRAIL_LENGTH = 16

export interface ChamberOptions {
  canvas: HTMLCanvasElement
  chipEl: HTMLElement
  popupEl: HTMLElement
  labelsEl: HTMLElement
  nodes: ChamberNode[]
  reducedMotion: boolean
  onHoverChange: (index: number | null) => void
  onSelectChange: (index: number | null) => void
  onReady: () => void
}

/** Soft white light, tinted by each material. No disc, rim or billboard edge. */
const makeGlowTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const context = canvas.getContext('2d')!
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.08, 'rgba(255,255,255,.95)')
  gradient.addColorStop(0.22, 'rgba(255,255,255,.5)')
  gradient.addColorStop(0.48, 'rgba(255,255,255,.1)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  return new CanvasTexture(canvas)
}

export const createChamber = (options: ChamberOptions) => {
  const { canvas, chipEl, popupEl, labelsEl, nodes, reducedMotion } = options
  const layout = buildNeuralMap(nodes)
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.setClearColor(0x000000, 0)
  const scene = new Scene()
  const camera = new PerspectiveCamera(46, 1, 0.1, 600)
  const disposables: { dispose: () => void }[] = []
  const own = <T extends { dispose: () => void }>(value: T): T => { disposables.push(value); return value }
  const glow = own(makeGlowTexture())
  const random = mulberry32(7439)
  const light = (color: number, size: number, opacity: number) => {
    const material = own(new SpriteMaterial({ map: glow, color, opacity, transparent: true, blending: AdditiveBlending, depthWrite: false }))
    const sprite = new Sprite(material)
    sprite.scale.set(size, size, 1)
    return sprite
  }

  /* A quiet, deep web behind the record nodes. All decorative stars share two draws. */
  const backdrop = new Group()
  const distant: Vector3[] = []
  const starPositions: number[] = []
  for (let i = 0; i < 420; i++) {
    const radius = layout.extent * 1.65 + random() * 100
    const theta = random() * Math.PI * 2
    const y = random() * 2 - 1
    const r = Math.sqrt(1 - y * y)
    const position = new Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius)
    distant.push(position)
    starPositions.push(...position.toArray())
  }
  const starGeometry = own(new BufferGeometry())
  starGeometry.setAttribute('position', new BufferAttribute(new Float32Array(starPositions), 3))
  const starMaterial = own(new PointsMaterial({ map: glow, color: 0x6caddb, size: 0.7, opacity: 0.65, transparent: true, depthWrite: false, blending: AdditiveBlending }))
  backdrop.add(new Points(starGeometry, starMaterial))
  const webPositions: number[] = []
  distant.slice(0, 150).forEach((a, index, all) => {
    const nearest = all.map((b, i) => ({ b, i, distance: a.distanceTo(b) })).filter(({ i }) => i !== index).sort((a, b) => a.distance - b.distance).slice(0, 2)
    nearest.forEach(({ b, i }) => { if (i > index) webPositions.push(...a.toArray(), ...b.toArray()) })
  })
  const webGeometry = own(new BufferGeometry())
  webGeometry.setAttribute('position', new BufferAttribute(new Float32Array(webPositions), 3))
  backdrop.add(new LineSegments(webGeometry, own(new LineBasicMaterial({ color: 0x315f8d, opacity: 0.17, transparent: true, depthWrite: false, blending: AdditiveBlending }))))
  scene.add(backdrop)
  for (const [x, y, z, color] of [[-22, 4, -32, 0x174477], [25, -8, -25, 0x303575], [3, 12, -40, 0x075863]]) {
    const cloud = light(color, layout.extent * 4, 0.17)
    cloud.position.set(x, y, z)
    scene.add(cloud)
  }

  /* Record stars: hot white core, broad blue bloom, and very soft diffraction rays. */
  const hitGeometry = own(new SphereGeometry(1, 12, 8))
  const hitMaterial = own(new MeshBasicMaterial({ visible: false }))
  const stars = layout.nodes.map((node) => {
    const group = new Group()
    group.position.fromArray(node.position)
    const halo = light(0x248fff, node.size * 9, 0.5)
    const corona = light(0x65ddff, node.size * 4.5, 0.8)
    const core = light(0xe9fbff, node.size * 1.65, 1)
    const flare = light(0x9ae8ff, 1, 0.65)
    flare.scale.set(node.size * 6, node.size * 0.22, 1)
    const vertical = light(0x83caff, 1, 0.3)
    vertical.scale.set(node.size * 0.22, node.size * 4.2, 1)
    const hit = new Mesh(hitGeometry, hitMaterial)
    hit.scale.setScalar(node.size * 1.2)
    hit.userData.index = node.index
    group.add(halo, corona, core, flare, vertical, hit)
    scene.add(group)
    return { ...node, group, halo, corona, core, flare, vertical, hit, energy: 1, label: labelsEl.querySelector<HTMLElement>(`[data-node="${node.index}"]`) }
  })
  const pickables = stars.map((star) => star.hit)

  /* Curved axons. A shader sends light down the actual curve, not across its chord. */
  const signals = layout.links.map(([a, b], index) => {
    const start = stars[a].group.position
    const end = stars[b].group.position
    const middle = start.clone().lerp(end, 0.5)
    const bend = new Vector3().crossVectors(end.clone().sub(start), new Vector3(0.3, 1, 0.2)).normalize()
    middle.addScaledVector(bend, (index % 2 ? 1 : -1) * start.distanceTo(end) * 0.16)
    return { a, b, curve: new QuadraticBezierCurve3(start, middle, end), phase: random(), speed: 0.13 + random() * 0.12 }
  })
  const filamentGeometries: BufferGeometry[] = []
  signals.forEach((signal) => {
    for (let strand = 0; strand < 3; strand++) {
      const curve = new QuadraticBezierCurve3(signal.curve.v0, signal.curve.v1.clone().add(new Vector3(0, (strand - 1) * 1.9, (strand - 1) * 0.9)), signal.curve.v2)
      const geometry = new TubeGeometry(curve, 40, strand === 1 ? 0.035 : 0.012, 4, false)
      const count = geometry.attributes.position.count
      geometry.setAttribute('signal', new BufferAttribute(new Float32Array(Array.from({ length: count }, () => [signal.phase, signal.speed, signal.a, signal.b]).flat()), 4))
      geometry.setAttribute('strength', new BufferAttribute(new Float32Array(count).fill(strand === 1 ? 1 : 0.32), 1))
      filamentGeometries.push(geometry)
    }
  })
  const uniforms = { time: { value: 0 }, focus: { value: -1 }, hover: { value: -1 }, reveal: { value: reducedMotion ? 1 : 0 } }
  if (filamentGeometries.length) {
    const geometry = own(mergeGeometries(filamentGeometries)!)
    filamentGeometries.forEach((item) => item.dispose())
    const material = own(new ShaderMaterial({
      uniforms, transparent: true, depthWrite: false, blending: AdditiveBlending,
      vertexShader: `attribute vec4 signal;
        attribute float strength;
        varying vec2 vUv;
        varying vec4 vSignal;
        varying float vStrength;
        void main() {
          vUv = uv; vSignal = signal; vStrength = strength;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `uniform float time, focus, hover, reveal;
        varying vec2 vUv;
        varying vec4 vSignal;
        varying float vStrength;
        void main() {
          float head = fract(time * vSignal.y + vSignal.x);
          float trail = mod(head - vUv.x + 1.0, 1.0);
          float pulse = exp(-trail * 38.0);
          bool connected = abs(focus - vSignal.z) < 0.1 || abs(focus - vSignal.w) < 0.1;
          bool hovered = abs(hover - vSignal.z) < 0.1 || abs(hover - vSignal.w) < 0.1;
          float emphasis = focus < 0.0 ? (hovered ? 1.7 : 1.0) : (connected ? 1.7 : 0.17);
          vec3 color = mix(vec3(0.07, 0.32, 0.55), vec3(0.65, 0.94, 1.0), pulse);
          gl_FragColor = vec4(color, (0.35 + pulse * 0.65) * vStrength * emphasis * reveal);
        }`,
    }))
    scene.add(new Mesh(geometry, material))
  }

  // One particle batch for every luminous pulse and its tapering tail.
  const pulsePositions = new Float32Array(signals.length * TRAIL_LENGTH * 3)
  const pulseColors = new Float32Array(pulsePositions.length)
  const pulseGeometry = own(new BufferGeometry())
  pulseGeometry.setAttribute('position', new BufferAttribute(pulsePositions, 3))
  pulseGeometry.setAttribute('color', new BufferAttribute(pulseColors, 3))
  const pulseMaterial = own(new PointsMaterial({ map: glow, size: 1.1, vertexColors: true, opacity: 0.95, transparent: true, depthWrite: false, blending: AdditiveBlending }))
  const pulses = new Points(pulseGeometry, pulseMaterial)
  pulses.frustumCulled = false
  scene.add(pulses)

  /* Spherical camera with a frustum offset for the record panel. */
  let framingRadius = 80
  let viewShift = 0
  let leftInset = 0
  const state = {
    theta: 0.45, phi: 1.2, radius: 80, targetTheta: 0.45, targetPhi: 1.2, targetRadius: 80,
    target: new Vector3(), desiredTarget: new Vector3(),
    hovered: null as number | null, selected: null as number | null,
    lastInteraction: performance.now(), lowFps: false, paused: document.hidden, running: true,
  }
  const clampRadius = (radius: number) => Math.max(16, Math.min(framingRadius * 2.2, radius))
  const focusRadius = () => Math.max(24, framingRadius * 0.72)
  const projected = new Vector3()
  const raycaster = new Raycaster()
  const pointer = new Vector2()
  const pick = ({ clientX, clientY }: { clientX: number; clientY: number }) => {
    const rect = canvas.getBoundingClientRect()
    pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    return (raycaster.intersectObjects(pickables, false)[0]?.object.userData.index as number | undefined) ?? null
  }
  const highlight = (index: number | null) => {
    if (state.hovered === index) return
    state.hovered = index
    canvas.style.cursor = index === null ? 'grab' : 'pointer'
    chipEl.style.display = index !== null && state.selected === null ? 'block' : 'none'
    options.onHoverChange(index)
  }
  const select = (index: number | null) => {
    if (index !== null && !stars[index]) return
    state.selected = index
    state.lastInteraction = performance.now()
    chipEl.style.display = 'none'
    if (index === null) {
      state.desiredTarget.set(0, 0, 0)
      state.targetRadius = framingRadius
    } else {
      state.desiredTarget.copy(stars[index].group.position).multiplyScalar(0.65)
      state.targetRadius = focusRadius()
    }
    options.onSelectChange(index)
  }
  const zoom = (factor: number) => {
    state.targetRadius = clampRadius(state.targetRadius * factor)
    state.lastInteraction = performance.now()
  }
  const reset = () => {
    select(null)
    state.targetTheta = 0.45
    state.targetPhi = 1.2
  }

  const activePointers = new Map<number, { x: number; y: number }>()
  let moved = 0
  let pinched = false
  let pinchDistance = 0
  const onPointerDown = (event: PointerEvent) => {
    if (state.lowFps || event.button !== 0) return
    if (!activePointers.size) { moved = 0; pinched = false }
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (activePointers.size === 2) {
      pinched = true
      const [a, b] = Array.from(activePointers.values())
      pinchDistance = Math.hypot(a.x - b.x, a.y - b.y)
    }
    state.lastInteraction = performance.now()
    canvas.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: PointerEvent) => {
    if (state.lowFps) return
    const previous = activePointers.get(event.pointerId)
    if (previous) {
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (activePointers.size === 2) {
        const [a, b] = Array.from(activePointers.values())
        const distance = Math.hypot(a.x - b.x, a.y - b.y)
        if (distance && pinchDistance) zoom(pinchDistance / distance)
        pinchDistance = distance
      } else {
        const dx = event.clientX - previous.x
        const dy = event.clientY - previous.y
        moved += Math.abs(dx) + Math.abs(dy)
        state.targetTheta -= dx * 0.005
        state.targetPhi = Math.max(0.12, Math.min(Math.PI - 0.12, state.targetPhi - dy * 0.005))
      }
      state.lastInteraction = performance.now()
      highlight(null)
    } else if (event.pointerType !== 'touch') highlight(pick(event))
  }
  const onPointerUp = (event: PointerEvent) => {
    if (!activePointers.has(event.pointerId)) return
    activePointers.delete(event.pointerId)
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    if (moved <= 6 && !pinched && event.type === 'pointerup') select(pick(event))
  }
  const onWheel = (event: WheelEvent) => {
    if (state.lowFps) return
    event.preventDefault()
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1)
    zoom(Math.exp(Math.max(-300, Math.min(300, delta)) * 0.001))
  }
  const onPointerLeave = () => { if (!activePointers.size) highlight(null) }
  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight
    const previous = framingRadius
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(height, 1)
    if (viewShift) camera.setViewOffset(width, height, -viewShift * width, 0, width, height)
    else camera.clearViewOffset()
    camera.updateProjectionMatrix()
    const halfFov = camera.fov * Math.PI / 360
    const availableAspect = Math.min(1, camera.aspect * (1 - viewShift * 2.2))
    framingRadius = Math.max(38, layout.extent / Math.sin(halfFov) / availableAspect * 1.08)
    state.targetRadius *= framingRadius / previous
    state.radius *= framingRadius / previous
  }
  const onVisibility = () => { state.paused = document.hidden }
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
  canvas.dataset.scene = 'neural-map'
  canvas.dataset.nodes = String(stars.length)
  canvas.dataset.connections = String(signals.length)

  /* DOM projections are written directly, not sent through React every frame. */
  let frame = 0
  let announced = false
  let lastFrame = performance.now()
  let time = 0
  let lastReportedRadius = -1
  const point = new Vector3()
  const signalColor = new Color(0x8deaff)
  const arrivals = new Float32Array(stars.length)
  const tick = () => {
    if (!state.running) return
    frame = requestAnimationFrame(tick)
    const now = performance.now()
    if (state.paused) { lastFrame = now; return }
    if (state.lowFps && now - lastFrame < 100) return
    const dt = Math.min(0.1, (now - lastFrame) / 1000)
    lastFrame = now
    if (!reducedMotion) time += dt
    const damping = reducedMotion ? 1 : 1 - Math.exp(-7 * dt)
    if (!reducedMotion && now - state.lastInteraction > IDLE_BEFORE_AUTOROTATE && state.selected === null && state.hovered === null && !activePointers.size) state.targetTheta += dt * 0.035
    state.theta += (state.targetTheta - state.theta) * damping
    state.phi += (state.targetPhi - state.phi) * damping
    state.radius += (state.targetRadius - state.radius) * damping
    state.target.lerp(state.desiredTarget, damping)
    camera.position.set(
      state.target.x + state.radius * Math.sin(state.phi) * Math.sin(state.theta),
      state.target.y + state.radius * Math.cos(state.phi),
      state.target.z + state.radius * Math.sin(state.phi) * Math.cos(state.theta),
    )
    camera.lookAt(state.target)
    camera.updateMatrixWorld()
    uniforms.time.value = time
    uniforms.focus.value = state.selected ?? -1
    uniforms.hover.value = state.hovered ?? -1
    uniforms.reveal.value = reducedMotion ? 1 : Math.min(1, time / 1.4)
    arrivals.fill(0)
    signals.forEach((signal, index) => {
      const head = (time * signal.speed + signal.phase) % 1
      arrivals[signal.b] = Math.max(arrivals[signal.b], Math.max(0, (head - 0.87) / 0.13))
      const dim = state.selected === null || state.selected === signal.a || state.selected === signal.b ? 1 : 0.15
      for (let trail = 0; trail < TRAIL_LENGTH; trail++) {
        const t = head - trail * 0.006
        signal.curve.getPoint(Math.max(0, t), point)
        const offset = (index * TRAIL_LENGTH + trail) * 3
        point.toArray(pulsePositions, offset)
        const energy = t < 0 ? 0 : Math.pow(1 - trail / TRAIL_LENGTH, 2) * dim * uniforms.reveal.value
        pulseColors[offset] = signalColor.r * energy
        pulseColors[offset + 1] = signalColor.g * energy
        pulseColors[offset + 2] = signalColor.b * energy
      }
    })
    pulseGeometry.attributes.position.needsUpdate = true
    pulseGeometry.attributes.color.needsUpdate = true
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const occupied: { x: number; y: number; w: number }[] = []
    for (const star of stars) {
      const selected = state.selected === star.index
      const hovered = state.hovered === star.index
      const dimmed = state.selected !== null && !selected
      const energy = dimmed ? 0.32 : selected || hovered ? 1.65 : 1
      star.energy += (energy - star.energy) * damping
      const pulse = reducedMotion ? 1 : 1 + Math.sin(time * 1.65 + star.phase) * 0.09 + arrivals[star.index] * 0.09
      const reveal = reducedMotion ? 1 : Math.min(1, Math.max(0, (time - star.index * 0.025) / 0.8))
      star.group.scale.setScalar(pulse)
      star.halo.material.opacity = 0.5 * star.energy * reveal
      star.corona.material.opacity = 0.8 * star.energy * reveal
      star.core.material.opacity = (dimmed ? 0.65 : 1) * reveal
      star.flare.material.opacity = 0.6 * star.energy * reveal
      star.vertical.material.opacity = 0.3 * star.energy * reveal
      projected.copy(star.group.position).project(camera)
      const x = (projected.x * 0.5 + 0.5) * width
      const y = (-projected.y * 0.5 + 0.5) * height
      const inView = projected.z < 1 && projected.z > -1 && x > leftInset + 12 && x < width - 36 && y > 140 && y < height - 85
      if (star.label) {
        const labelWidth = star.label.offsetWidth
        const left = x + 19 + labelWidth > width - 24 ? x - 19 - labelWidth : x + 19
        const collision = occupied.some((other) => Math.abs(other.y - y) < 34 && left < other.x + other.w + 12 && left + labelWidth > other.x - 12)
        const show = inView && (!collision || hovered || selected) && (!dimmed || hovered)
        star.label.style.visibility = show ? 'visible' : 'hidden'
        star.label.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(y - 8)}px, 0)`
        star.label.style.opacity = String((selected || hovered ? 1 : 0.65) * reveal)
        if (show) occupied.push({ x: left, y, w: labelWidth })
      }
      if (hovered && state.selected === null) {
        chipEl.style.left = `${Math.max(130, Math.min(width - 130, x))}px`
        chipEl.style.top = `${Math.max(120, y - 20)}px`
      }
      if (selected) {
        const halfWidth = popupEl.offsetWidth / 2 + 20
        const minX = leftInset + halfWidth
        const cardHeight = popupEl.offsetHeight + 24
        popupEl.style.left = `${Math.max(minX, Math.min(width - halfWidth, x))}px`
        popupEl.style.top = `${Math.max(Math.min(cardHeight + NAV_CLEARANCE, height - 80), Math.min(height - 80, y - 25))}px`
      }
    }
    const radius = Math.round(state.radius)
    if (radius !== lastReportedRadius) { canvas.dataset.radius = String(radius); lastReportedRadius = radius }
    renderer.render(scene, camera)
    if (!announced) { announced = true; options.onReady() }
  }
  tick()

  return {
    select, highlight, zoom, reset,
    deselect: () => select(null),
    setLowFps: (value: boolean) => { state.lowFps = value; if (value) highlight(null) },
    setComposition: (shift: number, inset: number) => { viewShift = shift; leftInset = inset; resize() },
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
      disposables.forEach((item) => item.dispose())
      scene.clear()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}

export type ChamberHandle = ReturnType<typeof createChamber>
