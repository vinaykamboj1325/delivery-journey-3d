import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import type { DefaultModelKind } from '../../data/steps'
import type { StationModel, StationModelProps } from '../../types'
import { Box, Cyl, Sph, tint } from '../primitives'

type ModelProps = StationModelProps

const setGlow = (m: Mesh | null, v: number) => {
  if (m) (m.material as MeshStandardMaterial).emissiveIntensity = v
}

/* ---------- phone on a stand (ordering, notifications) ---------- */
function PhoneStation({ step, active }: ModelProps) {
  const phone = useRef<Group>(null)
  const screen = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    setGlow(screen.current, active ? 0.55 + 0.35 * Math.sin(t * 5) : 0.25)
    if (phone.current) phone.current.rotation.y = Math.sin(t * 0.9) * 0.12
  })
  return (
    <group>
      <Box size={[1.8, 0.25, 1.2]} color={tint(step.color, 0.3)} position={[0, 0.13, 0]} />
      <group ref={phone} position={[0, 1.5, 0]} rotation={[-0.12, 0, 0]}>
        <Box size={[1.3, 2.3, 0.22]} color="#2b3550" />
        <Box ref={screen} size={[1.1, 1.95, 0.05]} color="#5ec2ff" position={[0, 0.03, 0.12]} emissiveIntensity={0.3} />
        <Box size={[0.55, 0.34, 0.04]} color="#ffffff" position={[0, 0.15, 0.16]} />
        <Box size={[0.7, 0.18, 0.04]} color={step.color} position={[0, -0.55, 0.16]} />
      </group>
    </group>
  )
}

/* ---------- office block (processing, confirmation, documents) ---------- */
function OfficeStation({ step, active }: ModelProps) {
  const wins = useRef<(Mesh | null)[]>([])
  const beacon = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    wins.current.forEach((w, i) => setGlow(w, active ? 0.35 + 0.35 * Math.sin(t * 3 + i) : 0.08))
    setGlow(beacon.current, Math.sin(t * 4) > 0 ? 0.9 : 0.1)
  })
  const windows: React.ReactNode[] = []
  let k = 0
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 2; c++) {
      const i1 = k++, i2 = k++
      windows.push(
        <Box key={i1} ref={(m) => { wins.current[i1] = m }} size={[0.42, 0.38, 0.05]} color="#9fd3ff" position={[-0.45 + c * 0.9, 0.6 + r * 0.7, 1.01]} emissiveIntensity={0.1} />,
        <Box key={i2} ref={(m) => { wins.current[i2] = m }} size={[0.05, 0.38, 0.42]} color="#9fd3ff" position={[1.01, 0.6 + r * 0.7, -0.45 + c * 0.9]} emissiveIntensity={0.1} />,
      )
    }
  return (
    <group>
      <Box size={[2, 2.6, 2]} color={tint(step.color, 0.6)} position={[0, 1.3, 0]} />
      <Box size={[2.1, 0.2, 2.1]} color={step.color} position={[0, 2.7, 0]} />
      <Box size={[2.1, 0.3, 2.1]} color={step.color} position={[0, 0.15, 0]} />
      {windows}
      <Cyl radiusTop={0.04} radiusBottom={0.04} height={0.9} color="#9aa3ad" position={[0.5, 3.2, -0.4]} segments={6} />
      <Sph ref={beacon} radius={0.12} color="#ff3b30" position={[0.5, 3.7, -0.4]} emissiveIntensity={0.2} />
    </group>
  )
}

/* ---------- warehouse with roller door ---------- */
function WarehouseStation({ step, active }: ModelProps) {
  const door = useRef<Mesh>(null)
  useFrame((_, dt) => {
    if (!door.current) return
    const target = active ? 0.12 : 1
    door.current.scale.y += (target - door.current.scale.y) * Math.min(1, dt * 4)
    door.current.position.y = 0.58 + (1.15 * (1 - door.current.scale.y)) / 2
  })
  return (
    <group>
      <Box size={[2.7, 1.6, 2.2]} color={tint(step.color, 0.5)} position={[0, 0.8, 0]} />
      <Box size={[2.9, 0.22, 2.4]} color={step.color} position={[0, 1.7, 0]} />
      <Box size={[2.7, 0.5, 2.2]} color={step.color} position={[0, 0.25, 0]} />
      <Box size={[1.1, 1.15, 0.04]} color="#3a414d" position={[0, 0.58, 1.1]} />
      <Box ref={door} size={[1.1, 1.15, 0.06]} color="#ffe066" position={[0, 0.58, 1.12]} />
      <Box size={[0.45, 0.45, 0.45]} color="#c8955c" position={[1.0, 0.23, 1.5]} />
      <Box size={[0.35, 0.35, 0.35]} color="#b9824a" position={[1.05, 0.63, 1.5]} />
    </group>
  )
}

