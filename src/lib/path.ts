import { Vector3 } from 'three'
import type { JourneyConfig, Step } from './types'

/** A built map: which steps sit in which slots, and the road polyline through them. */
export interface Route {
  stepIds: string[]
  steps: Step[]
  /** slot index for each step */
  slots: number[]
  /** polyline nodes: index 0 = depot, 1..N = stations */
  nodes: Vector3[]
  /** cumulative path distance at each node */
  cum: number[]
  total: number
  /** where the parcel lands at the final station */
  doorstep: Vector3
}

/** Offset of a slot's station model from its road stop: corners go outward, middles go back a row. */
export function slotOffset([x, z]: [number, number]): [number, number] {
  return x > 0 ? [2.9, 0] : x < 0 ? [-2.9, 0] : [0, z < 0 ? -2.9 : 2.9]
}

/** Spread N steps over the slots so a short route still crosses the whole board. */
export function buildRoute(stepIds: string[], config: JourneyConfig): Route {
  const { slots: SLOTS, depot, steps: catalog } = config
  const ids = stepIds.filter((id) => catalog[id]).slice(0, SLOTS.length)
  const N = ids.length
  const last = SLOTS.length - 1
  const slots = ids.map((_, i) => (N <= 1 ? last : Math.round((i * last) / (N - 1))))
  const nodes = [depot, ...slots.map((s) => SLOTS[s])].map(([x, z]) => new Vector3(x, 0.08, z))
  const cum = nodes.reduce<number[]>((acc, p, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + p.distanceTo(nodes[i - 1]))
    return acc
  }, [])
  const end = SLOTS[slots[N - 1] ?? last]
  const [ox, oz] = slotOffset(end)
  const doorstep = new Vector3(end[0] + ox * 0.6, 0.33, end[1] + oz * 0.6)
  return { stepIds: ids, steps: ids.map((id) => catalog[id]), slots, nodes, cum, total: cum[cum.length - 1], doorstep }
}

/** Position and direction of travel at path distance s along a route */
export function pointAt(route: Route, s: number, out = new Vector3(), dir = new Vector3()) {
  const { nodes, cum } = route
  s = Math.max(0, Math.min(route.total, s))
  let i = 1
  while (i < nodes.length - 1 && cum[i] < s) i++
  const a = nodes[i - 1]
  const b = nodes[i] ?? a
  const t = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)
  out.copy(a).lerp(b, t)
  dir.copy(b).sub(a).normalize()
  return { pos: out, dir }
}

export function lerpAngle(a: number, b: number, t: number) {
  const d = ((((b - a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI
  return a + d * t
}

/** Route index (1..N) whose station carries this backend status, or 0 if the route has none. */
export function routeIndexForStatus(route: Route, status: string): number {
  const i = route.steps.findIndex((s) => s.status === status)
  return i < 0 ? 0 : i + 1
}
