import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Object3D, Vector3 } from 'three'
import { useJourney, useJourneyStore } from '../../store'
import { lerpAngle, pointAt } from '../../path'
import type { SpinnerRef } from '../../types'
import { Box } from '../primitives'

function Parcel({ id, anchor, root, lane }: { id: string; anchor: React.RefObject<Object3D | null>; root: React.RefObject<Group | null>; lane: number }) {
  const store = useJourneyStore()
  const ref = useRef<Group>(null)
  const tmp = useMemo(() => new Vector3(), [])
  const lift = useMemo(() => new Vector3(0, 0.18, 0), [])
  const doorstep = useMemo(() => new Vector3(), [])
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const st = store.getState()
    const m = st.motion(id)
    const j = st.journeys.find((x) => x.id === id)
    const N = st.route.steps.length
    if (m.s >= st.route.cum[N] - 0.01 && j?.delivered) {
      // Each delivery lands its parcel at a slightly different spot by the door.
      doorstep.copy(st.route.doorstep).add(new Vector3(lane * 0.5, 0, 0))
      g.visible = true
      g.position.lerp(doorstep, 1 - Math.exp(-6 * dt))
      g.rotation.y += (0 - g.rotation.y) * 0.1
    } else if (m.s >= st.route.cum[1] - 0.02 && anchor.current && root.current) {
      g.visible = true
      anchor.current.getWorldPosition(tmp)
      g.position.copy(tmp).add(lift)
      g.rotation.y = root.current.rotation.y
    } else {
      g.visible = false
    }
  })
  return (
    <group ref={ref} visible={false}>
      <Box size={[0.42, 0.36, 0.42]} color="#e2a86b" />
      <Box size={[0.43, 0.37, 0.08]} color="#ff6b6b" edges={false} />
      <Box size={[0.08, 0.37, 0.43]} color="#ff6b6b" edges={false} />
    </group>
  )
}

/** Soft blob under the vehicle. For a flying vehicle it stays on the road, below the body. */
function GroundShadow({ altitude }: { altitude: number }) {
  return (
    <group position={[0, 0.02 - altitude, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1.2, 0.7, 1]}>
        <circleGeometry args={[0.9, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.14} />
      </mesh>
    </group>
  )
}

/** One vehicle: drives along its lane at its vehicle's speed and reports arrivals to the store. */
function VehicleInstance({ id, lane, reducedMotion }: { id: string; lane: number; reducedMotion: boolean }) {
  const store = useJourneyStore()
  const vehicleId = useJourney((s) => s.journeys.find((j) => j.id === id)?.vehicle)
  const vehicle = useJourney((s) => (vehicleId ? s.config.vehicles[vehicleId] : undefined))
  const Model = useJourney((s) => (vehicleId ? s.config.vehicleModels[vehicleId] : undefined))
  const laneOffset = useJourney((s) => s.config.lanes[lane] ?? 0)

  const root = useRef<Group>(null)
  const body = useRef<Group>(null)
  const anchor = useRef<Object3D>(null)
  const spinners = useRef<SpinnerRef[]>([])
  const tmpPos = useMemo(() => new Vector3(), [])
  const tmpDir = useMemo(() => new Vector3(), [])
  const perp = useMemo(() => new Vector3(), [])

  // Fresh registration list every render so a swapped model does not keep stale wheels.
  spinners.current = []
  const register = (r: number, axis: 'z' | 'y' = 'z') => (g: Group | null) => { if (g) spinners.current.push({ g, r, axis }) }

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(0.05, dtRaw)
    const T = clock.elapsedTime + lane * 1.7
    const r = root.current, b = body.current
    if (!r || !b || !vehicle) return
    const st = store.getState()
    const m = st.motion(id)
    const speed = vehicle.speed * (reducedMotion ? 4 : 1)

    const wasMoving = m.s !== m.targetS
    let sign = 0, stepD = 0
    if (wasMoving) {
      sign = Math.sign(m.targetS - m.s)
      const maxStep = speed * dt
      if (Math.abs(m.targetS - m.s) <= maxStep) { stepD = Math.abs(m.targetS - m.s); m.s = m.targetS }
      else { m.s += sign * maxStep; stepD = maxStep }
    }

    const { pos, dir } = pointAt(st.route, m.s, tmpPos, tmpDir)
    perp.set(-dir.z, 0, dir.x).multiplyScalar(laneOffset)
    r.position.copy(pos).add(perp)
    const flying = vehicle.altitude > 0
    r.position.y += vehicle.altitude + (flying ? Math.sin(T * 2.2) * 0.12 : 0)
    spinners.current.forEach((o) => { if (o.g && o.axis === 'y') o.g.rotation.y += dt * 40 })
    if (wasMoving) {
      const dx = dir.x * sign, dz = dir.z * sign
      r.rotation.y = lerpAngle(r.rotation.y, Math.atan2(-dz, dx), 1 - Math.exp(-9 * dt))
      spinners.current.forEach((o) => { if (o.g && o.axis !== 'y') o.g.rotation.z -= stepD / o.r })
      if (flying) {
        b.position.y = 0
        b.rotation.x = 0
        b.rotation.z = -0.18
      } else {
        b.position.y = Math.abs(Math.sin(T * 14)) * 0.04
        b.rotation.x = Math.sin(T * 7) * 0.02
      }
    } else {
      b.position.y = 0
      b.rotation.x = 0
      b.rotation.z += (0 - b.rotation.z) * 0.1
    }
    if (m.hop > 0) {
      m.hop = Math.max(0, m.hop - dt)
      b.position.y += Math.sin((m.hop / 0.45) * Math.PI) * 0.35
    }
    if (wasMoving && m.s === m.targetS) st.arrive(id)
  })

  if (!vehicle || !Model) return null
  return (
    <>
      <group ref={root}>
        <group ref={body}>
          <Model vehicle={vehicle} register={register} anchor={anchor} spinners={spinners} />
        </group>
        <GroundShadow altitude={vehicle.altitude} />
      </group>
      <Parcel id={id} anchor={anchor} root={root} lane={lane} />
    </>
  )
}

/** All vehicles currently on the board, one per journey. */
export function Vehicles({ reducedMotion }: { reducedMotion: boolean }) {
  const journeys = useJourney((s) => s.journeys)
  return (
    <>
      {journeys.map((j) => (
        <VehicleInstance key={j.id} id={j.id} lane={j.lane} reducedMotion={reducedMotion} />
      ))}
    </>
  )
}
