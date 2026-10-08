import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { useJourney } from '../store'
import { Box, Cyl, Sph, tint } from './primitives'

/* Decoration sits between the four road rows (z = -7.5, -2.5, 2.5, 7.5) and clear of the station models. */
const TREES: [number, number][] = [
  [-3, -5], [3, -5], [-3, 0], [3, 0], [-3, 5], [3, 5],
  [-9.6, -5], [9.6, -5], [-9.6, 0], [9.6, 0], [-9.6, 5], [9.6, 5],
  [3, -10.3], [-3, 10.3], [3, 10.3],
]
const TREE_COLORS = ['#51cf66', '#40c057', '#8ce99a', '#ff922b', '#69db7c', '#94d82d']
const LAMPS: [number, number][] = [[-3, -8.7], [3, -8.7], [-3, -1.3], [3, -1.3], [-3, 3.7], [3, 3.7], [-3, 8.7], [3, 8.7]]
const FLOWERS: [string, number, number][] = [['#ff6b6b', -10.4, -9.6], ['#ffd43b', -9.8, -10], ['#f783ac', -10.2, -9], ['#6741d9', -9.4, -9.4]]

/** Road segments and dashes along the current route. */
function Road() {
  const nodes = useJourney((s) => s.route.nodes)
  const scene = useJourney((s) => s.config.scene)
  const segments = []
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1], b = nodes[i]
    const len = a.distanceTo(b)
    const mid = a.clone().add(b).multiplyScalar(0.5)
    const horiz = Math.abs(b.x - a.x) > Math.abs(b.z - a.z)
    segments.push(
      <Box key={`r${i}`} size={horiz ? [len + 1.7, 0.06, 1.7] : [1.7, 0.06, len + 1.7]} color={scene.road} position={[mid.x, 0.05, mid.z]} edges={false} castShadow={false} />,
    )
    const n = Math.floor(len / 0.9)
    for (let k = 1; k < n; k++) {
      const p = a.clone().lerp(b, k / n)
      segments.push(
        <Box key={`d${i}-${k}`} size={horiz ? [0.38, 0.02, 0.09] : [0.09, 0.02, 0.38]} color={scene.roadDash} position={[p.x, 0.09, p.z]} edges={false} castShadow={false} />,
      )
    }
  }
  return <>{segments}</>
}

function Tree({ x, z, i }: { x: number; z: number; i: number }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.3 + i * 0.7) * 0.03
  })
  return (
    <group ref={ref} position={[x, 0, z]}>
      <Cyl radiusTop={0.12} radiusBottom={0.16} height={0.7} color="#8a5a36" position={[0, 0.35, 0]} segments={8} />
      <Sph radius={0.62 + ((i * 37) % 5) * 0.06} color={TREE_COLORS[i % 6]} position={[0, 1.15, 0]} />
    </group>
  )
}

function Depot() {
  const depot = useJourney((s) => s.config.depot)
  const flag = useRef<any>(null)
  useFrame(({ clock }) => {
    if (flag.current) flag.current.rotation.y = Math.sin(clock.elapsedTime * 3) * 0.25
  })
  const [x, z] = depot
  return (
    <group>
      <Box size={[1.8, 0.16, 2.2]} color="#ffe066" position={[x - 0.2, 0.1, z]} />
      <Box size={[0.12, 1.6, 0.12]} color="#f8f9fa" position={[x - 0.9, 0.8, z - 1]} />
      <Box ref={flag} size={[0.7, 0.4, 0.04]} color="#ff6b6b" position={[x - 0.55, 1.4, z - 1]} />
    </group>
  )
}

/** A small park fills any slot the current route does not use. */
function Park({ x, z, i }: { x: number; z: number; i: number }) {
  return (
    <group position={[x, 0, z]}>
      <Cyl radiusTop={1.1} radiusBottom={1.1} height={0.05} color="#b9e4a3" position={[0, 0.04, 0]} segments={24} castShadow={false} />
      <Box size={[0.9, 0.08, 0.3]} color="#8a5a36" position={[0.4, 0.3, 0.5]} />
      <Box size={[0.9, 0.3, 0.05]} color="#8a5a36" position={[0.4, 0.45, 0.62]} />
      <Sph radius={0.3} color={TREE_COLORS[(i + 2) % 6]} position={[-0.7, 0.55, -0.4]} />
      <Cyl radiusTop={0.06} radiusBottom={0.08} height={0.35} color="#8a5a36" position={[-0.7, 0.17, -0.4]} segments={6} />
    </group>
  )
}

/** Ground, roads, patches, trees, lamps and the depot. Ground colours come from the service's map. */
export function Board() {
  const map = useJourney((s) => s.config.services[s.service].map)
  const route = useJourney((s) => s.route)
  const slots = useJourney((s) => s.config.slots)
  const scene = useJourney((s) => s.config.scene)
  const used = new Map(route.slots.map((slot, i) => [slot, route.steps[i]]))
  return (
    <group>
      <Box size={[23, 0.7, 23]} color={map.base} position={[0, -0.36, 0]} />
      <Box size={[22.4, 0.06, 22.4]} color={map.grass} position={[0, 0, 0]} edges={false} />
      {slots.map(([x, z], i) => {
        const step = used.get(i)
        return step
          ? <Box key={`patch${i}`} size={[5.6, 0.04, 4.6]} color={tint(step.color, 0.75)} position={[x, 0.035, z]} edges={false} castShadow={false} />
          : <Park key={`park${i}`} x={x} z={z} i={i} />
      })}
      <Road />
      <Depot />
      <Cyl radiusTop={1.2} radiusBottom={1.2} height={0.08} color={scene.pond} position={[-3.2, 0.04, -10.2]} segments={24} castShadow={false} />
      {FLOWERS.map(([c, x, z], i) => (
        <group key={`f${i}`}>
          <Sph radius={0.18} color={c} position={[x, 0.25, z]} />
          <Cyl radiusTop={0.03} radiusBottom={0.03} height={0.3} color="#40c057" position={[x, 0.12, z]} segments={6} />
        </group>
      ))}
      {LAMPS.map(([x, z], i) => (
        <group key={`l${i}`}>
          <Cyl radiusTop={0.05} radiusBottom={0.07} height={2.2} color={scene.lampPost} position={[x, 1.1, z]} segments={6} />
          <Sph radius={0.16} color={scene.lampBulb} position={[x, 2.3, z]} />
        </group>
      ))}
      {TREES.map(([x, z], i) => (
        <Tree key={`t${i}`} x={x} z={z} i={i} />
      ))}
    </group>
  )
}
