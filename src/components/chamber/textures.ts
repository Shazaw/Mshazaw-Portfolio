import { CanvasTexture } from 'three'
import { mulberry32 } from '@/lib/random'

/** A narrow white ray, anchored at its base and tapering into transparent space. */
export const makeStarRayTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 256
  const context = canvas.getContext('2d')!
  const image = context.createImageData(canvas.width, canvas.height)
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const across = x / (canvas.width - 1) - 0.5
      const along = 1 - y / (canvas.height - 1)
      const line = Math.exp(-Math.pow(across / 0.018, 2)) + Math.exp(-Math.pow(across / 0.12, 2)) * 0.14
      const offset = (y * canvas.width + x) * 4
      image.data[offset] = image.data[offset + 1] = image.data[offset + 2] = 255
      image.data[offset + 3] = Math.min(255, line * Math.pow(1 - along, 2.2) * 255)
    }
  }
  context.putImageData(image, 0, 0)
  return new CanvasTexture(canvas)
}

/**
 * Domain-warped fractal noise, baked once rather than evaluated over every screen
 * pixel every frame. Rotated layers of this texture make wispy 3D gas clouds.
 */
export const makeNebulaTexture = (seed: number) => {
  const random = mulberry32(seed)
  const stretch = 4 + random() * 7
  const curl = 2 + random() * 5
  const grid = Float32Array.from({ length: 64 * 64 }, () => random())
  const smooth = (value: number) => value * value * (3 - 2 * value)
  const noise = (x: number, y: number) => {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const fx = smooth(x - ix)
    const fy = smooth(y - iy)
    const sample = (dx: number, dy: number) => grid[((iy + dy) & 63) * 64 + ((ix + dx) & 63)]
    const a = sample(0, 0) * (1 - fx) + sample(1, 0) * fx
    const b = sample(0, 1) * (1 - fx) + sample(1, 1) * fx
    return a * (1 - fy) + b * fy
  }
  const fbm = (x: number, y: number) => {
    let value = 0
    let amplitude = 0.5
    for (let octave = 0; octave < 5; octave++) {
      value += noise(x, y) * amplitude
      x = x * 2.03 + 7.1
      y = y * 2.03 + 3.7
      amplitude *= 0.5
    }
    return value
  }
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const context = canvas.getContext('2d')!
  const image = context.createImageData(canvas.width, canvas.height)
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const u = x / canvas.width
      const v = y / canvas.height
      const edge = Math.max(0, 1 - Math.pow(u * 2 - 1, 2) - Math.pow(v * 2 - 1, 2))
      const warpX = fbm(u * 4 + 8, v * 4)
      const warpY = fbm(u * 4, v * 4 + 13)
      const density = Math.max(0, (fbm(u * stretch + warpX * curl, v * 3 + warpY * curl) - 0.28) * 2.3)
      const offset = (y * canvas.width + x) * 4
      image.data[offset] = image.data[offset + 1] = image.data[offset + 2] = 255
      image.data[offset + 3] = Math.min(255, Math.pow(density, 1.7) * Math.pow(edge, 1.4) * 255)
    }
  }
  context.putImageData(image, 0, 0)
  return new CanvasTexture(canvas)
}
