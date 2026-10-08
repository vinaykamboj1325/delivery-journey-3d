import { defaultServices } from './data/services'
import { defaultSteps } from './data/steps'
import { defaultVehicles } from './data/vehicles'
import { defaultStationModels } from './scene/stations/defaultStationModels'
import { defaultVehicleModels } from './scene/vehicles/defaultVehicleModels'
import type { JourneyConfig, JourneyConfigInput } from './types'

/** Twelve station slots in a serpentine over four road rows (x, z), in route order */
export const DEFAULT_SLOTS: [number, number][] = [
  [-6, -7.5], [0, -7.5], [6, -7.5],
  [6, -2.5], [0, -2.5], [-6, -2.5],
  [-6, 2.5], [0, 2.5], [6, 2.5],
  [6, 7.5], [0, 7.5], [-6, 7.5],
]

export const defaultConfig: JourneyConfig = {
  steps: defaultSteps,
  services: defaultServices,
  vehicles: defaultVehicles,
  scene: { road: '#2b2d42', roadDash: '#ffe066', lampPost: '#2b2d42', lampBulb: '#fff3bf', pond: '#74c0fc', edge: '#1f2733' },
  stationModels: defaultStationModels,
  vehicleModels: defaultVehicleModels,
  maxJourneys: 6,
  lanes: [0, 0.5, -0.5, 0.25, -0.25, 0.75],
  slots: DEFAULT_SLOTS,
  depot: [-10, -7.5],
}

/**
 * Build a full config from the defaults plus overrides. Record fields (steps,
 * services, vehicles, models) are merged by key, so adding one vehicle keeps the rest.
 */
export function createConfig(input: JourneyConfigInput = {}, base: JourneyConfig = defaultConfig): JourneyConfig {
  return {
    ...base,
    ...input,
    steps: { ...base.steps, ...(input.steps ?? {}) },
    services: { ...base.services, ...(input.services ?? {}) },
    vehicles: { ...base.vehicles, ...(input.vehicles ?? {}) },
    stationModels: { ...base.stationModels, ...(input.stationModels ?? {}) },
    vehicleModels: { ...base.vehicleModels, ...(input.vehicleModels ?? {}) },
    scene: { ...base.scene, ...(input.scene ?? {}) },
  }
}

/** Validate a config so mistakes show up as one clear error instead of a blank scene. */
export function validateConfig(c: JourneyConfig): string[] {
  const problems: string[] = []
  for (const s of Object.values(c.services)) {
    if (!c.vehicles[s.vehicle]) problems.push(`service "${s.id}" uses unknown vehicle "${s.vehicle}"`)
    if (s.steps.length > c.slots.length) problems.push(`service "${s.id}" has ${s.steps.length} steps but the board has ${c.slots.length} slots`)
    for (const id of s.steps) {
      const st = c.steps[id]
      if (!st) problems.push(`service "${s.id}" uses unknown step "${id}"`)
      else if (!c.stationModels[st.model]) problems.push(`step "${id}" uses unknown station model "${st.model}"`)
    }
  }
  for (const v of Object.values(c.vehicles)) if (!c.vehicleModels[v.id]) problems.push(`vehicle "${v.id}" has no vehicle model`)
  return problems
}
