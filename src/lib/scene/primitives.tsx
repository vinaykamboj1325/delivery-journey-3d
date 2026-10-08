import { Edges } from '@react-three/drei'
import { forwardRef, type ReactNode } from 'react'
import type { Mesh } from 'three'

/** Edge-line colour for every primitive (kept constant so models look the same in any config). */
const SCENE = { edge: '#1f2733' }

type Vec3 = [number, number, number]

interface BoxProps {
  size: Vec3
  color: string
  position?: Vec3
  rotation?: Vec3
  emissive?: string
  emissiveIntensity?: number
  edges?: boolean
  castShadow?: boolean
  children?: ReactNode
}

/** A shaded box with thin edge lines, the basic building block of every placeholder model. */
export const Box = forwardRef<Mesh, BoxProps>(function Box(
  { size, color, position, rotation, emissive, emissiveIntensity = 0, edges = true, castShadow = true, children },
  ref,
) {
  return (
    <mesh ref={ref} position={position} rotation={rotation} castShadow={castShadow} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={0.62}
        metalness={0.05}
        emissive={emissive ?? color}
        emissiveIntensity={emissiveIntensity}
      />
      {edges && <Edges threshold={25} color={SCENE.edge} />}
      {children}
    </mesh>
  )
})

interface CylProps {
  radiusTop: number
  radiusBottom: number
  height: number
  color: string
  position?: Vec3
  rotation?: Vec3
  segments?: number
  castShadow?: boolean
  emissive?: string
  emissiveIntensity?: number
}

export const Cyl = forwardRef<Mesh, CylProps>(function Cyl(
  { radiusTop, radiusBottom, height, color, position, rotation, segments = 18, castShadow = true, emissive, emissiveIntensity = 0 },
  ref,
) {
  return (
    <mesh ref={ref} position={position} rotation={rotation} castShadow={castShadow} receiveShadow>
      <cylinderGeometry args={[radiusTop, radiusBottom, height, segments]} />
      <meshStandardMaterial color={color} roughness={0.62} metalness={0.05} emissive={emissive ?? color} emissiveIntensity={emissiveIntensity} />
    </mesh>
  )
})

interface SphProps {
  radius: number
  color: string
  position?: Vec3
  emissive?: string
  emissiveIntensity?: number
}

export const Sph = forwardRef<Mesh, SphProps>(function Sph({ radius, color, position, emissive, emissiveIntensity = 0 }, ref) {
  return (
    <mesh ref={ref} position={position} castShadow receiveShadow>
      <icosahedronGeometry args={[radius, 1]} />
      <meshStandardMaterial color={color} roughness={0.62} metalness={0.05} emissive={emissive ?? color} emissiveIntensity={emissiveIntensity} />
    </mesh>
  )
})

/** Lighter tint of a colour, used for station walls and ground patches. */
export function tint(hex: string, t = 0.55) {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const mix = (c: number) => Math.round(c + (255 - c) * t)
  return `#${((mix(r) << 16) | (mix(g) << 8) | mix(b)).toString(16).padStart(6, '0')}`
}
