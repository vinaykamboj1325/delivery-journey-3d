import type { Group } from 'three'
import type { DefaultVehicleId } from '../../data/vehicles'
import type { VehicleModel, VehicleModelProps } from '../../types'
import { Box, Cyl, Sph } from '../primitives'

export function Wheel({ r, w, position, onRef }: { r: number; w: number; position: [number, number, number]; onRef: (g: Group | null) => void }) {
  return (
    <group ref={onRef} position={position}>
      <Cyl radiusTop={r} radiusBottom={r} height={w} color="#20252e" rotation={[Math.PI / 2, 0, 0]} segments={14} />
      <Cyl radiusTop={r * 0.45} radiusBottom={r * 0.45} height={w + 0.02} color="#d9dee6" rotation={[Math.PI / 2, 0, 0]} segments={10} />
    </group>
  )
}

export function Rider({ x, color }: { x: number; color: string }) {
  return (
    <group>
      <Cyl radiusTop={0.17} radiusBottom={0.2} height={0.55} color="#2f3a4a" position={[x, 1.05, 0]} segments={10} />
      <Sph radius={0.16} color="#f1c7a0" position={[x, 1.45, 0]} />
      <Sph radius={0.18} color={color} position={[x, 1.55, 0]} />
    </group>
  )
}

/* Each model: local +x is forward, `anchor` marks where the parcel sits, `register` wires up wheels/rotors. */

export const VanModel: VehicleModel = ({ vehicle, register: reg, anchor }) => {
  const c = vehicle.color
  return (
      <group>
        {([[-0.6, 0.45], [0.6, 0.45], [-0.6, -0.45], [0.6, -0.45]] as [number, number][]).map(([x, z]) => (
          <Wheel key={`${x}${z}`} r={0.24} w={0.16} position={[x, 0.24, z]} onRef={reg(0.24)} />
        ))}
        {/* tall box body with a short bonnet, sliding door line and roof rails */}
        <Box size={[1.3, 1.0, 0.95]} color={c} position={[-0.25, 0.85, 0]} />
        <Box size={[0.55, 0.55, 0.9]} color={c} position={[0.65, 0.6, 0]} />
        <Box size={[0.05, 0.4, 0.8]} color="#cfe8ff" position={[0.93, 0.95, 0]} />
        <Box size={[0.5, 0.35, 0.05]} color="#cfe8ff" position={[0.15, 0.95, 0.49]} />
        <Box size={[0.5, 0.35, 0.05]} color="#cfe8ff" position={[0.15, 0.95, -0.49]} />
        <Box size={[1.2, 0.04, 0.06]} color="#3a414d" position={[-0.25, 1.38, 0.3]} />
        <Box size={[1.2, 0.04, 0.06]} color="#3a414d" position={[-0.25, 1.38, -0.3]} />
        <Box size={[0.05, 0.12, 0.2]} color="#fff3c4" position={[0.93, 0.45, 0.3]} emissiveIntensity={0.6} edges={false} />
        <Box size={[0.05, 0.12, 0.2]} color="#fff3c4" position={[0.93, 0.45, -0.3]} emissiveIntensity={0.6} edges={false} />
        <object3D ref={anchor} position={[-0.25, 1.55, 0]} />
      </group>
    )
}

