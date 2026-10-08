import { Canvas } from '@react-three/fiber'
import type { ReactNode } from 'react'
import { useJourney } from '../store'
import { Board } from './Board'
import { CameraRig } from './CameraRig'
import { Confetti } from './Confetti'
import { Stations } from './stations/Stations'
import { Vehicles } from './vehicles/Vehicles'

export interface JourneyCanvasProps {
  reducedMotion?: boolean
  /** Extra three.js content rendered inside the scene (lights and board are already there) */
  children?: ReactNode
  className?: string
}

/** The 3D scene: lights, board, stations, vehicles and confetti for the current journey store. */
export function JourneyCanvas({ reducedMotion = false, children, className }: JourneyCanvasProps) {
  const sky = useJourney((s) => s.config.services[s.service].map.sky)
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true }}
      onCreated={({ gl }) => { gl.toneMappingExposure = 1.12 }}
      style={{ position: 'absolute', inset: 0 }}
      className={className}
    >
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 38, 74]} />
      <hemisphereLight args={['#eaf6ff', '#9a8a6a', 0.8]} />
      <directionalLight
        position={[12, 20, 8]}
        intensity={1.35}
        color="#fff6e6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={1}
        shadow-camera-far={70}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-14, 8, -10]} intensity={0.35} color="#bcd4ff" />
      <CameraRig reducedMotion={reducedMotion} />
      <Board />
      <Stations />
      <Vehicles reducedMotion={reducedMotion} />
      <Confetti reducedMotion={reducedMotion} />
      {children}
    </Canvas>
  )
}