/* ---------- conveyor with scanner arch ---------- */
function SorterStation({ step, active }: ModelProps) {
  const crates = useRef<(Mesh | null)[]>([])
  const beam = useRef<Mesh>(null)
  useFrame(({ clock }, dt) => {
    const v = active ? 1.4 : 0.35
    crates.current.forEach((b) => {
      if (!b) return
      b.position.x += v * dt
      if (b.position.x > 1.3) b.position.x = -1.3
    })
    setGlow(beam.current, active && Math.sin(clock.elapsedTime * 10) > 0 ? 1 : 0.15)
  })
  return (
    <group>
      {[[-1.2, -0.3], [-1.2, 0.3], [1.2, -0.3], [1.2, 0.3]].map(([x, z], i) => (
        <Box key={i} size={[0.1, 0.7, 0.1]} color="#2b2d42" position={[x, 0.35, z]} />
      ))}
      <Box size={[2.9, 0.16, 0.85]} color={tint(step.color, 0.2)} position={[0, 0.78, 0]} />
      <Box size={[2.9, 0.12, 0.06]} color={step.color} position={[0, 0.9, 0.45]} />
      <Box size={[2.9, 0.12, 0.06]} color={step.color} position={[0, 0.9, -0.45]} />
      <Box size={[0.12, 1.6, 0.12]} color="#9aa3ad" position={[0, 1.05, 0.55]} />
      <Box size={[0.12, 1.6, 0.12]} color="#9aa3ad" position={[0, 1.05, -0.55]} />
      <Box ref={beam} size={[0.14, 0.14, 1.25]} color="#ff3b30" position={[0, 1.85, 0]} emissiveIntensity={0.2} />
      {['#ff922b', '#4dabf7', '#f783ac'].map((c, i) => (
        <Box key={c} ref={(m) => { crates.current[i] = m }} size={[0.38, 0.3, 0.38]} color={c} position={[-1.2 + i * 1.1, 1.01, 0]} />
      ))}
    </group>
  )
}

/* ---------- pallet rack (picking) ---------- */
function RackStation({ step, active }: ModelProps) {
  const mover = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (!mover.current) return
    const z = active ? 0.55 + 0.45 * Math.sin(clock.elapsedTime * 2.2) : 0
    mover.current.position.z += (z - mover.current.position.z) * 0.1
  })
  const cols = ['#ff922b', '#4dabf7', '#f783ac', '#51cf66']
  const crates: React.ReactNode[] = []
  ;[0.45, 1.2, 1.95].forEach((y, r) =>
    [-0.8, 0, 0.8].forEach((x, c) => {
      if ((r + c) % 4 !== 3) crates.push(<Box key={`${r}-${c}`} size={[0.6, 0.48, 0.7]} color={cols[(r * 3 + c) % 4]} position={[x, y + 0.28, 0]} />)
    }),
  )
  return (
    <group>
      {[[-1.2, -0.45], [-1.2, 0.45], [1.2, -0.45], [1.2, 0.45]].map(([x, z], i) => (
        <Box key={i} size={[0.1, 2.4, 0.1]} color={step.color} position={[x, 1.2, z]} />
      ))}
      {[0.45, 1.2, 1.95].map((y) => (
        <Box key={y} size={[2.5, 0.08, 0.95]} color="#dee2e6" position={[0, y, 0]} />
      ))}
      {crates}
      <Box ref={mover} size={[0.6, 0.48, 0.7]} color="#ffd43b" position={[0, 1.48, 0]} />
    </group>
  )
}

/* ---------- packing table and box ---------- */
function PackingStation({ step, active }: ModelProps) {
  const f1 = useRef<Group>(null)
  const f2 = useRef<Group>(null)
  useFrame(({ clock }) => {
    const open = active ? (Math.sin(clock.elapsedTime * 2.4) > 0 ? 0 : 1) : 1
    const tg = open * -1.9
    if (f1.current) f1.current.rotation.x += (-tg - f1.current.rotation.x) * 0.12
    if (f2.current) f2.current.rotation.x += (tg - f2.current.rotation.x) * 0.12
  })
  return (
    <group>
      <Box size={[2.4, 0.12, 1.3]} color={tint(step.color, 0.45)} position={[0, 0.85, 0]} />
      {[[-1.05, -0.5], [-1.05, 0.5], [1.05, -0.5], [1.05, 0.5]].map(([x, z], i) => (
        <Box key={i} size={[0.1, 0.8, 0.1]} color={step.color} position={[x, 0.4, z]} />
      ))}
      <Box size={[0.9, 0.6, 0.8]} color="#c8955c" position={[-0.2, 1.21, 0]} />
      <group ref={f1} position={[-0.2, 1.51, 0.4]}>
        <Box size={[0.9, 0.03, 0.4]} color="#d3a46b" position={[0, 0, -0.2]} />
      </group>
      <group ref={f2} position={[-0.2, 1.51, -0.4]}>
        <Box size={[0.9, 0.03, 0.4]} color="#d3a46b" position={[0, 0, 0.2]} />
      </group>
      <mesh position={[0.75, 1.05, 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.17, 0.07, 8, 16]} />
        <meshStandardMaterial color={step.color} roughness={0.62} />
      </mesh>
    </group>
  )
}

