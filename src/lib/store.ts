import { createContext, useContext } from 'react'
import { createStore, useStore, type StoreApi } from 'zustand'
import { buildRoute, routeIndexForStatus, type Route } from './path'
import type { Journey, JourneyConfig, OrderInput } from './types'

/**
 * Per-frame motion values for one journey. Kept outside React state so the
 * render loop can mutate them 60 times a second without re-rendering the UI.
 */
export interface Motion {
  s: number
  targetS: number
  hop: number
}

export interface JourneyState {
  config: JourneyConfig
  /** Selected delivery type; decides the map */
  service: string
  route: Route
  journeys: Journey[]
  /** id of the journey the bottom bar controls and the camera follows */
  activeId: string
  /** increments on every delivery, used to fire the confetti burst */
  deliveredCount: number
  /** motion values per journey id (mutable, not reactive) */
  motions: Map<string, Motion>

  motion: (id: string) => Motion
  /** Switch map. Clears the board and adds one fresh delivery with the service's default vehicle. */
  setService: (id: string) => void
  addJourney: (vehicle?: string, label?: string) => string | null
  removeJourney: (id: string) => void
  select: (id: string) => void
  setVehicle: (id: string, v: string) => void
  start: (id: string) => void
  /** Drive to a route station (1..N). Passes through every stop in between. */
  goTo: (id: string, step: number) => void
  /** Called by the scene when a vehicle reaches its target. */
  arrive: (id: string) => void
  restart: (id: string) => void
  /** Jump straight to a route station (tracking). */
  syncToStep: (id: string, step: number) => void
  /** Replace the board with these orders, each placed at its status. */
  setOrders: (orders: OrderInput[]) => void
}

export type JourneyStore = StoreApi<JourneyState>

let seq = 0
const newId = () => `j${++seq}`

const update = (list: Journey[], id: string, patch: Partial<Journey>) =>
  list.map((j) => (j.id === id ? { ...j, ...patch } : j))

