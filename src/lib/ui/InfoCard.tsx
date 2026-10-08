import type { ReactNode } from 'react'
import { useActiveJourney, useJourney } from '../store'
import type { Journey, Service, Step, Vehicle } from '../types'

/** Everything a custom info card needs. */
export interface InfoCardContext {
  journey: Journey
  service: Service
  vehicle: Vehicle
  /** the step being shown: the target while moving, otherwise the current one; undefined at the depot */
  step?: Step
  stepIndex: number
  totalSteps: number
  moving: boolean
  totalDeliveries: number
  deliveredCount: number
  /** text the default card would show */
  text: { eyebrow: string; title: string; desc: string; status: string }
}

export interface InfoCardProps {
  className?: string
  /** Replace the card's content; receives the computed context */
  render?: (ctx: InfoCardContext) => ReactNode
}

export function useInfoCardContext(): InfoCardContext | null {
  const j = useActiveJourney()
  const route = useJourney((s) => s.route)
  const service = useJourney((s) => s.config.services[s.service])
  const vehicle = useJourney((s) => (j ? s.config.vehicles[j.vehicle] : undefined))
  const totalDeliveries = useJourney((s) => s.journeys.length)
  const deliveredCount = useJourney((s) => s.journeys.filter((x) => x.delivered).length)
  if (!j || !vehicle) return null
  const N = route.steps.length
  const moving = j.phase === 'moving'
  const stepIndex = moving ? j.target : j.current
  const step = stepIndex > 0 ? route.steps[stepIndex - 1] : undefined

  let eyebrow: string, title: string, desc: string, status: string
  if (!step) {
    eyebrow = `${j.label} · ${service.label} · ready at the depot`
    title = 'Select a vehicle, then start the journey'
    desc = `${service.tagline}. ${N} stations, ETA ${service.eta}. ${vehicle.label} covers the route in about ${Math.round(route.total / vehicle.speed)} seconds of animation.`
    status = 'IDLE'
  } else {
    status = step.status
    if (moving) {
      eyebrow = `${j.label} · ${j.target > j.current ? 'heading to' : 'back to'} step ${j.target} of ${N}`
      title = step.name
      desc = step.desc
    } else if (j.delivered) {
      eyebrow = `${j.label} · ${service.doneWord.toLowerCase()} · step ${N} of ${N}`
      title = service.doneWord
      desc = `${step.desc} Select Restart journey to run it again, or add another delivery.`
    } else {
      eyebrow = `${j.label} · arrived · step ${j.current} of ${N}`
      title = step.name
      desc = step.desc
    }
  }
  return { journey: j, service, vehicle, step, stepIndex, totalSteps: N, moving, totalDeliveries, deliveredCount, text: { eyebrow, title, desc, status } }
}

/** Live description of the selected delivery, read by screen readers through aria-live. */
export function InfoCard({ className, render }: InfoCardProps) {
  const ctx = useInfoCardContext()
  if (!ctx) return null
  if (render) return <div className={`dj-card ${className ?? ''}`} aria-live="polite">{render(ctx)}</div>
  const { journey: j, service, vehicle: v, totalSteps: N, totalDeliveries, deliveredCount, text } = ctx
  return (
    <div className={`dj-card ${className ?? ''}`} aria-live="polite">
      <span className="dj-eyebrow">{text.eyebrow}</span>
      <div className="dj-card-title">{text.title}</div>
      <div className="dj-card-desc">{text.desc}</div>
      <div className="dj-meta">
        <span className="dj-chip">{service.label} · {service.eta}</span>
        <span className="dj-chip">vehicle: {v.label} · {v.kmh} km/h</span>
        <span className="dj-chip">status: {text.status}</span>
        {totalDeliveries > 1 && <span className="dj-chip">{deliveredCount} / {totalDeliveries} delivered</span>}
      </div>
      <div className="dj-bar"><i style={{ width: `${(j.current / N) * 100}%` }} /></div>
    </div>
  )
}
