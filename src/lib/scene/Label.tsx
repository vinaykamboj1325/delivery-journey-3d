import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import type { Step } from '../types'

function draw(step: Step, number: number) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 150
  const x = c.getContext('2d')!
  const r = 40
  x.fillStyle = 'rgba(255,255,255,.96)'
  x.beginPath()
  x.moveTo(r, 10); x.arcTo(502, 10, 502, 140, r); x.arcTo(502, 140, 10, 140, r); x.arcTo(10, 140, 10, 10, r); x.arcTo(10, 10, 502, 10, r)
  x.closePath(); x.fill()
  x.fillStyle = step.color
  x.beginPath(); x.arc(75, 75, 46, 0, Math.PI * 2); x.fill()
  x.fillStyle = '#fff'
  x.font = "600 54px Fredoka, 'Trebuchet MS', sans-serif"
  x.textAlign = 'center'; x.textBaseline = 'middle'
  x.fillText(String(number), 75, 78)
  x.fillStyle = '#142030'
  x.textAlign = 'left'
  x.font = "600 46px Fredoka, 'Trebuchet MS', sans-serif"
  let label = step.name
  while (x.measureText(label).width > 370 && label.length > 3) label = label.slice(0, -2) + '…'
  x.fillText(label, 138, 78)
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** Station name as a camera-facing sprite drawn to a canvas. `index` is the 0-based route position. */
export function Label({ step, index, position }: { step: Step; index: number; position: [number, number, number] }) {
  const number = index + 1
  const tex = useMemo(() => draw(step, number), [step, number])
  useEffect(() => {
    // Redraw once the web font is ready so the label uses Fredoka instead of the fallback.
    let alive = true
    document.fonts?.ready.then(() => {
      if (!alive) return
      const fresh = draw(step, number)
      tex.image = fresh.image
      tex.needsUpdate = true
    })
    return () => { alive = false; tex.dispose() }
  }, [step, number, tex])
  return (
    <sprite position={position} scale={[3.3, 0.97, 1]} renderOrder={10}>
      <spriteMaterial map={tex} depthTest={false} transparent />
    </sprite>
  )
}