export const DroneModel: VehicleModel = ({ vehicle, register: reg, anchor }) => {
  const c = vehicle.color
  return (
      <group>
        {/* body */}
        <Box size={[0.7, 0.22, 0.7]} color={c} position={[0, 0.3, 0]} />
        <Box size={[0.3, 0.12, 0.3]} color="#2b2d42" position={[0, 0.47, 0]} />
        <Sph radius={0.07} color="#ff3b30" position={[0.3, 0.42, 0]} emissiveIntensity={0.8} />
        {/* four arms with rotors that spin on y */}
        {([[0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]] as [number, number][]).map(([x, z]) => (
          <group key={`${x}${z}`}>
            <Box size={[0.08, 0.06, 0.75]} color="#3a414d" position={[x, 0.3, z]} rotation={[0, Math.atan2(x, z), 0]} edges={false} />
            <Cyl radiusTop={0.05} radiusBottom={0.05} height={0.14} color="#3a414d" position={[x, 0.4, z]} segments={8} />
            <group ref={reg(0.1, 'y')} position={[x, 0.48, z]}>
              <Box size={[0.62, 0.02, 0.07]} color="#dee2e6" edges={false} />
              <Box size={[0.07, 0.02, 0.62]} color="#dee2e6" edges={false} />
            </group>
          </group>
        ))}
        {/* claw holding the parcel underneath */}
        <Box size={[0.06, 0.3, 0.06]} color="#9aa3ad" position={[0.18, 0.05, 0.18]} edges={false} />
        <Box size={[0.06, 0.3, 0.06]} color="#9aa3ad" position={[-0.18, 0.05, -0.18]} edges={false} />
        <object3D ref={anchor} position={[0, -0.35, 0]} />
      </group>
    )
}

export const RobotModel: VehicleModel = ({ vehicle, register: reg, anchor }) => {
  const c = vehicle.color
  return (
      <group>
        {([[-0.3, 0.3], [0.3, 0.3], [-0.3, -0.3], [0.3, -0.3], [0, 0.3], [0, -0.3]] as [number, number][]).map(([x, z]) => (
          <Wheel key={`${x}${z}`} r={0.12} w={0.1} position={[x, 0.12, z]} onRef={reg(0.12)} />
        ))}
        {/* cooler-box body with a lid, a face screen and a flag */}
        <Box size={[0.95, 0.5, 0.65]} color={c} position={[0, 0.45, 0]} />
        <Box size={[0.98, 0.1, 0.68]} color="#f8f9fa" position={[0, 0.75, 0]} />
        <Box size={[0.04, 0.22, 0.4]} color="#2b2d42" position={[0.49, 0.5, 0]} />
        <Sph radius={0.04} color="#5ec2ff" position={[0.52, 0.54, 0.1]} emissiveIntensity={1} />
        <Sph radius={0.04} color="#5ec2ff" position={[0.52, 0.54, -0.1]} emissiveIntensity={1} />
        <Cyl radiusTop={0.015} radiusBottom={0.015} height={0.9} color="#9aa3ad" position={[-0.4, 1.2, -0.25]} segments={6} />
        <Box size={[0.25, 0.16, 0.02]} color="#ff922b" position={[-0.28, 1.58, -0.25]} edges={false} />
        <object3D ref={anchor} position={[0, 0.98, 0]} />
      </group>
    )
}

export const BikeModel: VehicleModel = ({ vehicle, register: reg, anchor }) => {
  const c = vehicle.color
  return (
      <group>
        {[-0.55, 0.55].map((x) => (
          <group key={x} ref={reg(0.38)} position={[x, 0.38, 0]}>
            <mesh castShadow><torusGeometry args={[0.33, 0.06, 8, 20]} /><meshStandardMaterial color="#20252e" /></mesh>
            <Box size={[0.6, 0.04, 0.04]} color="#9aa3ad" edges={false} />
          </group>
        ))}
        <Box size={[1.1, 0.08, 0.08]} color={c} position={[0, 0.62, 0]} />
        <Box size={[0.08, 0.5, 0.08]} color={c} position={[0.45, 0.65, 0]} rotation={[0, 0, 0.3]} />
        <Box size={[0.08, 0.08, 0.6]} color="#20252e" position={[0.55, 0.92, 0]} />
        <Box size={[0.6, 0.06, 0.5]} color="#5b6472" position={[-0.55, 0.72, 0]} />
        <Rider x={-0.05} color={c} />
        <object3D ref={anchor} position={[-0.55, 0.98, 0]} />
      </group>
    )
}