/* ---------- loading dock (dispatch) ---------- */
function DockStation({ step, active }: ModelProps) {
  const stacks = useRef<{ m: Mesh | null; y: number; ph: number }[]>([])
  useFrame(({ clock }) => {
    stacks.current.forEach((o) => {
      if (o.m) o.m.position.y = o.y + (active ? Math.max(0, Math.sin(clock.elapsedTime * 6 + o.ph)) * 0.18 : 0)
    })
  })
  const cols = [['#ff922b', '#4dabf7'], ['#f783ac', '#ffd43b'], ['#38d9a9', '#6741d9']]
  const pallets: [number, number][] = [[-0.75, 0], [0.15, -0.3], [0.85, 0.2]]
  let idx = 0
  return (
    <group>
      <Box size={[2.7, 0.6, 1.9]} color={tint(step.color, 0.35)} position={[0, 0.3, 0]} />
      <Box size={[2.7, 0.1, 0.2]} color="#ffd43b" position={[0, 0.62, 0.95]} />
      {pallets.map(([x, z], i) => (
        <group key={i}>
          <Box size={[0.7, 0.12, 0.7]} color="#a77b4f" position={[x, 0.66, z]} />
          {[0, 1].map((k) => {
            const y = 0.93 + k * 0.42
            const my = idx++
            return <Box key={k} ref={(m) => { stacks.current[my] = { m, y, ph: i + k } }} size={[0.5, 0.4, 0.5]} color={cols[i][k]} position={[x, y, z]} />
          })}
        </group>
      ))}
    </group>
  )
}

/* ---------- route beacon (transit) ---------- */
function BeaconStation({ step, active }: ModelProps) {
  const ring = useRef<Mesh>(null)
  const top = useRef<Mesh>(null)
  useFrame(({ clock }, dt) => {
    if (ring.current) {
      ring.current.rotation.z += dt * (active ? 3 : 0.6)
      setGlow(ring.current, active ? 0.8 : 0.15)
    }
    setGlow(top.current, active ? 0.6 + 0.4 * Math.sin(clock.elapsedTime * 6) : 0.2)
  })
  return (
    <group>
      <Cyl radiusTop={0.9} radiusBottom={1} height={0.25} color={step.color} position={[0, 0.13, 0]} />
      <Cyl radiusTop={0.22} radiusBottom={0.32} height={2.6} color={tint(step.color, 0.45)} position={[0, 1.55, 0]} segments={10} />
      <mesh ref={ring} position={[0, 2.2, 0]} rotation={[Math.PI / 2.3, 0, 0]} castShadow>
        <torusGeometry args={[0.75, 0.07, 8, 32]} />
        <meshStandardMaterial color={step.color} emissive={step.color} emissiveIntensity={0.2} roughness={0.62} />
      </mesh>
      <Sph ref={top} radius={0.3} color="#ffd166" position={[0, 3, 0]} emissiveIntensity={0.3} />
      <Box size={[1.3, 0.55, 0.06]} color="#2e7d4f" position={[0.9, 1, 0.6]} />
      <Box size={[0.08, 0.8, 0.08]} color="#9aa3ad" position={[0.9, 0.4, 0.58]} />
    </group>
  )
}

/* ---------- overnight transit: beacon under a moon with stars ---------- */
function NightStation({ step, active }: ModelProps) {
  const stars = useRef<(Mesh | null)[]>([])
  useFrame(({ clock }) => {
    stars.current.forEach((s, i) => setGlow(s, 0.5 + 0.5 * Math.sin(clock.elapsedTime * (2 + i) + i)))
  })
  return (
    <group>
      <BeaconStation step={step} active={active} />
      <Sph radius={0.35} color="#fff3bf" position={[-1.2, 3.4, -0.6]} emissiveIntensity={0.9} />
      {[[-0.4, 3.9, -1], [0.9, 3.7, -0.8], [1.4, 3.1, 0.6], [-1.6, 2.8, 0.5]].map(([x, y, z], i) => (
        <Sph key={i} ref={(m) => { stars.current[i] = m }} radius={0.07} color="#ffffff" position={[x, y, z]} emissiveIntensity={0.8} />
      ))}
    </group>
  )
}

