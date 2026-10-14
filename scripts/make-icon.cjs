// Görev çubuğu ve uygulama içi aynı işareti kullanır: kırık çatılı ahır,
// ortada sarı/bronz böcek. BARN noktaları değişmez. --outline eski çizgi hali.
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const pngToIco = require('png-to-ico').default

const INK = [0x2f, 0x8a, 0x4a]
const EDGE = [0x1a, 0x3d, 0x2c]
const GOLD = [0xe0, 0xb4, 0x3a]
const SAMPLES = 5
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]

// Kırık çatı: üst eğim yatık, alt eğim dik. Sapma kalın çizgiden büyük olmalı,
// yoksa kırık yutulup düz üçgen görünüyor.
const BARN = [
  [0.5, 0.07],
  [0.72, 0.2],
  [0.9, 0.42],
  [0.9, 0.92],
  [0.1, 0.92],
  [0.1, 0.42],
  [0.28, 0.2],
]

function rectPath(x0, y0, x1, y1) {
  return [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ]
}

// Kalınlık kanvas oranı: piksele bağlanınca 32px'e küçülen çizgi 1px'in
// altına düşüp siliniyordu. Oran sabit olunca her katman aynı kalınlıkta.
const STROKE_REL = 0.075
const MASTER_SIZE = 256
// --outline: eski çizgi ahır. Varsayılan: dolu yeşil ahır, sarı böcek.
const FILL = !process.argv.includes('--outline')

function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  if (len2 === 0) {
    return Math.hypot(px - ax, py - ay)
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

function nearPolyline(px, py, points, closed, half) {
  const count = closed ? points.length : points.length - 1
  for (let i = 0; i < count; i += 1) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    if (distToSeg(px, py, a[0], a[1], b[0], b[1]) <= half) {
      return true
    }
  }
  return false
}

function inEllipse(px, py, cx, cy, rx, ry) {
  const dx = (px - cx) / rx
  const dy = (py - cy) / ry
  return dx * dx + dy * dy <= 1
}

function hitBug(x, y, half) {
  const cx = 0.5
  const cy = 0.645
  const bodyRx = 0.115
  const bodyRy = 0.14
  const headR = 0.055
  const headY = cy - bodyRy * 0.82
  const legHalf = half * 0.62

  const onHead = inEllipse(x, y, cx, headY, headR, headR * 0.95)
  const onBody = inEllipse(x, y, cx, cy, bodyRx, bodyRy)

  const antennaY = headY - headR * 0.15
  const onAntenna =
    distToSeg(x, y, cx - 0.03, antennaY, cx - 0.1, antennaY - 0.09) <= legHalf * 0.85 ||
    distToSeg(x, y, cx + 0.03, antennaY, cx + 0.1, antennaY - 0.09) <= legHalf * 0.85

  const legs = [
    [cx - bodyRx * 0.5, cy - bodyRy * 0.28, cx - bodyRx * 1.3, cy - bodyRy * 0.58],
    [cx - bodyRx * 0.72, cy + 0.01, cx - bodyRx * 1.38, cy + 0.04],
    [cx - bodyRx * 0.5, cy + bodyRy * 0.32, cx - bodyRx * 1.28, cy + bodyRy * 0.64],
    [cx + bodyRx * 0.5, cy - bodyRy * 0.28, cx + bodyRx * 1.3, cy - bodyRy * 0.58],
    [cx + bodyRx * 0.72, cy + 0.01, cx + bodyRx * 1.38, cy + 0.04],
    [cx + bodyRx * 0.5, cy + bodyRy * 0.32, cx + bodyRx * 1.28, cy + bodyRy * 0.64],
  ]
  const onLeg = legs.some(
    ([ax, ay, bx, by]) => distToSeg(x, y, ax, ay, bx, by) <= legHalf,
  )

  if (!onHead && !onBody && !onAntenna && !onLeg) {
    return null
  }

  if (
    onBody &&
    !onHead &&
    distToSeg(x, y, cx, cy - bodyRy * 0.15, cx, cy + bodyRy * 0.88) <= half * 0.42
  ) {
    return 'cut'
  }

  return 'gold'
}