export function createJourneyStore(config: JourneyConfig, initialService?: string): JourneyStore {
  const firstService = initialService && config.services[initialService] ? initialService : Object.keys(config.services)[0]
  return createStore<JourneyState>((set, get) => ({
    config,
    service: firstService,
    route: buildRoute(config.services[firstService].steps, config),
    journeys: [],
    activeId: '',
    deliveredCount: 0,
    motions: new Map(),

    motion: (id) => {
      const { motions } = get()
      let m = motions.get(id)
      if (!m) { m = { s: 0, targetS: 0, hop: 0 }; motions.set(id, m) }
      return m
    },

    setService: (service) => {
      const { config: c, motions } = get()
      if (!c.services[service]) return
      motions.clear()
      set({ service, route: buildRoute(c.services[service].steps, c), journeys: [], activeId: '' })
      get().addJourney(c.services[service].vehicle)
    },

    addJourney: (vehicle, label) => {
      const { journeys, service, config: c } = get()
      if (journeys.length >= c.maxJourneys) return null
      const used = new Set(journeys.map((j) => j.lane))
      const lane = Math.max(0, c.lanes.findIndex((_, i) => !used.has(i)))
      const id = newId()
      get().motion(id).hop = 0.5
      // Default label: the lowest order number not already on the board.
      let n = 1001
      while (journeys.some((j) => j.label === `Order #${n}`)) n++
      const v = vehicle && c.vehicles[vehicle] ? vehicle : c.services[service].vehicle
      const j: Journey = {
        id, label: label ?? `Order #${n}`, vehicle: v, lane,
        phase: 'choose', started: false, current: 0, target: 0, maxReached: 0, delivered: false,
      }
      set({ journeys: [...journeys, j], activeId: id })
      return id
    },

    removeJourney: (id) => {
      const { journeys, activeId, motions } = get()
      if (journeys.length <= 1) return
      motions.delete(id)
      const rest = journeys.filter((j) => j.id !== id)
      set({ journeys: rest, activeId: activeId === id ? rest[rest.length - 1].id : activeId })
    },

    select: (id) => set({ activeId: id }),

    setVehicle: (id, vehicle) => {
      if (!get().config.vehicles[vehicle]) return
      get().motion(id).hop = 0.5
      set({ journeys: update(get().journeys, id, { vehicle }) })
    },

    start: (id) => {
      const j = get().journeys.find((x) => x.id === id)
      if (!j) return
      set({ journeys: update(get().journeys, id, { started: true, delivered: false }) })
      get().goTo(id, j.current > 0 ? j.current : 1)
    },

    goTo: (id, step) => {
      const { journeys, route } = get()
      const j = journeys.find((x) => x.id === id)
      if (!j || !j.started) return
      const k = Math.max(1, Math.min(route.steps.length, step))
      const m = get().motion(id)
      m.targetS = route.cum[k]
      if (m.s === m.targetS) {
        set({ journeys: update(get().journeys, id, { target: k }) })
        get().arrive(id)
        return
      }
      set({ journeys: update(get().journeys, id, { target: k, phase: 'moving' }) })
    },

    arrive: (id) => {
      const { journeys, route } = get()
      const j = journeys.find((x) => x.id === id)
      if (!j) return
      get().motion(id).hop = 0.45
      const delivered = j.target === route.steps.length
      set((s) => ({
        journeys: update(s.journeys, id, {
          current: j.target,
          maxReached: Math.max(j.maxReached, j.target),
          phase: delivered ? 'delivered' : 'atStation',
          delivered,
        }),
        deliveredCount: delivered && !j.delivered ? s.deliveredCount + 1 : s.deliveredCount,
      }))
    },

    restart: (id) => {
      const m = get().motion(id)
      m.s = 0; m.targetS = 0; m.hop = 0.45
      set({ journeys: update(get().journeys, id, { started: false, phase: 'choose', current: 0, target: 0, maxReached: 0, delivered: false }) })
    },

    syncToStep: (id, step) => {
      const { route } = get()
      const N = route.steps.length
      const k = Math.max(0, Math.min(N, step))
      const m = get().motion(id)
      m.s = route.cum[k]; m.targetS = route.cum[k]
      set({
        journeys: update(get().journeys, id, {
          started: k > 0, current: k, target: k, maxReached: k, delivered: k === N,
          phase: k === 0 ? 'choose' : k === N ? 'delivered' : 'atStation',
        }),
      })
    },

    setOrders: (orders) => {
      get().motions.clear()
      set({ journeys: [], activeId: '' })
      orders.forEach((o) => {
        const id = get().addJourney(o.vehicle, o.label ?? o.id)
        if (id && o.status) get().syncToStep(id, routeIndexForStatus(get().route, o.status))
      })
      const first = get().journeys[0]
      if (first) set({ activeId: first.id })
    },
  }))
}

/* ---------- React bindings ---------- */

export const JourneyContext = createContext<JourneyStore | null>(null)

/** Read a slice of the journey state. Must be used inside `<DeliveryJourney>` or `<JourneyProvider>`. */
export function useJourney<T>(selector: (s: JourneyState) => T): T {
  const store = useContext(JourneyContext)
  if (!store) throw new Error('useJourney must be used inside <DeliveryJourney> or <JourneyProvider>')
  return useStore(store, selector)
}

/** The raw store, for imperative access (`store.getState().goTo(...)`). */
export function useJourneyStore(): JourneyStore {
  const store = useContext(JourneyContext)
  if (!store) throw new Error('useJourneyStore must be used inside <DeliveryJourney> or <JourneyProvider>')
  return store
}

/** The journey the UI is controlling (undefined before the first one is added). */
export const useActiveJourney = () =>
  useJourney((s) => s.journeys.find((j) => j.id === s.activeId) ?? s.journeys[0])