/* ---------- house with mailbox (delivery / handover / collection) ---------- */
function HouseStation({ step, active }: ModelProps) {
  const lamp = useRef<Mesh>(null)
  useFrame(() => setGlow(lamp.current, active ? 1 : 0.1))
  return (
    <group>
      <Box size={[2.1, 1.4, 1.8]} color="#fff9e6" position={[0, 0.7, 0]} />
      <mesh position={[0, 1.95, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.75, 1.1, 4]} />
        <meshStandardMaterial color={step.color} roughness={0.62} />
      </mesh>
      <Box size={[0.55, 0.9, 0.05]} color={tint(step.color, 0.3)} position={[-0.4, 0.45, 0.91]} />
      <Sph ref={lamp} radius={0.09} color="#ffd166" position={[0.05, 1.05, 0.95]} emissiveIntensity={0.1} />
      <Box size={[0.45, 0.4, 0.05]} color="#a5d8ff" position={[0.55, 0.85, 0.91]} />
      <Cyl radiusTop={0.04} radiusBottom={0.04} height={0.7} color="#7a5536" position={[1.25, 0.35, 1.25]} segments={6} />
      <Box size={[0.3, 0.22, 0.4]} color="#d1495b" position={[1.25, 0.8, 1.25]} />
    </group>
  )
}

/* ---------- parcel locker wall ---------- */
function LockerStation({ step, active }: ModelProps) {
  const open = useRef<Mesh>(null)
  const screen = useRef<Mesh>(null)
  useFrame(({ clock }, dt) => {
    if (open.current) {
      const target = active ? -1.6 : 0
      open.current.rotation.y += (target - open.current.rotation.y) * Math.min(1, dt * 5)
    }
    setGlow(screen.current, active ? 0.6 + 0.3 * Math.sin(clock.elapsedTime * 4) : 0.2)
  })
  const doors: React.ReactNode[] = []
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 4; c++) {
      if (r === 1 && c === 1) continue
      doors.push(<Box key={`${r}${c}`} size={[0.5, 0.42, 0.04]} color={tint(step.color, 0.35)} position={[-0.85 + c * 0.57, 0.45 + r * 0.5, 0.42]} />)
    }
  return (
    <group>
      <Box size={[2.6, 0.2, 1]} color="#9aa3ad" position={[0, 0.1, 0]} />
      <Box size={[2.5, 1.7, 0.8]} color={step.color} position={[0, 1.05, 0]} />
      <Box size={[2.6, 0.12, 0.9]} color="#2b2d42" position={[0, 1.95, 0]} />
      {doors}
      <group position={[-0.53, 0.95, 0.42]}>
        <mesh ref={open} position={[0.25, 0, 0]}>
          <boxGeometry args={[0.5, 0.42, 0.04]} />
          <meshStandardMaterial color="#ffe066" roughness={0.62} />
        </mesh>
        <Box size={[0.3, 0.26, 0.3]} color="#e2a86b" position={[0.25, -0.05, -0.2]} />
      </group>
      <Box ref={screen} size={[0.5, 0.42, 0.05]} color="#5ec2ff" position={[0.86, 1.45, 0.43]} emissiveIntensity={0.2} />
    </group>
  )
}

/* ---------- courier stop with a hand trolley ---------- */
function CourierStation({ step, active }: ModelProps) {
  const trolley = useRef<Group>(null)
  const sign = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (trolley.current) trolley.current.position.x = active ? Math.sin(clock.elapsedTime * 1.6) * 0.5 : 0
    setGlow(sign.current, active ? 0.8 : 0.2)
  })
  return (
    <group>
      <Box size={[2.6, 0.16, 1.4]} color="#d9dee6" position={[0, 0.08, 0]} />
      <Box size={[0.1, 2.2, 0.1]} color="#2b2d42" position={[-1.1, 1.1, -0.5]} />
      <Box size={[0.1, 2.2, 0.1]} color="#2b2d42" position={[1.1, 1.1, -0.5]} />
      <Box size={[2.5, 0.1, 1.2]} color={step.color} position={[0, 2.2, -0.1]} />
      <Box size={[2.3, 1.3, 0.05]} color="#cfe8ff" position={[0, 1.2, -0.52]} />
      <Box ref={sign} size={[1.4, 0.4, 0.06]} color={step.color} position={[0, 1.95, 0.5]} emissiveIntensity={0.2} />
      <group ref={trolley} position={[0, 0, 0.3]}>
        <Box size={[0.6, 0.06, 0.5]} color="#9aa3ad" position={[0, 0.3, 0]} />
        <Box size={[0.05, 1.1, 0.05]} color="#9aa3ad" position={[-0.28, 0.85, -0.22]} />
        <Box size={[0.05, 1.1, 0.05]} color="#9aa3ad" position={[0.28, 0.85, -0.22]} />
        <Cyl radiusTop={0.12} radiusBottom={0.12} height={0.08} color="#20252e" position={[-0.3, 0.12, 0]} rotation={[0, 0, Math.PI / 2]} segments={10} />
        <Cyl radiusTop={0.12} radiusBottom={0.12} height={0.08} color="#20252e" position={[0.3, 0.12, 0]} rotation={[0, 0, Math.PI / 2]} segments={10} />
        <Box size={[0.5, 0.4, 0.45]} color="#e2a86b" position={[0, 0.53, 0.02]} />
        <Box size={[0.42, 0.34, 0.38]} color="#4dabf7" position={[0, 0.9, 0.04]} />
      </group>
    </group>
  )
}

