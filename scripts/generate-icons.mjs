import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { deflateSync } from 'node:zlib'

const rootDir = path.resolve(import.meta.dirname, '..')
const iconDir = path.join(rootDir, 'build', 'icons')

const crcTable = new Uint32Array(256)
for (let index = 0; index < crcTable.length; index += 1) {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  crcTable[index] = value >>> 0
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type, 'ascii')
  const lengthBuffer = Buffer.alloc(4)
  lengthBuffer.writeUInt32BE(data.length, 0)

  const crcBuffer = Buffer.alloc(4)
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer])
}

function isInsideRoundedRect(x, y) {
  const margin = 0.025
  const radius = 0.21
  const min = margin
  const max = 1 - margin

  if (x < min || x > max || y < min || y > max) {
    return false
  }

  const cornerX = x < min + radius ? min + radius : max - radius
  const cornerY = y < min + radius ? min + radius : max - radius

  if (
    (x < min + radius || x > max - radius) &&
    (y < min + radius || y > max - radius)
  ) {
    return Math.hypot(x - cornerX, y - cornerY) <= radius
  }

  return true
}

function isInsideRect(x, y, left, top, right, bottom) {
  return x >= left && x <= right && y >= top && y <= bottom
}

function isInsideLetter(x, y) {
  const d =
    isInsideRect(x, y, 0.19, 0.24, 0.31, 0.76) ||
    isInsideRect(x, y, 0.3, 0.24, 0.52, 0.35) ||
    isInsideRect(x, y, 0.3, 0.65, 0.52, 0.76) ||
    isInsideRect(x, y, 0.5, 0.34, 0.62, 0.66)

  const l =
    isInsideRect(x, y, 0.68, 0.24, 0.8, 0.76) ||
    isInsideRect(x, y, 0.68, 0.65, 0.9, 0.76)

  return d || l
}

function renderIconPng(size) {
  const bytesPerRow = size * 4 + 1
  const raw = Buffer.alloc(bytesPerRow * size)

  for (let y = 0; y < size; y += 1) {
    const rowStart = y * bytesPerRow
    raw[rowStart] = 0

    for (let x = 0; x < size; x += 1) {
      const nx = (x + 0.5) / size
      const ny = (y + 0.5) / size
      const offset = rowStart + 1 + x * 4

      if (!isInsideRoundedRect(nx, ny)) {
        raw[offset + 3] = 0
        continue
      }

      const shade = Math.round(20 + 28 * nx + 18 * (1 - ny))
      raw[offset] = 18
      raw[offset + 1] = 83 + shade
      raw[offset + 2] = 135 + Math.round(35 * (1 - nx))
      raw[offset + 3] = 255

      if (isInsideLetter(nx, ny)) {
        raw[offset] = 248
        raw[offset + 1] = 252
        raw[offset + 2] = 255
      }
    }
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8
  header[9] = 6

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND')
  ])
}

function buildIco() {
  const sizes = [16, 32, 48, 256]
  const images = sizes.map((size) => renderIconPng(size))
  const directorySize = 6 + images.length * 16
  const header = Buffer.alloc(directorySize)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)

  let imageOffset = directorySize
  images.forEach((image, index) => {
    const entryOffset = 6 + index * 16
    const size = sizes[index]
    header[entryOffset] = size === 256 ? 0 : size
    header[entryOffset + 1] = size === 256 ? 0 : size
    header[entryOffset + 2] = 0
    header[entryOffset + 3] = 0
    header.writeUInt16LE(1, entryOffset + 4)
    header.writeUInt16LE(32, entryOffset + 6)
    header.writeUInt32LE(image.length, entryOffset + 8)
    header.writeUInt32LE(imageOffset, entryOffset + 12)
    imageOffset += image.length
  })

  return Buffer.concat([header, ...images])
}

function icnsElement(type, image) {
  const header = Buffer.alloc(8)
  header.write(type, 0, 4, 'ascii')
  header.writeUInt32BE(image.length + 8, 4)
  return Buffer.concat([header, image])
}

function buildIcns() {
  const entries = [
    ['icp4', 16],
    ['icp5', 32],
    ['icp6', 64],
    ['ic07', 128],
    ['ic08', 256],
    ['ic09', 512],
    ['ic10', 1024]
  ]
  const elements = entries.map(([type, size]) =>
    icnsElement(type, renderIconPng(size))
  )
  const header = Buffer.alloc(8)
  header.write('icns', 0, 4, 'ascii')
  header.writeUInt32BE(8 + elements.reduce((sum, item) => sum + item.length, 0), 4)
  return Buffer.concat([header, ...elements])
}

mkdirSync(iconDir, { recursive: true })
writeFileSync(path.join(iconDir, 'icon.png'), renderIconPng(1024))
writeFileSync(path.join(iconDir, 'icon.ico'), buildIco())
writeFileSync(path.join(iconDir, 'icon.icns'), buildIcns())

console.log(`Generated icons in ${path.relative(rootDir, iconDir)}`)
