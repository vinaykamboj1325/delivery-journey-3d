import type { ComponentType, MutableRefObject, ReactNode, RefObject } from 'react'
import type { Group, Object3D } from 'three'

/* ---------- content ---------- */

/** One station on a route. `model` names an entry in `config.stationModels`. */
export interface Step {
  id: string
  name: string
  short: string
  color: string
  /** Order-system status this station stands for */
  status: string
  desc: string
  model: string
}

/** A delivery type. Each one is its own map: an ordered list of step ids. */
export interface Service {
  id: string
  label: string
  tagline: string
  eta: string
  /** Catalogue step ids in route order. The last one is where the parcel ends. */
  steps: string[]
  /** Vehicle a new delivery starts with on this map */
  vehicle: string
  /** Map colours so each service has its own look */
  map: { grass: string; base: string; sky: string }
  /** Word used when the last station is reached, e.g. "Delivered" */
  doneWord: string
}

/** A vehicle type. `id` names an entry in `config.vehicleModels`. */
export interface Vehicle {
  id: string
  label: string
  /** scene units per second along the path */
  speed: number
  /** display value for the info card */
  kmh: number
  color: string
  /** height above the road (drones fly) */
  altitude: number
  /** short description for the UI */
  blurb: string
  /** optional inline SVG icon for the vehicle button */
  icon?: ReactNode
}

export interface SceneColors {
  road: string
  roadDash: string
  lampPost: string
  lampBulb: string
  pond: string
  edge: string
}

/* ---------- 3D model plug-ins ---------- */

export interface StationModelProps {
  step: Step
  /** true while a delivery is stopped at this station */
  active: boolean
}
export type StationModel = ComponentType<StationModelProps>

/** A spinning part of a vehicle: wheels turn on their axle (z) with distance, rotors turn on y all the time. */
export interface SpinnerRef { g: Group | null; r: number; axis?: 'z' | 'y' }

export interface VehicleModelProps {
  vehicle: Vehicle
  /** register a wheel or rotor group: `ref={register(radius)}` or `register(radius, 'y')` */
  register: (r: number, axis?: 'z' | 'y') => (g: Group | null) => void
  /** place an `<object3D ref={anchor}>` where the parcel should sit */
  anchor: RefObject<Object3D | null>
  spinners: MutableRefObject<SpinnerRef[]>
}
export type VehicleModel = ComponentType<VehicleModelProps>

/* ---------- configuration ---------- */

/** Everything the component needs to draw and run a journey. Pass a partial to override any piece. */
export interface JourneyConfig {
  steps: Record<string, Step>
  services: Record<string, Service>
  vehicles: Record<string, Vehicle>
  scene: SceneColors
  stationModels: Record<string, StationModel>
  vehicleModels: Record<string, VehicleModel>
  /** How many deliveries can be on the board at once */
  maxJourneys: number
  /** Lateral road offsets, one per concurrent delivery */
  lanes: number[]
  /** Station slots on the board (x, z) in route order; the road is drawn through the ones in use */
  slots: [number, number][]
  /** Where vehicles wait before the journey starts */
  depot: [number, number]
}

/** Deep-partial of the config: records are merged by key, so one new vehicle is `{ vehicles: { tuk: {...} } }`. */
export type JourneyConfigInput = {
  [K in keyof JourneyConfig]?: JourneyConfig[K] extends Record<string, infer V>
    ? Record<string, V>
    : JourneyConfig[K]
}

/* ---------- runtime ---------- */

export type Phase = 'choose' | 'moving' | 'atStation' | 'delivered'

export interface Journey {
  id: string
  /** Display label, e.g. an order number */
  label: string
  vehicle: string
  lane: number
  phase: Phase
  started: boolean
  /** last route station reached (0 = depot, 1..N) */
  current: number
  /** route station the vehicle is heading to */
  target: number
  maxReached: number
  delivered: boolean
}

/** An order to show on the board (tracking mode). */
export interface OrderInput {
  id: string
  label?: string
  vehicle?: string
  /** backend status; the vehicle is placed at the matching station */
  status?: string
}

/** CSS variables the component root accepts. */
export interface JourneyTheme {
  bg?: string
  surface?: string
  ink?: string
  muted?: string
  line?: string
  accent?: string
  accentInk?: string
  focus?: string
  soft?: string
  fontDisplay?: string
  fontBody?: string
  fontMono?: string
}