/* ---------- regional hub: long shed with radar dish and a parked trailer ---------- */
function HubStation({ step, active }: ModelProps) {
  const dish = useRef<Group>(null)
  const light = useRef<Mesh>(null)
  useFrame((_, dt) => {
    if (dish.current) dish.current.rotation.y += dt * (active ? 2 : 0.4)
    setGlow(light.current, active ? 0.9 : 0.15)
  })
  return (
    <group>
      <Box size={[3, 1.3, 1.6]} color={tint(step.color, 0.55)} position={[0, 0.65, -0.3]} />
      <Box size={[3.1, 0.18, 1.7]} color={step.color} position={[0, 1.38, -0.3]} />
      <Box size={[3.1, 0.12, 0.08]} color={step.color} position={[0, 0.7, 0.5]} />
      {[-0.9, 0, 0.9].map((x) => <Box key={x} size={[0.6, 0.7, 0.04]} color="#3a414d" position={[x, 0.4, 0.5]} />)}
      <Cyl radiusTop={0.05} radiusBottom={0.05} height={1.1} color="#9aa3ad" position={[1.1, 1.95, -0.6]} segments={6} />
      <group ref={dish} position={[1.1, 2.5, -0.6]}>
        <Cyl radiusTop={0.45} radiusBottom={0.1} height={0.25} color="#dee2e6" position={[0, 0.1, 0]} rotation={[0.9, 0, 0]} segments={14} />
      </group>
      <Sph ref={light} radius={0.1} color="#ff3b30" position={[-1.3, 1.6, -0.3]} emissiveIntensity={0.15} />
      <Box size={[1.1, 0.6, 0.5]} color="#f4f1e6" position={[-0.9, 0.5, 1.1]} />
      <Box size={[1.12, 0.1, 0.52]} color={step.color} position={[-0.9, 0.85, 1.1]} />
    </group>
  )
}

/* ---------- customs gate: barrier arm, booth and flag ---------- */
function CustomsStation({ step, active }: ModelProps) {
  const arm = useRef<Group>(null)
  const lamp = useRef<Mesh>(null)
  useFrame(({ clock }, dt) => {
    if (arm.current) {
      const target = active ? -1.2 : 0
      arm.current.rotation.z += (target - arm.current.rotation.z) * Math.min(1, dt * 4)
    }
    setGlow(lamp.current, active ? (Math.sin(clock.elapsedTime * 8) > 0 ? 1 : 0.2) : 0.1)
  })
  return (
    <group>
      <Box size={[2.8, 0.1, 1.6]} color="#c9ced6" position={[0, 0.05, 0]} />
      <Box size={[0.9, 1.3, 0.9]} color={tint(step.color, 0.5)} position={[-0.9, 0.75, -0.3]} />
      <Box size={[1, 0.14, 1]} color={step.color} position={[-0.9, 1.45, -0.3]} />
      <Box size={[0.5, 0.4, 0.04]} color="#9fd3ff" position={[-0.9, 0.9, 0.16]} />
      <Box size={[0.2, 0.9, 0.2]} color="#3a414d" position={[-0.3, 0.45, 0.5]} />
      <group ref={arm} position={[-0.2, 0.9, 0.5]}>
        <Box size={[1.9, 0.1, 0.1]} color="#ffffff" position={[0.95, 0, 0]} />
        {[0.4, 1.0, 1.6].map((x) => <Box key={x} size={[0.3, 0.11, 0.11]} color="#e03131" position={[x, 0, 0]} edges={false} />)}
      </group>
      <Sph ref={lamp} radius={0.1} color="#ff3b30" position={[-0.3, 1.05, 0.5]} emissiveIntensity={0.1} />
      <Cyl radiusTop={0.03} radiusBottom={0.03} height={2.2} color="#9aa3ad" position={[1.1, 1.1, -0.5]} segments={6} />
      <Box size={[0.7, 0.45, 0.03]} color={step.color} position={[1.45, 1.95, -0.5]} />
      <Box size={[0.9, 0.3, 0.05]} color="#ffffff" position={[0.6, 1.5, 0.2]} />
    </group>
  )
}

