import { BrowserRouter, Link, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { DeliveryJourney, type OrderInput } from '../lib'
import { DocsPage } from './DocsPage'
import './demo.css'

/** Stand-in for a backend: demo orders per tracking id. */
const DEMO: Record<string, { service: string; orders: OrderInput[] }> = {
  demo1: { service: 'standard', orders: [{ id: 'Order #4821', status: 'PICKED', vehicle: 'bike' }] },
  demo2: { service: 'standard', orders: [{ id: 'Order #4822', status: 'IN_TRANSIT', vehicle: 'car' }] },
  demo3: { service: 'standard', orders: [{ id: 'Order #4823', status: 'DELIVERED', vehicle: 'truck' }] },
  demo4: { service: 'international', orders: [{ id: 'Order #4824', status: 'CUSTOMS_CLEARANCE', vehicle: 'truck' }] },
  demo5: { service: 'pickup', orders: [{ id: 'Order #4825', status: 'READY_FOR_PICKUP', vehicle: 'robot' }] },
  demo6: { service: 'sameday', orders: [{ id: 'Order #4826', status: 'PACKED', vehicle: 'drone' }] },
  demo7: { service: 'cod', orders: [{ id: 'Order #4827', status: 'PAYMENT_COLLECTED', vehicle: 'scooter' }] },
  demo8: { service: 'return', orders: [{ id: 'Return #0911', status: 'INSPECTION', vehicle: 'bike' }] },
  all: {
    service: 'standard',
    orders: [
      { id: 'Order #4821', status: 'PICKED', vehicle: 'bike' },
      { id: 'Order #4822', status: 'IN_TRANSIT', vehicle: 'car' },
      { id: 'Order #4823', status: 'DELIVERED', vehicle: 'truck' },
    ],
  },
}

function Header({ sub }: { sub: string }) {
  return (
    <header className="demo-head">
      <span className="demo-eyebrow">{sub}</span>
      <h1>Delivery Journey 3D</h1>
      <nav className="demo-nav">
        <Link to="/journey">Interactive</Link>
        <Link to="/track/demo2">Track one</Link>
        <Link to="/track/all">Track many</Link>
        <Link to="/track/demo4">International</Link>
        <Link to="/embed">Read-only embed</Link>
        <Link to="/docs" className="demo-nav-strong">Setup guide</Link>
      </nav>
    </header>
  )
}

/** Full interactive page: every delivery type, add deliveries, drive them. */
function JourneyPage() {
  return (
    <main className="demo">
      <Header sub="Order-delivery flow · interactive" />
      <DeliveryJourney
        onStepChange={(j, step, i) => console.log('step', j.label, i, step.name)}
        onComplete={(j) => console.log('complete', j.label)}
      />
    </main>
  )
}

/** Tracking page: orders are placed at their live status; the user can still move them. */
function TrackPage() {
  const { orderId = '' } = useParams()
  const demo = DEMO[orderId] ?? { service: 'standard', orders: [{ id: `Order ${orderId}`, status: 'ORDER_PLACED' }] }
  return (
    <main className="demo">
      <Header sub={`Tracking · ${orderId}`} />
      <DeliveryJourney key={orderId} service={demo.service} orders={demo.orders} showServiceBar={false} />
    </main>
  )
}

/** Compact read-only widget, as another site might embed it. */
function EmbedPage() {
  return (
    <main className="demo">
      <Header sub="Read-only embed · custom theme" />
      <DeliveryJourney
        service="express"
        orders={[{ id: 'Order #7781', status: 'AT_LOCAL_HUB', vehicle: 'van' }]}
        interactive={false}
        showServiceBar={false}
        showHint={false}
        height={420}
        theme={{ accent: '#1b6fd8', fontDisplay: 'Georgia, serif' }}
        renderInfoCard={(ctx) => (
          <>
            <span className="dj-eyebrow">{ctx.journey.label}</span>
            <div className="dj-card-title">{ctx.step?.name ?? 'Preparing'}</div>
            <div className="dj-card-desc">Step {ctx.stepIndex} of {ctx.totalSteps} · ETA {ctx.service.eta}</div>
          </>
        )}
      />
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/journey" replace />} />
        <Route path="/journey" element={<JourneyPage />} />
        <Route path="/track/:orderId" element={<TrackPage />} />
        <Route path="/embed" element={<EmbedPage />} />
        <Route path="/docs" element={<DocsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
