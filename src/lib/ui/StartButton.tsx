import { useActiveJourney, useJourney } from '../store'

export interface StartButtonProps {
  className?: string
  labels?: { start?: string; inProgress?: string; restart?: string }
}

/** Start / Restart the selected delivery. */
export function StartButton({ className, labels }: StartButtonProps) {
  const j = useActiveJourney()
  const start = useJourney((s) => s.start)
  const restart = useJourney((s) => s.restart)
  if (!j) return null
  const text = j.delivered ? labels?.restart ?? 'Restart journey' : j.started ? labels?.inProgress ?? 'Journey in progress' : labels?.start ?? 'Start journey'
  return (
    <button
      type="button"
      className={`dj-btn dj-btn-primary ${className ?? ''}`}
      disabled={j.started && !j.delivered}
      onClick={() => (j.delivered ? restart(j.id) : start(j.id))}
    >
      {text}
    </button>
  )
}
