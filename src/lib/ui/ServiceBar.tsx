import { useJourney } from '../store'

export interface ServiceBarProps {
  className?: string
  /** Called after the map changes */
  onChange?: (serviceId: string) => void
}

/** Delivery type tabs. Each one is its own map: a different route of stations across the board. */
export function ServiceBar({ className, onChange }: ServiceBarProps) {
  const service = useJourney((s) => s.service)
  const services = useJourney((s) => s.config.services)
  const vehicles = useJourney((s) => s.config.vehicles)
  const setService = useJourney((s) => s.setService)
  return (
    <div className={`dj-services ${className ?? ''}`} role="tablist" aria-label="Delivery type">
      {Object.values(services).map((s) => (
        <button
          key={s.id}
          type="button"
          role="tab"
          className="dj-service"
          aria-selected={s.id === service}
          onClick={() => { if (s.id !== service) { setService(s.id); onChange?.(s.id) } }}
          title={s.tagline}
        >
          <span className="dj-service-name">{s.label}</span>
          <span className="dj-service-meta">{s.steps.length} stations · {s.eta} · {vehicles[s.vehicle]?.label ?? s.vehicle}</span>
        </button>
      ))}
    </div>
  )
}
