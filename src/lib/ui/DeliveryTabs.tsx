import { useJourney } from '../store'

export interface DeliveryTabsProps {
  className?: string
  /** Allow adding and removing deliveries (default true) */
  editable?: boolean
}

/** One tab per delivery on the board, plus Add / Remove. */
export function DeliveryTabs({ className, editable = true }: DeliveryTabsProps) {
  const journeys = useJourney((s) => s.journeys)
  const activeId = useJourney((s) => s.activeId)
  const N = useJourney((s) => s.route.steps.length)
  const vehicles = useJourney((s) => s.config.vehicles)
  const max = useJourney((s) => s.config.maxJourneys)
  const select = useJourney((s) => s.select)
  const addJourney = useJourney((s) => s.addJourney)
  const removeJourney = useJourney((s) => s.removeJourney)
  return (
    <div className={`dj-group dj-deliveries ${className ?? ''}`} role="tablist" aria-label="Deliveries on the board">
      <span className="dj-label">Deliveries</span>
      {journeys.map((j) => {
        const v = vehicles[j.vehicle]
        const stepText = j.delivered ? 'Delivered' : j.started ? `Step ${j.current || j.target} / ${N}` : 'At depot'
        return (
          <button
            key={j.id}
            type="button"
            role="tab"
            className="dj-delivery"
            aria-selected={j.id === activeId}
            style={{ ['--vc' as string]: v?.color }}
            onClick={() => select(j.id)}
          >
            <i />
            <span className="dj-delivery-name">{j.label}</span>
            <span className="dj-delivery-st">{v?.label ?? j.vehicle} · {stepText}</span>
          </button>
        )
      })}
      {editable && (
        <button type="button" className="dj-btn dj-btn-small" onClick={() => addJourney()} disabled={journeys.length >= max} title="Add another delivery">
          + Add delivery
        </button>
      )}
      {editable && journeys.length > 1 && (
        <button type="button" className="dj-btn dj-btn-small dj-btn-ghost" onClick={() => removeJourney(activeId)} title="Remove the selected delivery">
          Remove
        </button>
      )}
    </div>
  )
}