/* ---------- airport: runway with a plane that bobs when active ---------- */
function AirportStation({ step, active }: ModelProps) {
  const plane = useRef<Group>(null)
  const lights = useRef<(Mesh | null)[]>([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (plane.current) {
      plane.current.position.y = active ? 1.6 + Math.sin(t * 2) * 0.25 : 0.55
      plane.current.rotation.z = active ? 0.15 : 0
    }
    lights.current.forEach((l, i) => setGlow(l, (Math.sin(t * 6 - i * 0.8) > 0.3 ? 1 : 0.1)))
  })
  return (
    <group>
      <Box size={[3.2, 0.08, 1]} color="#3a414d" position={[0, 0.04, 0.3]} edges={false} />
      {[-1.2, -0.6, 0, 0.6, 1.2].map((x) => <Box key={x} size={[0.35, 0.02, 0.08]} color="#ffffff" position={[x, 0.09, 0.3]} edges={false} />)}
      {[-1.4, -0.7, 0, 0.7, 1.4].map((x, i) => (
        <Sph key={x} ref={(m) => { lights.current[i] = m }} radius={0.06} color="#4dabf7" position={[x, 0.12, 0.85]} emissiveIntensity={0.3} />
      ))}
      <Box size={[1.6, 0.9, 0.8]} color={tint(step.color, 0.55)} position={[-0.6, 0.45, -0.7]} />
      <Box size={[0.5, 1.6, 0.5]} color={tint(step.color, 0.3)} position={[0.8, 0.8, -0.8]} />
      <Box size={[0.7, 0.4, 0.7]} color="#9fd3ff" position={[0.8, 1.75, -0.8]} />
      <group ref={plane} position={[0, 0.55, 0.3]}>
        <Cyl radiusTop={0.16} radiusBottom={0.2} height={1.7} color="#ffffff" rotation={[0, 0, Math.PI / 2]} segments={12} />
        <Cyl radiusTop={0.02} radiusBottom={0.16} height={0.4} color="#ffffff" position={[1.0, 0, 0]} rotation={[0, 0, -Math.PI / 2]} segments={12} />
        <Box size={[0.5, 0.05, 1.9]} color={step.color} position={[0.1, -0.05, 0]} />
        <Box size={[0.4, 0.5, 0.05]} color={step.color} position={[-0.75, 0.3, 0]} />
        <Box size={[0.3, 0.04, 0.8]} color={step.color} position={[-0.75, 0.05, 0]} />
      </group>
    </group>
  )
}

/* ---------- calendar board (slot selection / scheduling) ---------- */
function CalendarStation({ step, active }: ModelProps) {
  const pick = useRef<Mesh>(null)
  const hand = useRef<Group>(null)
  useFrame(({ clock }, dt) => {
    setGlow(pick.current, active ? 0.6 + 0.4 * Math.sin(clock.elapsedTime * 5) : 0.15)
    if (hand.current) hand.current.rotation.z += dt * (active ? 2.5 : 0.3)
  })
  const cells: React.ReactNode[] = []
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 5; c++) {
      const chosen = r === 1 && c === 3
      cells.push(
        <Box key={`${r}${c}`} ref={chosen ? pick : undefined} size={[0.28, 0.24, 0.03]} color={chosen ? step.color : '#ffffff'} position={[-0.7 + c * 0.35, 1.35 - r * 0.32, 0.12]} emissiveIntensity={chosen ? 0.15 : 0} edges={false} />,
      )
    }
  return (
    <group>
      <Box size={[0.12, 1.6, 0.12]} color="#2b2d42" position={[-0.9, 0.8, 0]} />
      <Box size={[0.12, 1.6, 0.12]} color="#2b2d42" position={[0.9, 0.8, 0]} />
      <Box size={[2.1, 1.5, 0.12]} color={tint(step.color, 0.7)} position={[0, 1.2, 0]} />
      <Box size={[2.1, 0.3, 0.14]} color={step.color} position={[0, 1.8, 0]} />
      {cells}
      <group position={[1.6, 0.9, 0.3]}>
        <Cyl radiusTop={0.42} radiusBottom={0.42} height={0.1} color="#ffffff" rotation={[Math.PI / 2, 0, 0]} segments={24} />
        <Cyl radiusTop={0.46} radiusBottom={0.46} height={0.06} color={step.color} rotation={[Math.PI / 2, 0, 0]} segments={24} />
        <group ref={hand} position={[0, 0, 0.07]}>
          <Box size={[0.05, 0.32, 0.03]} color="#2b2d42" position={[0, 0.14, 0]} edges={false} />
        </group>
        <Cyl radiusTop={0.06} radiusBottom={0.06} height={0.6} color="#2b2d42" position={[0, -0.6, -0.1]} segments={6} />
      </group>
    </group>
  )
}

