import type { ReactNode } from 'react'
import { useActiveJourney, useJourney } from '../store'

const ICONS: Record<string, ReactNode> = {
  bike: <svg viewBox="0 0 24 24"><circle cx="6" cy="16" r="4" /><circle cx="18" cy="16" r="4" /><path d="M6 16l4-8h5l3 8M10 8l2 8M14 5h3" /></svg>,
  scooter: <svg viewBox="0 0 24 24"><circle cx="6" cy="18" r="3" /><circle cx="18" cy="18" r="3" /><path d="M6 18h10l2-12h3M9 18v-4h6" /></svg>,
  car: <svg viewBox="0 0 24 24"><path d="M3 15l2-5h14l2 5v3H3z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>,
  truck: <svg viewBox="0 0 24 24"><path d="M2 6h12v10H2zM14 10h5l3 3v3h-8z" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>,
  van: <svg viewBox="0 0 24 24"><path d="M3 7h11l4 4h3v6H3zM14 7v4h4" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>,
  drone: <svg viewBox="0 0 24 24"><rect x="9" y="10" width="6" height="4" rx="1" /><path d="M9 12H4M15 12h5M4 9v6M20 9v6M12 14v3M10 17h4" /></svg>,
  robot: <svg viewBox="0 0 24 24"><rect x="5" y="8" width="14" height="9" rx="2" /><path d="M9 12h.01M15 12h.01M12 8V4M10 4h4" /><circle cx="8" cy="19" r="1.5" /><circle cx="16" cy="19" r="1.5" /></svg>,
}
const FALLBACK_ICON = <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /></svg>

/** Icons for the default vehicles; custom vehicles can set `Vehicle.icon`. */
export const defaultVehicleIcons = ICONS

export interface VehiclePickerProps {
  className?: string
  /** Called after the selected delivery's vehicle changes */
  onChange?: (journeyId: string, vehicleId: string) => void
}

/** Vehicle options for the selected delivery. */
export function VehiclePicker({ className, onChange }: VehiclePickerProps) {
  const j = useActiveJourney()
  const vehicles = useJourney((s) => s.config.vehicles)
  const setVehicle = useJourney((s) => s.setVehicle)
  if (!j) return null
  return (
    <div className={`dj-group ${className ?? ''}`} role="radiogroup" aria-label="Select a delivery vehicle">
      <span className="dj-label">Vehicle</span>
      {Object.values(vehicles).map((v) => (
        <button
          key={v.id}
          type="button"
          className="dj-veh"
          role="radio"
          aria-checked={j.vehicle === v.id}
          style={{ ['--vc' as string]: v.color }}
          title={`${v.blurb} · ${v.kmh} km/h`}
          onClick={() => { setVehicle(j.id, v.id); onChange?.(j.id, v.id) }}
        >
          {v.icon ?? ICONS[v.id] ?? FALLBACK_ICON}
          {v.label}
        </button>
      ))}
    </div>
  )
}