export const ScooterModel: VehicleModel = ({ vehicle, register: reg, anchor }) => {
  const c = vehicle.color
  return (
      <group>
        {[-0.5, 0.5].map((x) => <Wheel key={x} r={0.23} w={0.14} position={[x, 0.23, 0]} onRef={reg(0.23)} />)}
        <Box size={[1.05, 0.12, 0.4]} color="#3a414d" position={[0, 0.32, 0]} />
        <Box size={[0.55, 0.4, 0.46]} color={c} position={[-0.25, 0.58, 0]} />
        <Box size={[0.1, 0.85, 0.1]} color={c} position={[0.5, 0.72, 0]} rotation={[0, 0, -0.2]} />
        <Box size={[0.08, 0.08, 0.6]} color="#20252e" position={[0.58, 1.12, 0]} />
        <Box size={[0.5, 0.12, 0.5]} color="#5b6472" position={[-0.45, 0.86, 0]} />
        <Rider x={-0.05} color={c} />
        <object3D ref={anchor} position={[-0.45, 1.15, 0]} />
      </group>
    )
}

export const CarModel: VehicleModel = ({ vehicle, register: reg, anchor }) => {
  const c = vehicle.color
  return (
      <group>
        {([[-0.55, 0.45], [0.55, 0.45], [-0.55, -0.45], [0.55, -0.45]] as [number, number][]).map(([x, z]) => (
          <Wheel key={`${x}${z}`} r={0.24} w={0.16} position={[x, 0.24, z]} onRef={reg(0.24)} />
        ))}
        <Box size={[1.75, 0.45, 0.9]} color={c} position={[0, 0.48, 0]} />
        <Box size={[0.95, 0.42, 0.82]} color="#cfe8ff" position={[-0.1, 0.9, 0]} />
        <Box size={[0.95, 0.06, 0.84]} color={c} position={[-0.1, 1.13, 0]} />
        <Box size={[0.05, 0.12, 0.2]} color="#fff3c4" position={[0.88, 0.5, 0.28]} emissiveIntensity={0.6} edges={false} />
        <Box size={[0.05, 0.12, 0.2]} color="#fff3c4" position={[0.88, 0.5, -0.28]} emissiveIntensity={0.6} edges={false} />
        <Box size={[0.7, 0.05, 0.6]} color="#3a414d" position={[-0.1, 1.2, 0]} />
        <object3D ref={anchor} position={[-0.1, 1.45, 0]} />
      </group>
    )
}

export const TruckModel: VehicleModel = ({ vehicle, register: reg, anchor }) => {
  const c = vehicle.color
  return (
    <group>
      {([[-0.9, 0.48], [-0.4, 0.48], [0.65, 0.48], [-0.9, -0.48], [-0.4, -0.48], [0.65, -0.48]] as [number, number][]).map(([x, z]) => (
        <Wheel key={`${x}${z}`} r={0.25} w={0.18} position={[x, 0.25, z]} onRef={reg(0.25)} />
      ))}
      <Box size={[0.75, 0.85, 0.95]} color={c} position={[0.65, 0.75, 0]} />
      <Box size={[0.05, 0.4, 0.8]} color="#cfe8ff" position={[1.03, 0.95, 0]} />
      <Box size={[1.7, 1.15, 1.05]} color="#f4f1e6" position={[-0.55, 0.95, 0]} />
      <Box size={[1.72, 0.15, 1.07]} color={c} position={[-0.55, 1.47, 0]} />
      <object3D ref={anchor} position={[-0.55, 1.78, 0]} />
    </group>
  )
}


/** Vehicle models shipped with the package, keyed by `Vehicle.id`. Add your own through `config.vehicleModels`. */
export const defaultVehicleModels: Record<DefaultVehicleId, VehicleModel> = {
  bike: BikeModel, scooter: ScooterModel, car: CarModel, truck: TruckModel, van: VanModel, drone: DroneModel, robot: RobotModel,
}

export type { VehicleModelProps }