/* ---------- cash desk / payment terminal (COD) ---------- */
function CashStation({ step, active }: ModelProps) {
  const coin = useRef<Group>(null)
  const screen = useRef<Mesh>(null)
  useFrame(({ clock }, dt) => {
    if (coin.current) {
      coin.current.rotation.y += dt * 3
      coin.current.position.y = 1.6 + (active ? Math.abs(Math.sin(clock.elapsedTime * 4)) * 0.4 : 0)
    }
    setGlow(screen.current, active ? 0.8 : 0.2)
  })
  return (
    <group>
      <Box size={[2.2, 0.9, 1]} color={tint(step.color, 0.5)} position={[0, 0.45, 0]} />
      <Box size={[2.3, 0.1, 1.1]} color={step.color} position={[0, 0.95, 0]} />
      <Box size={[0.8, 0.5, 0.6]} color="#3a414d" position={[-0.5, 1.25, -0.1]} />
      <Box ref={screen} size={[0.6, 0.35, 0.04]} color="#5ec2ff" position={[-0.5, 1.3, 0.21]} emissiveIntensity={0.2} />
      <Box size={[0.5, 0.08, 0.7]} color="#f4f1e6" position={[0.5, 1.04, 0]} />
      {[0, 1, 2].map((i) => <Box key={i} size={[0.7, 0.05, 0.35]} color="#51cf66" position={[0.5, 1.12 + i * 0.06, -0.05 + i * 0.03]} edges={false} />)}
      <group ref={coin} position={[0.5, 1.6, 0]}>
        <Cyl radiusTop={0.22} radiusBottom={0.22} height={0.06} color="#ffd43b" rotation={[Math.PI / 2, 0, 0]} segments={20} />
      </group>
      <Box size={[1.2, 0.35, 0.05]} color="#ffffff" position={[0, 1.95, -0.5]} />
      <Box size={[0.08, 0.9, 0.08]} color="#2b2d42" position={[0, 1.45, -0.5]} />
    </group>
  )
}

/* ---------- store front with awning (click & collect) ---------- */
function StoreStation({ step, active }: ModelProps) {
  const sign = useRef<Mesh>(null)
  const door = useRef<Mesh>(null)
  useFrame(({ clock }, dt) => {
    setGlow(sign.current, active ? 0.7 + 0.3 * Math.sin(clock.elapsedTime * 3) : 0.15)
    if (door.current) door.current.rotation.y += ((active ? -1.3 : 0) - door.current.rotation.y) * Math.min(1, dt * 4)
  })
  return (
    <group>
      <Box size={[2.6, 1.8, 1.8]} color="#fff4e0" position={[0, 0.9, -0.2]} />
      <Box size={[2.7, 0.2, 1.9]} color={step.color} position={[0, 1.9, -0.2]} />
      <Box ref={sign} size={[1.8, 0.4, 0.08]} color={step.color} position={[0, 1.55, 0.72]} emissiveIntensity={0.15} />
      {[-0.9, -0.3, 0.3, 0.9].map((x, i) => (
        <Box key={x} size={[0.6, 0.06, 0.8]} color={i % 2 ? '#ffffff' : step.color} position={[x, 1.25, 1.0]} rotation={[0.35, 0, 0]} edges={false} />
      ))}
      <Box size={[0.9, 0.8, 0.05]} color="#9fd3ff" position={[0.7, 0.75, 0.71]} />
      <group position={[-0.8, 0.5, 0.71]}>
        <mesh ref={door} position={[0.25, 0, 0]}>
          <boxGeometry args={[0.5, 1.0, 0.05]} />
          <meshStandardMaterial color="#8a5a36" roughness={0.62} />
        </mesh>
      </group>
      <Box size={[0.6, 0.5, 0.4]} color="#e2a86b" position={[0.6, 0.25, 1.1]} />
    </group>
  )
}

