import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh, MeshStandardMaterial } from 'three'
import type { Step } from '../../types'
import { slotOffset } from '../../path'
import { Cyl } from '../primitives'
import { useJourney } from '../../store'
import { Label } from '../Label'

/** Glowing road pad under a station: brighter when a vehicle is there, dim once passed. */
function Pad({ index, pos, color, active }: { index: number; pos: [number, number]; color: string; active: boolean }) {
  const ref = useRef<Mesh>(null)
  const passed = useJourney((s) => s.journeys.some((j) => index < j.maxReached))
  useFrame(({ clock }) => {
    const m = ref.current?.material as MeshStandardMaterial | undefined
    if (!m) return
    const want = active ? 0.45 + 0.15 * Math.sin(clock.elapsedTime * 4) : passed ? 0.12 : 0
    m.emissiveIntensity += (want - m.emissiveIntensity) * 0.15
  })
  return <Cyl ref={ref} radiusTop={1.05} radiusBottom={1.05} height={0.1} color={color} position={[pos[0], 0.1, pos[1]]} segments={28} castShadow={false} />
}

/** One station of the current route: `index` is its position on the route (0-based). */
export function Station({ index, step, slot }: { index: number; step: Step; slot: number }) {
  const active = useJourney((s) =>
    s.journeys.some((j) => (j.phase === 'atStation' || j.phase === 'delivered') && j.current === index + 1),
  )
  const Model = useJourney((s) => s.config.stationModels[step.model])
  const pos = useJourney((s) => s.config.slots[slot])
  const [x, z] = pos
  const [ox, oz] = slotOffset(pos)
  return (
    <group>
      <Pad index={index} pos={pos} color={step.color} active={active} />
      <group position={[x + ox, 0.03, z + oz]} rotation={[0, Math.atan2(-ox, -oz), 0]}>
        {Model ? <Model step={step} active={active} /> : null}
      </group>
      <Label step={step} index={index} position={[x + ox, 4.1, z + oz]} />
    </group>
  )
}

/** Every station of the current route. */
export function Stations() {
  const route = useJourney((s) => s.route)
  return (
    <>
      {route.steps.map((step, i) => (
        <Station key={`${route.stepIds.join('-')}-${i}`} index={i} step={step} slot={route.slots[i]} />
      ))}
    </>
  )
}
