import { Suspense, useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'
import { createConfig, validateConfig } from './config'
import { createJourneyStore, JourneyContext, useJourneyStore, type JourneyStore } from './store'
import { JourneyCanvas } from './scene/JourneyCanvas'
import { BottomBar } from './ui/BottomBar'
import { InfoCard, type InfoCardContext } from './ui/InfoCard'
import { ServiceBar } from './ui/ServiceBar'
import { useReducedMotion } from './useReducedMotion'
import type { Journey, JourneyConfigInput, JourneyTheme, OrderInput, Step } from './types'

export interface JourneyProviderProps {
  config?: JourneyConfigInput
  /** Delivery type to start on (default: first service in the config) */
  defaultService?: string
  children: ReactNode
}

/** Creates one journey store and shares it with everything inside. Use this to compose your own layout. */
export function JourneyProvider({ config, defaultService, children }: JourneyProviderProps) {
  const store = useMemo<JourneyStore>(() => {
    const full = createConfig(config)
    const problems = validateConfig(full)
    if (problems.length) console.warn('[delivery-journey] config problems:\n - ' + problems.join('\n - '))
    return createJourneyStore(full, defaultService)
    // The store is created once; later config changes need a remount (pass a `key`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <JourneyContext.Provider value={store}>{children}</JourneyContext.Provider>
}

export interface DeliveryJourneyProps {
  /** Override or extend steps, services, vehicles, models, colours (merged by key with the defaults) */
  config?: JourneyConfigInput
  /** Delivery type to show. Controlled when `service` is given, otherwise `defaultService` */
  service?: string
  defaultService?: string
  /** Tracking mode: show these orders at their status instead of an empty delivery */
  orders?: OrderInput[]
  /** Show the control bar (default true). Set false for a read-only tracker */
  interactive?: boolean
  showServiceBar?: boolean
  showDeliveries?: boolean
  showVehicles?: boolean
  showInfoCard?: boolean
  showHint?: boolean
  /** Replace the info card's content */
  renderInfoCard?: (ctx: InfoCardContext) => ReactNode
  /** Extra three.js content inside the scene */
  sceneChildren?: ReactNode
  /** Colour and font tokens; any CSS value */
  theme?: JourneyTheme
  /** Height of the whole block (default 660px) */
  height?: number | string
  /** Force reduced motion on or off; defaults to the OS setting */
  reducedMotion?: boolean
  className?: string
  style?: CSSProperties
  /** Store handle for imperative control: `ref.current.getState().goTo(id, 3)` */
  storeRef?: React.MutableRefObject<JourneyStore | null>
  onServiceChange?: (serviceId: string) => void
  onVehicleChange?: (journey: Journey, vehicleId: string) => void
  /** Fires when a delivery reaches a station */
  onStepChange?: (journey: Journey, step: Step, index: number) => void
  /** Fires when a delivery reaches the last station */
  onComplete?: (journey: Journey) => void
}

const THEME_VARS: Record<keyof JourneyTheme, string> = {
  bg: '--dj-bg', surface: '--dj-surface', ink: '--dj-ink', muted: '--dj-muted', line: '--dj-line',
  accent: '--dj-accent', accentInk: '--dj-accent-ink', focus: '--dj-focus', soft: '--dj-soft',
  fontDisplay: '--dj-font-display', fontBody: '--dj-font-body', fontMono: '--dj-font-mono',
}

/** The complete, drop-in delivery journey: service tabs, 3D board, info card and control bar. */
export function DeliveryJourney(props: DeliveryJourneyProps) {
  const { config, defaultService, service } = props
  return (
    <JourneyProvider config={config} defaultService={service ?? defaultService}>
      <JourneyLayout {...props} />
    </JourneyProvider>
  )
}

function JourneyLayout({
  service, orders, interactive = true, showServiceBar = true, showDeliveries = true, showVehicles = true,
  showInfoCard = true, showHint = true, renderInfoCard, sceneChildren, theme, height = 660, reducedMotion,
  className, style, storeRef, onServiceChange, onVehicleChange, onStepChange, onComplete,
}: DeliveryJourneyProps) {
  const store = useJourneyStore()
  const osReduced = useReducedMotion()
  const reduced = reducedMotion ?? osReduced
  const viewport = useRef<HTMLDivElement>(null)

  useEffect(() => { if (storeRef) storeRef.current = store }, [store, storeRef])

  // Controlled service
  useEffect(() => {
    if (service && store.getState().service !== service) store.getState().setService(service)
  }, [service, store])

  // Orders (tracking mode) or one fresh delivery
  const ordersKey = JSON.stringify(orders ?? null)
  useEffect(() => {
    const st = store.getState()
    if (orders) st.setOrders(orders)
    else if (st.journeys.length === 0) st.addJourney()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordersKey, store])

  // Callbacks from state changes
  useEffect(() => {
    let prev = store.getState()
    return store.subscribe((next) => {
      if (onServiceChange && next.service !== prev.service) onServiceChange(next.service)
      next.journeys.forEach((j) => {
        const was = prev.journeys.find((x) => x.id === j.id)
        if (!was) return
        if (onVehicleChange && was.vehicle !== j.vehicle) onVehicleChange(j, j.vehicle)
        const arrived = (j.phase === 'atStation' || j.phase === 'delivered') && (was.phase === 'moving' || was.current !== j.current)
        if (arrived && j.current > 0) {
          const step = next.route.steps[j.current - 1]
          if (step && onStepChange) onStepChange(j, step, j.current)
          if (onComplete && j.delivered && !was.delivered) onComplete(j)
        }
      })
      prev = next
    })
  }, [store, onServiceChange, onVehicleChange, onStepChange, onComplete])

  // Keyboard: arrows and 1–9 move the selected delivery.
  const onKey = (e: React.KeyboardEvent) => {
    if (!interactive) return
    const st = store.getState()
    const j = st.journeys.find((x) => x.id === st.activeId)
    if (!j) return
    if (e.key === 'ArrowRight') { j.started ? st.goTo(j.id, j.target + 1) : st.start(j.id); e.preventDefault() }
    else if (e.key === 'ArrowLeft') { st.goTo(j.id, j.target - 1); e.preventDefault() }
    else if (/^[1-9]$/.test(e.key)) { if (!j.started) st.start(j.id); st.goTo(j.id, +e.key) }
  }

  const themeStyle: CSSProperties = { ...style }
  if (theme) for (const [k, v] of Object.entries(theme)) if (v) (themeStyle as Record<string, string>)[THEME_VARS[k as keyof JourneyTheme]] = v

  return (
    <div className={`dj-root ${className ?? ''}`} style={themeStyle}>
      {showServiceBar && <ServiceBar />}
      <div className="dj-stage" style={{ height }} aria-label="Delivery journey">
        <div className="dj-viewport" ref={viewport} tabIndex={interactive ? 0 : -1} onKeyDown={onKey}>
          <Suspense fallback={<div className="dj-nogl">Loading 3D scene…</div>}>
            <JourneyCanvas reducedMotion={reduced}>{sceneChildren}</JourneyCanvas>
          </Suspense>
          {showInfoCard && <InfoCard render={renderInfoCard} />}
          {showHint && interactive && <div className="dj-hint">Arrow keys or 1–9 to navigate</div>}
        </div>
        {interactive && <BottomBar showDeliveries={showDeliveries} showVehicles={showVehicles} editable={!orders} />}
      </div>
    </div>
  )
}