/* ---------- inspection desk with a magnifier (verification / inspection) ---------- */
function InspectStation({ step, active }: ModelProps) {
  const glass = useRef<Group>(null)
  const lamp = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (glass.current) {
      glass.current.position.x = active ? Math.sin(clock.elapsedTime * 2) * 0.35 : 0
      glass.current.position.y = 1.45 + (active ? Math.abs(Math.cos(clock.elapsedTime * 2)) * 0.1 : 0)
    }
    setGlow(lamp.current, active ? 0.9 : 0.2)
  })
  return (
    <group>
      <Box size={[2.3, 0.12, 1.1]} color={tint(step.color, 0.4)} position={[0, 0.85, 0]} />
      {[[-1, -0.4], [-1, 0.4], [1, -0.4], [1, 0.4]].map(([x, z], i) => (
        <Box key={i} size={[0.1, 0.8, 0.1]} color={step.color} position={[x, 0.4, z]} />
      ))}
      <Box size={[0.6, 0.45, 0.55]} color="#e2a86b" position={[0, 1.13, 0]} />
      <group ref={glass} position={[0, 1.45, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.3, 0.05, 8, 24]} />
          <meshStandardMaterial color="#2b2d42" roughness={0.62} />
        </mesh>
        <Cyl radiusTop={0.26} radiusBottom={0.26} height={0.02} color="#a5d8ff" segments={24} />
        <Box size={[0.08, 0.08, 0.5]} color="#2b2d42" position={[0, 0, 0.5]} edges={false} />
      </group>
      <Box size={[0.06, 1.0, 0.06]} color="#2b2d42" position={[0.9, 1.4, -0.4]} />
      <Box size={[0.4, 0.15, 0.3]} color={step.color} position={[0.8, 1.95, -0.3]} rotation={[0, 0, -0.4]} />
      <Sph ref={lamp} radius={0.08} color="#ffd166" position={[0.7, 1.86, -0.25]} emissiveIntensity={0.2} />
      <Box size={[0.5, 0.35, 0.03]} color="#ffffff" position={[-0.8, 1.05, 0.2]} rotation={[-0.5, 0, 0]} edges={false} />
    </group>
  )
}

/* ---------- refund counter / bank with coins (refund or replacement) ---------- */
function RefundStation({ step, active }: ModelProps) {
  const coins = useRef<(Mesh | null)[]>([])
  const screen = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    coins.current.forEach((c, i) => { if (c) c.position.y = 1.25 + i * 0.09 + (active ? Math.max(0, Math.sin(clock.elapsedTime * 5 - i)) * 0.25 : 0) })
    setGlow(screen.current, active ? 0.8 : 0.2)
  })
  return (
    <group>
      <Box size={[2.4, 1.3, 1.5]} color={tint(step.color, 0.55)} position={[0, 0.65, -0.2]} />
      <Box size={[2.6, 0.25, 1.7]} color={step.color} position={[0, 1.4, -0.2]} />
      {[-0.8, 0, 0.8].map((x) => <Box key={x} size={[0.2, 1.1, 0.2]} color="#ffffff" position={[x, 0.55, 0.6]} />)}
      <Box size={[2.6, 0.12, 0.3]} color="#ffffff" position={[0, 1.15, 0.6]} />
      <Box size={[0.9, 0.45, 0.06]} color="#2b2d42" position={[0, 1.85, -0.2]} />
      <Box ref={screen} size={[0.8, 0.35, 0.04]} color="#51cf66" position={[0, 1.85, -0.16]} emissiveIntensity={0.2} />
      {[0, 1, 2, 3].map((i) => (
        <Cyl key={i} ref={(m) => { coins.current[i] = m }} radiusTop={0.18} radiusBottom={0.18} height={0.06} color="#ffd43b" position={[0.9, 1.25 + i * 0.09, 0.95]} segments={18} />
      ))}
      <Box size={[0.5, 0.3, 0.4]} color="#e2a86b" position={[-0.9, 1.35, 0.9]} />
    </group>
  )
}

/** Station models shipped with the package, keyed by `Step.model`. Add your own through `config.stationModels`. */
export const defaultStationModels: Record<DefaultModelKind, StationModel> = {
  phone: PhoneStation, office: OfficeStation, warehouse: WarehouseStation, sorter: SorterStation, rack: RackStation,
  packing: PackingStation, dock: DockStation, beacon: BeaconStation, house: HouseStation, locker: LockerStation,
  courier: CourierStation, hub: HubStation, customs: CustomsStation, airport: AirportStation, calendar: CalendarStation,
  cash: CashStation, store: StoreStation, inspect: InspectStation, refund: RefundStation, night: NightStation,
}

export {
  PhoneStation, OfficeStation, WarehouseStation, SorterStation, RackStation, PackingStation, DockStation, BeaconStation,
  HouseStation, LockerStation, CourierStation, HubStation, CustomsStation, AirportStation, CalendarStation, CashStation,
  StoreStation, InspectStation, RefundStation, NightStation,
}
