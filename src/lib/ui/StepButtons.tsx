import { useActiveJourney, useJourney } from '../store'

export interface StepButtonsProps {
  className?: string
}

/** One button per station of the current route; moves the selected delivery. */
export function StepButtons({ className }: StepButtonsProps) {
  const j = useActiveJourney()
  const route = useJourney((s) => s.route)
  const goTo = useJourney((s) => s.goTo)
  if (!j) return null
  const moving = j.phase === 'moving'
  return (
    <div className={`dj-steps ${className ?? ''}`} style={{ ['--n' as string]: route.steps.length }} aria-label="Journey steps">
      {route.steps.map((s, i) => {
        const k = i + 1
        const isCurrent = !moving && j.started && k === j.current
        const cls = ['dj-step', k <= j.maxReached && 'dj-done', isCurrent && 'dj-current', moving && k === j.target && 'dj-target'].filter(Boolean).join(' ')
        return (
          <button
            key={`${s.id}-${k}`}
            type="button"
            className={cls}
            style={{ ['--c' as string]: s.color }}
            disabled={!j.started}
            aria-current={isCurrent ? 'step' : undefined}
            onClick={() => goTo(j.id, k)}
          >
            <b>{k}</b>
            <span>{s.short}</span>
          </button>
        )
      })}
    </div>
  )
}
