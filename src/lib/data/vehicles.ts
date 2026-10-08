import type { Vehicle } from '../types'

export type DefaultVehicleId = 'bike' | 'scooter' | 'car' | 'truck' | 'van' | 'drone' | 'robot'

export const defaultVehicles: Record<DefaultVehicleId, Vehicle> = {
  bike: { id: 'bike', label: 'Bike', speed: 4.2, kmh: 18, color: '#ff6b6b', altitude: 0, blurb: 'Eco courier' },
  scooter: { id: 'scooter', label: 'Scooter', speed: 5.6, kmh: 30, color: '#4dabf7', altitude: 0, blurb: 'City quick-commerce' },
  car: { id: 'car', label: 'Car', speed: 7.2, kmh: 45, color: '#ffd43b', altitude: 0, blurb: 'Fastest road option' },
  truck: { id: 'truck', label: 'Truck', speed: 4.8, kmh: 38, color: '#38d9a9', altitude: 0, blurb: 'Bulk line-haul' },
  van: { id: 'van', label: 'Van', speed: 6.0, kmh: 40, color: '#748ffc', altitude: 0, blurb: 'Last-mile parcel van' },
  drone: { id: 'drone', label: 'Drone', speed: 8.5, kmh: 60, color: '#6741d9', altitude: 2.6, blurb: 'Air delivery, flies over traffic' },
  robot: { id: 'robot', label: 'Robot', speed: 2.8, kmh: 6, color: '#f783ac', altitude: 0, blurb: 'Sidewalk delivery robot' },
}
