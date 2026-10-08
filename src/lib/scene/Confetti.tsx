import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, InstancedMesh, Object3D, Vector3 } from 'three'
import { useJourney, useJourneyStore } from '../store'

const COUNT = 90
const COLORS = ['#ff6b6b', '#ff922b', '#ffd43b', '#51cf66', '#38d9a9', '#4dabf7', '#748ffc', '#6741d9', '#f783ac']

interface Piece { p: Vector3; v: Vector3; rx: number; ry: number; sx: number; sy: number }

/** Burst of coloured pieces at the final station whenever a delivery completes. */
export function Confetti({ reducedMotion }: { reducedMotion: boolean }) {
  const store = useJourneyStore()
  const mesh = useRef<InstancedMesh>(null)
  const pieces = useRef<Piece[]>([])
  const life = useRef(0)
  const dummy = useMemo(() => new Object3D(), [])
  const deliveredCount = useJourney((s) => s.deliveredCount)

  useEffect(() => {
    if (deliveredCount === 0 || reducedMotion) return
    const { nodes } = store.getState().route
    const at = nodes[nodes.length - 1]
    pieces.current = Array.from({ length: COUNT }, () => {
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 3
      return {
        p: new Vector3(at.x, at.y + 1, at.z),
        v: new Vector3(Math.cos(a) * sp * 0.6, 4 + Math.random() * 4, Math.sin(a) * sp * 0.6),
        rx: 0, ry: 0, sx: Math.random() * 8, sy: Math.random() * 8,
      }
    })
    life.current = 2.6
    if (mesh.current) {
      const c = new Color()
      for (let i = 0; i < COUNT; i++) mesh.current.setColorAt(i, c.set(COLORS[i % COLORS.length]))
      mesh.current.instanceColor!.needsUpdate = true
    }
  }, [deliveredCount, reducedMotion, store])

  useFrame((_, dt) => {
    const m = mesh.current
    if (!m) return
    if (life.current <= 0) { m.visible = false; return }
    m.visible = true
    life.current -= dt
    pieces.current.forEach((c, i) => {
      c.v.y -= 9 * dt
      c.p.addScaledVector(c.v, dt)
      if (c.p.y < 0.1) { c.p.y = 0.1; c.v.set(0, 0, 0) }
      c.rx += c.sx * dt; c.ry += c.sy * dt
      dummy.position.copy(c.p)
      dummy.rotation.set(c.rx, c.ry, 0)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} visible={false} frustumCulled={false}>
      <planeGeometry args={[0.16, 0.1]} />
      <meshBasicMaterial side={2} />
    </instancedMesh>
  )
}