function pointInPoly(x, y, points) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i][0]
    const yi = points[i][1]
    const xj = points[j][0]
    const yj = points[j][1]
    const crosses = yi > y !== yj > y
    if (crosses && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function hitInk(x, y, half) {
  // Böcek üstte kalsın diye önce o bakılır.
  if (hitBug(x, y, half) === 'gold') {
    return 'gold'
  }

  const doors = [
    rectPath(0.14, 0.45, 0.325, 0.9),
    rectPath(0.675, 0.45, 0.86, 0.9),
  ]

  if (FILL) {
    if (nearPolyline(x, y, BARN, true, half)) {
      return 'edge'
    }
    if (pointInPoly(x, y, BARN)) {
      return 'ink'
    }
    return null
  }

  if (nearPolyline(x, y, BARN, true, half)) {
    return 'ink'
  }

  // Kapı çizgisi çerçeveden biraz ince: aynı kalınlıkta olunca içindeki
  // boşluk kapanıp dolu blok gibi duruyor.
  if (doors.some((door) => nearPolyline(x, y, door, true, half * 0.72))) {
    return 'ink'
  }

  return null
}

function renderRgba(pixelSize) {
  const half = STROKE_REL / 2
  const pixels = Buffer.alloc(pixelSize * pixelSize * 4)
  const step = 1 / (pixelSize * SAMPLES)
  const offset = step / 2

  for (let py = 0; py < pixelSize; py += 1) {
    for (let px = 0; px < pixelSize; px += 1) {
      let inkHits = 0
      let goldHits = 0
      let edgeHits = 0

      for (let sy = 0; sy < SAMPLES; sy += 1) {
        for (let sx = 0; sx < SAMPLES; sx += 1) {
          const x = (px * SAMPLES + sx) * step + offset
          const y = (py * SAMPLES + sy) * step + offset
          const hit = hitInk(x, y, half)
          if (hit === 'ink') {
            inkHits += 1
          } else if (hit === 'gold') {
            goldHits += 1
          } else if (hit === 'edge') {
            edgeHits += 1
          }
        }
      }

      const weight = inkHits + goldHits + edgeHits
      if (weight === 0) {
        continue
      }

      const index = (py * pixelSize + px) * 4
      for (let channel = 0; channel < 3; channel += 1) {
        pixels[index + channel] = Math.round(
          (INK[channel] * inkHits + GOLD[channel] * goldHits + EDGE[channel] * edgeHits) /
            weight,
        )
      }
      pixels[index + 3] = Math.round((weight / (SAMPLES * SAMPLES)) * 255)
    }
  }

  return pixels
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c
  }
  return table
})()

function crc32(buffer) {
  let crc = -1
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ -1) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData), 0)
  return Buffer.concat([length, typeAndData, crc])
}

function encodePng(size, rgba) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8
  header[9] = 6
  header[10] = 0
  header[11] = 0
  header[12] = 0

  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let row = 0; row < size; row += 1) {
    raw[row * (stride + 1)] = 0
    rgba.copy(raw, row * (stride + 1) + 1, row * stride, (row + 1) * stride)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function downscale(src, srcSize, dstSize) {
  const dst = Buffer.alloc(dstSize * dstSize * 4)
  const scale = srcSize / dstSize
  for (let y = 0; y < dstSize; y += 1) {
    for (let x = 0; x < dstSize; x += 1) {
      const x0 = Math.floor(x * scale)
      const y0 = Math.floor(y * scale)
      const x1 = Math.max(x0 + 1, Math.round((x + 1) * scale))
      const y1 = Math.max(y0 + 1, Math.round((y + 1) * scale))
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      let n = 0
      for (let sy = y0; sy < y1 && sy < srcSize; sy += 1) {
        for (let sx = x0; sx < x1 && sx < srcSize; sx += 1) {
          const i = (sy * srcSize + sx) * 4
          const alpha = src[i + 3]
          r += src[i] * alpha
          g += src[i + 1] * alpha
          b += src[i + 2] * alpha
          a += alpha
          n += 1
        }
      }
      const di = (y * dstSize + x) * 4
      if (a > 0) {
        dst[di] = Math.round(r / a)
        dst[di + 1] = Math.round(g / a)
        dst[di + 2] = Math.round(b / a)
        dst[di + 3] = Math.round(a / n)
      }
    }
  }
  return dst
}

// Tüm katmanlar tek ustadan küçültülür; ayrı çizilince 16px ile 32px farklı
// motife dönüşüyordu.
function pngFor(size, master) {
  if (size === MASTER_SIZE) {
    return encodePng(size, master)
  }
  return encodePng(size, downscale(master, MASTER_SIZE, size))
}

async function main() {
  const root = path.join(__dirname, '..')
  const master = renderRgba(MASTER_SIZE)
  const buffers = ICO_SIZES.map((size) => pngFor(size, master))

  fs.writeFileSync(path.join(root, 'build', 'icon.png'), buffers[buffers.length - 1])
  fs.writeFileSync(path.join(root, 'public', 'icon.png'), buffers[buffers.length - 1])
  // Pencere başlığı bunu kullanır; görev çubuğu ile aynı çizim olsun.
  fs.writeFileSync(path.join(root, 'electron', 'icon.png'), buffers[buffers.length - 1])

  const ico = await pngToIco(buffers)
  fs.writeFileSync(path.join(root, 'build', 'icon.ico'), ico)
  fs.writeFileSync(path.join(root, 'electron', 'icon.ico'), ico)
  // Ayrı ad: Windows aynı .ico yolunun piksellerini önbellekte kilitler.
  fs.writeFileSync(path.join(root, 'electron', 'lf-icon.ico'), ico)

  if (process.argv.includes('--preview')) {
    const previewDir = require('os').tmpdir()
    for (const size of [16, 24, 32, 48, 128]) {
      fs.writeFileSync(path.join(previewDir, `logfarm-mark-${size}.png`), pngFor(size, master))
    }
    console.log(`Preview PNGs written to ${previewDir}`)
  }

  console.log(`icon.ico written (${ICO_SIZES.join(', ')} px)`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
