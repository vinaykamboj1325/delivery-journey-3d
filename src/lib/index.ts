/* delivery-journey-3d — public API */

// Styles are extracted to dist/styles.css; hosts import 'delivery-journey-3d/styles.css'.
import './styles.css'

// Drop-in component and provider
export { DeliveryJourney, JourneyProvider } from './DeliveryJourney'
export type { DeliveryJourneyProps, JourneyProviderProps } from './DeliveryJourney'

// Parts, for composing your own layout inside <JourneyProvider>
export { JourneyCanvas } from './scene/JourneyCanvas'
export type { JourneyCanvasProps } from './scene/JourneyCanvas'
export { ServiceBar } from './ui/ServiceBar'
export { BottomBar } from './ui/BottomBar'
export { DeliveryTabs } from './ui/DeliveryTabs'
export { VehiclePicker, defaultVehicleIcons } from './ui/VehiclePicker'
export { StepButtons } from './ui/StepButtons'
export { StartButton } from './ui/StartButton'
export { InfoCard, useInfoCardContext } from './ui/InfoCard'
export type { InfoCardContext, InfoCardProps } from './ui/InfoCard'

// State
export { createJourneyStore, useJourney, useJourneyStore, useActiveJourney, JourneyContext } from './store'
export type { JourneyState, JourneyStore, Motion } from './store'

// Configuration and defaults
export { createConfig, defaultConfig, validateConfig, DEFAULT_SLOTS } from './config'
export { defaultSteps, PALETTE } from './data/steps'
export type { DefaultModelKind } from './data/steps'
export { defaultServices } from './data/services'
export type { DefaultServiceId } from './data/services'
export { defaultVehicles } from './data/vehicles'
export type { DefaultVehicleId } from './data/vehicles'

// Routing helpers
export { buildRoute, pointAt, routeIndexForStatus, slotOffset } from './path'
export type { Route } from './path'

// 3D building blocks for custom station and vehicle models
export { Box, Cyl, Sph, tint } from './scene/primitives'
export { Label } from './scene/Label'
export * from './scene/stations/defaultStationModels'
export * from './scene/vehicles/defaultVehicleModels'

// Hooks
export { useReducedMotion } from './useReducedMotion'

// Types
export type {
  Step, Service, Vehicle, SceneColors, StationModel, StationModelProps, VehicleModel, VehicleModelProps, SpinnerRef,
  JourneyConfig, JourneyConfigInput, Journey, Phase, OrderInput, JourneyTheme,
} from './types'
