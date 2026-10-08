import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { DeliveryJourney, PALETTE, ScooterModel, type JourneyConfigInput } from '../lib'
import './docs.css'

/* ---------- small helpers ---------- */

function Code({ children, lang = 'tsx' }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(children.trim()); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* clipboard blocked */ }
  }
  return (
    <div className="docs-code">
      <div className="docs-code-bar"><span>{lang}</span><button type="button" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button></div>
      <pre><code>{children.trim()}</code></pre>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="docs-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function Example({ children }: { children: ReactNode }) {
  return <div className="docs-example">{children}</div>
}

const TOC = [
  ['install', '1. Install'],
  ['basic', '2. Basic usage'],
  ['tracking', '3. Tracking an order'],
  ['config', '4. Add your own steps, vehicles and delivery types'],
  ['models', '5. Custom 3D models'],
  ['theme', '6. Theming'],
  ['compose', '7. Compose your own layout'],
  ['events', '8. Events and imperative control'],
  ['nextjs', '9. Next.js and SSR'],
  ['api', '10. API reference'],
  ['faq', '11. FAQ'],
]

/* ---------- live example config ---------- */

const giftConfig: JourneyConfigInput = {
  vehicles: { tuktuk: { id: 'tuktuk', label: 'Tuk-tuk', speed: 5, kmh: 25, color: '#e8590c', altitude: 0, blurb: 'Three-wheel courier' } },
  vehicleModels: { tuktuk: ScooterModel },
  steps: {
    gift_wrap: { id: 'gift_wrap', name: 'Gift wrapping', short: 'Wrap', color: PALETTE.pink, status: 'GIFT_WRAPPED', model: 'packing', desc: 'The gift is wrapped and a card is added.' },
  },
  services: {
    gift: {
      id: 'gift', label: 'Gift delivery', tagline: 'Wrapped and delivered to the recipient', eta: '2–3 days', vehicle: 'tuktuk', doneWord: 'Gift delivered',
      steps: ['order_placed', 'order_confirmed', 'item_picked', 'gift_wrap', 'dispatch', 'in_transit', 'out_for_delivery', 'delivered'],
      map: { grass: '#c7e9b0', base: '#d9a05b', sky: '#ffe3ec' },
    },
  },
}

export function DocsPage() {
  return (
    <main className="docs">
      <header className="demo-head">
        <span className="demo-eyebrow">delivery-journey-3d · guide</span>
        <h1>Set up Delivery Journey 3D in your project</h1>
        <nav className="demo-nav">
          <Link to="/journey">Interactive demo</Link>
          <Link to="/track/all">Tracking demo</Link>
          <Link to="/embed">Embed demo</Link>
        </nav>
      </header>

      <div className="docs-layout">
        <aside className="docs-toc">
          <strong>On this page</strong>
          {TOC.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
        </aside>

        <div className="docs-body">
          <p className="docs-lede">
            <code>delivery-journey-3d</code> is a React component that turns an order-delivery flow into an
            interactive 3D board. Users pick a delivery type, pick a vehicle and move the parcel station by
            station; on a tracking page the vehicle sits at the order's live status. This guide takes you from
            install to a customised, themed, production build.
          </p>

          <Section id="install" title="1. Install">
            <p>The package needs React 18+, three.js and React Three Fiber in the host app (they are peer dependencies, so your app keeps one copy of each).</p>
            <Code lang="bash">{`npm install delivery-journey-3d three @react-three/fiber @react-three/drei`}</Code>
            <p>With pnpm or yarn:</p>
            <Code lang="bash">{`pnpm add delivery-journey-3d three @react-three/fiber @react-three/drei
# or
yarn add delivery-journey-3d three @react-three/fiber @react-three/drei`}</Code>
            <p>If you use TypeScript, types ship inside the package. No extra <code>@types</code> install is needed beyond <code>@types/three</code>.</p>
            <Code lang="bash">{`npm install -D @types/three`}</Code>
            <h3>Using it from this repository before publishing</h3>
            <p>Build the library and link it into another local project:</p>
            <Code lang="bash">{`# in this repo
npm run build:lib
npm link

# in your app
npm link delivery-journey-3d`}</Code>
          </Section>

          <Section id="basic" title="2. Basic usage">
            <p>Import the component and its stylesheet once, then render it. That is the whole interactive demo.</p>
            <Code>{`import { DeliveryJourney } from 'delivery-journey-3d'
import 'delivery-journey-3d/styles.css'

export function DeliveryPage() {
  return <DeliveryJourney />
}`}</Code>
            <p>The component renders the delivery-type tabs, the 3D board with the info card, and the control bar (deliveries, vehicles, Start, step buttons). It fills the width of its container; set <code>height</code> for the board block (default 660px).</p>
            <Example>
              <DeliveryJourney height={520} showServiceBar={false} />
            </Example>
            <p>Useful props for a first integration:</p>
            <Code>{`<DeliveryJourney
  defaultService="express"   // which map to open on
  height={520}
  showServiceBar={false}     // hide the delivery-type tabs
  showHint={false}           // hide the keyboard hint
/>`}</Code>
          </Section>

          <Section id="tracking" title="3. Tracking an order">
            <p>
              Pass <code>orders</code> and each vehicle is placed at the station whose <code>status</code> matches the
              order's backend status. Set <code>interactive={'{false}'}</code> for a read-only widget.
            </p>
            <Code>{`import { DeliveryJourney } from 'delivery-journey-3d'

export function TrackOrder({ order }) {
  // order = { id: '4822', status: 'IN_TRANSIT', service: 'standard', vehicle: 'car' }
  return (
    <DeliveryJourney
      service={order.service}
      orders={[{ id: order.id, label: \`Order #\${order.id}\`, status: order.status, vehicle: order.vehicle }]}
      interactive={false}
      showServiceBar={false}
      height={420}
    />
  )
}`}</Code>
            <p>Several orders on one map:</p>
            <Code>{`<DeliveryJourney
  service="standard"
  orders={[
    { id: '4821', status: 'PICKED', vehicle: 'bike' },
    { id: '4822', status: 'IN_TRANSIT', vehicle: 'car' },
    { id: '4823', status: 'DELIVERED', vehicle: 'truck' },
  ]}
/>`}</Code>
            <p>
              When the status changes (polling, websocket), pass the new <code>orders</code> array; the vehicles drive to the
              new station. Give the component a <code>key</code> if you want a full reset instead.
            </p>
            <Example>
              <DeliveryJourney
                service="standard"
                orders={[
                  { id: 'Order #4821', status: 'PICKED', vehicle: 'bike' },
                  { id: 'Order #4822', status: 'IN_TRANSIT', vehicle: 'car' },
                ]}
                interactive={false}
                showServiceBar={false}
                height={420}
              />
            </Example>
            <h3>Status codes</h3>
            <p>Every built-in step carries a status code. The common ones:</p>
            <table className="docs-table">
              <thead><tr><th>Status</th><th>Step</th></tr></thead>
              <tbody>
                {[
                  ['ORDER_PLACED', 'Order placed'], ['ORDER_CONFIRMED', 'Order confirmed'], ['PROCESSING', 'Order processing'],
                  ['PICKED', 'Item picked / Fast picking'], ['PICKED_PACKED', 'Pick & pack'], ['PACKED', 'Packed / Packing'],
                  ['DISPATCHED', 'Dispatched / Dispatch'], ['IN_TRANSIT', 'In transit / Fast / Overnight'], ['AT_LOCAL_HUB', 'Local hub'],
                  ['AT_DESTINATION_HUB', 'Destination hub'], ['OUT_FOR_DELIVERY', 'Out for delivery'], ['DELIVERED', 'Delivered'],
                  ['CUSTOMS_CLEARANCE', 'Customs clearance'], ['IMPORT_CUSTOMS', 'Import customs'], ['READY_FOR_PICKUP', 'Customer notified'],
                  ['PAYMENT_COLLECTED', 'Customer pays'], ['RETURN_REQUESTED', 'Return requested'], ['INSPECTION', 'Inspection'], ['REFUNDED', 'Refund / replacement'],
                ].map(([s, n]) => <tr key={s}><td><code>{s}</code></td><td>{n}</td></tr>)}
              </tbody>
            </table>
            <p>The full list is in <code>defaultSteps</code>; you can also define your own statuses in a custom step.</p>
          </Section>

          <Section id="config" title="4. Add your own steps, vehicles and delivery types">
            <p>
              Everything the component draws comes from one config. Pass a partial <code>config</code> and it is merged
              with the defaults by key, so one new vehicle keeps all the built-in ones.
            </p>
            <Code>{`import { DeliveryJourney, PALETTE, ScooterModel } from 'delivery-journey-3d'

const config = {
  // a new vehicle; it reuses the built-in scooter model
  vehicles: {
    tuktuk: { id: 'tuktuk', label: 'Tuk-tuk', speed: 5, kmh: 25, color: '#e8590c', altitude: 0, blurb: 'Three-wheel courier' },
  },
  vehicleModels: { tuktuk: ScooterModel },

  // a new station; it reuses the built-in packing model
  steps: {
    gift_wrap: { id: 'gift_wrap', name: 'Gift wrapping', short: 'Wrap', color: PALETTE.pink,
      status: 'GIFT_WRAPPED', model: 'packing', desc: 'The gift is wrapped and a card is added.' },
  },

  // a new delivery type built from catalogue steps + the new one
  services: {
    gift: {
      id: 'gift', label: 'Gift delivery', tagline: 'Wrapped and delivered to the recipient',
      eta: '2–3 days', vehicle: 'tuktuk', doneWord: 'Gift delivered',
      steps: ['order_placed', 'order_confirmed', 'item_picked', 'gift_wrap', 'dispatch', 'in_transit', 'out_for_delivery', 'delivered'],
      map: { grass: '#c7e9b0', base: '#d9a05b', sky: '#ffe3ec' },
    },
  },
}

<DeliveryJourney config={config} defaultService="gift" />`}</Code>
            <Example>
              <DeliveryJourney config={giftConfig} defaultService="gift" height={520} />
            </Example>
            <p>
              Only your services? Pass <code>services</code> with just yours and set <code>defaultService</code>; the built-in
              ones stay available in the catalogue but you can hide the tab bar with <code>showServiceBar={'{false}'}</code>,
              or build the config from scratch with <code>createConfig(input, baseConfig)</code>.
            </p>
            <p>Built-in station model names you can reuse in <code>step.model</code>:</p>
            <p className="docs-chips">
              {['phone', 'office', 'warehouse', 'sorter', 'rack', 'packing', 'dock', 'beacon', 'night', 'hub', 'customs', 'airport', 'calendar', 'cash', 'store', 'inspect', 'refund', 'courier', 'locker', 'house'].map((m) => <code key={m}>{m}</code>)}
            </p>
            <p>Other config fields: <code>scene</code> (road, dash, lamp, pond, edge colours), <code>maxJourneys</code>, <code>lanes</code>, <code>slots</code> (station positions), <code>depot</code>. <code>validateConfig</code> runs on mount and warns in the console about unknown ids.</p>
          </Section>

          <Section id="models" title="5. Custom 3D models">
            <p>
              A station model is a React Three Fiber component <code>({'{ step, active }'}) =&gt; JSX</code>. It is rendered at the
              station's position; <code>active</code> is true while a delivery is stopped there, so you can animate.
            </p>
            <Code>{`import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import type { StationModel } from 'delivery-journey-3d'

const LockerGLB: StationModel = ({ step, active }) => {
  const { scene } = useGLTF('/models/locker.glb')
  const ref = useRef()
  useFrame((_, dt) => { if (active && ref.current) ref.current.rotation.y += dt })
  return <primitive ref={ref} object={scene} scale={1.2} />
}

<DeliveryJourney config={{ stationModels: { locker: LockerGLB } }} />`}</Code>
            <p>
              A vehicle model gets <code>{'{ vehicle, register, anchor }'}</code>. Local +x is forward. Call{' '}
              <code>register(radius)</code> on wheel groups so they spin with distance (<code>register(r, 'y')</code> for rotors),
              and place <code>&lt;object3D ref={'{anchor}'} /&gt;</code> where the parcel sits.
            </p>
            <Code>{`import { Box, Cyl, type VehicleModel } from 'delivery-journey-3d'

const TukTuk: VehicleModel = ({ vehicle, register, anchor }) => (
  <group>
    <group ref={register(0.22)} position={[0.6, 0.22, 0]}>
      <Cyl radiusTop={0.22} radiusBottom={0.22} height={0.12} color="#20252e" rotation={[Math.PI / 2, 0, 0]} />
    </group>
    {[0.4, -0.4].map((z) => (
      <group key={z} ref={register(0.22)} position={[-0.5, 0.22, z]}>
        <Cyl radiusTop={0.22} radiusBottom={0.22} height={0.12} color="#20252e" rotation={[Math.PI / 2, 0, 0]} />
      </group>
    ))}
    <Box size={[1.4, 0.7, 0.9]} color={vehicle.color} position={[0, 0.6, 0]} />
    <Box size={[1.4, 0.06, 0.95]} color="#f4f1e6" position={[0, 1.0, 0]} />
    <object3D ref={anchor} position={[-0.3, 1.1, 0]} />
  </group>
)

<DeliveryJourney config={{
  vehicles: { tuktuk: { id: 'tuktuk', label: 'Tuk-tuk', speed: 5, kmh: 25, color: '#e8590c', altitude: 0, blurb: '' } },
  vehicleModels: { tuktuk: TukTuk },
}} />`}</Code>
            <p>Set <code>altitude</code> above 0 on a vehicle to make it fly like the drone (hover bob, forward tilt, shadow stays on the road).</p>
          </Section>

          <Section id="theme" title="6. Theming">
            <p>All styles are scoped under <code>.dj-root</code> and driven by <code>--dj-*</code> CSS variables. Use the <code>theme</code> prop or your own stylesheet.</p>
            <Code>{`<DeliveryJourney
  theme={{
    accent: '#1b6fd8',
    accentInk: '#fff',
    surface: '#ffffff',
    ink: '#14213d',
    fontDisplay: 'Georgia, serif',
  }}
/>`}</Code>
            <Code lang="css">{`/* or in CSS */
.dj-root {
  --dj-accent: #1b6fd8;
  --dj-surface: #ffffff;
  --dj-font-display: Georgia, serif;
}
/* force a mode regardless of the OS setting */
.dj-root.dj-dark { ... } /* add className="dj-dark" or "dj-light" */`}</Code>
            <p>Map colours (grass, base, sky) belong to each service in the config; step colours belong to each step; vehicle colours to each vehicle.</p>
            <Example>
              <DeliveryJourney
                service="sameday"
                orders={[{ id: 'Order #9001', status: 'DISPATCHED', vehicle: 'drone' }]}
                interactive={false}
                showServiceBar={false}
                showHint={false}
                height={360}
                theme={{ accent: '#1b6fd8', fontDisplay: 'Georgia, serif' }}
                renderInfoCard={(ctx) => (
                  <>
                    <span className="dj-eyebrow">{ctx.journey.label} · custom card</span>
                    <div className="dj-card-title">{ctx.step?.name}</div>
                    <div className="dj-card-desc">Step {ctx.stepIndex} of {ctx.totalSteps} · {ctx.service.eta}</div>
                  </>
                )}
              />
            </Example>
            <p>The card above uses <code>renderInfoCard</code>; it receives the journey, service, vehicle, current step and the default text.</p>
          </Section>

          <Section id="compose" title="7. Compose your own layout">
            <p>Every part is exported. Wrap them in <code>JourneyProvider</code> and they share one store.</p>
            <Code>{`import {
  JourneyProvider, JourneyCanvas, ServiceBar, VehiclePicker, StartButton, StepButtons, InfoCard, useJourney,
} from 'delivery-journey-3d'
import 'delivery-journey-3d/styles.css'

export function MyJourney() {
  return (
    <JourneyProvider defaultService="sameday">
      <div className="dj-root">
        <ServiceBar />
        <div style={{ position: 'relative', height: 480 }}>
          <JourneyCanvas />
          <InfoCard />
        </div>
        <VehiclePicker />
        <StartButton />
        <StepButtons />
        <Progress />
      </div>
    </JourneyProvider>
  )
}

function Progress() {
  const j = useJourney((s) => s.journeys[0])
  const n = useJourney((s) => s.route.steps.length)
  return <p>{j?.label}: step {j?.current} of {n}</p>
}`}</Code>
            <p><code>JourneyCanvas</code> must sit in a positioned container with a height; it fills it absolutely. Keep the <code>dj-root</code> class on a wrapper so the parts pick up the tokens.</p>
          </Section>

          <Section id="events" title="8. Events and imperative control">
            <p>Callbacks fire from state changes, handy for analytics:</p>
            <Code>{`<DeliveryJourney
  onServiceChange={(id) => track('journey_service', { id })}
  onVehicleChange={(journey, vehicle) => track('vehicle_select', { vehicle })}
  onStepChange={(journey, step, index) => track('step_view', { step: step.id, index })}
  onComplete={(journey) => track('journey_complete', { order: journey.label })}
/>`}</Code>
            <p>For imperative control, keep a store ref:</p>
            <Code>{`import { useRef } from 'react'
import { DeliveryJourney, type JourneyStore } from 'delivery-journey-3d'

const storeRef = useRef<JourneyStore | null>(null)

<DeliveryJourney storeRef={storeRef} />

// later, e.g. when a websocket message arrives
const st = storeRef.current!.getState()
const j = st.journeys[0]
st.start(j.id)
st.goTo(j.id, 5)          // drive to station 5 of the current route
st.setVehicle(j.id, 'drone')
st.setService('express')  // switch map
st.setOrders([{ id: 'A1', status: 'IN_TRANSIT' }])`}</Code>
            <p>Store methods: <code>setService</code>, <code>addJourney</code>, <code>removeJourney</code>, <code>select</code>, <code>setVehicle</code>, <code>start</code>, <code>goTo</code>, <code>restart</code>, <code>syncToStep</code>, <code>setOrders</code>. State: <code>service</code>, <code>route</code>, <code>journeys</code>, <code>activeId</code>, <code>deliveredCount</code>, <code>config</code>.</p>
          </Section>

          <Section id="nextjs" title="9. Next.js and SSR">
            <p>The component uses WebGL and <code>window</code>, so render it on the client only.</p>
            <Code>{`// app/track/[id]/page.tsx
import dynamic from 'next/dynamic'
import 'delivery-journey-3d/styles.css'

const DeliveryJourney = dynamic(
  () => import('delivery-journey-3d').then((m) => m.DeliveryJourney),
  { ssr: false, loading: () => <div style={{ height: 420 }}>Loading 3D…</div> },
)

export default function Page({ params }) {
  return <DeliveryJourney orders={[{ id: params.id, status: 'IN_TRANSIT' }]} interactive={false} />
}`}</Code>
            <p>Vite, Create React App and Remix (client components) work with the plain import.</p>
          </Section>

          <Section id="api" title="10. API reference">
            <h3>&lt;DeliveryJourney&gt; props</h3>
            <table className="docs-table">
              <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
              <tbody>
                {[
                  ['config', 'JourneyConfigInput', 'defaults', 'Partial config merged by key: steps, services, vehicles, stationModels, vehicleModels, scene, maxJourneys, lanes, slots, depot.'],
                  ['service', 'string', '–', 'Controlled delivery type (map).'],
                  ['defaultService', 'string', 'first service', 'Initial delivery type when uncontrolled.'],
                  ['orders', 'OrderInput[]', '–', 'Tracking mode: { id, label?, vehicle?, status? }[] placed at their status.'],
                  ['interactive', 'boolean', 'true', 'Show the control bar; false = read-only.'],
                  ['showServiceBar / showDeliveries / showVehicles / showInfoCard / showHint', 'boolean', 'true', 'Toggle UI parts.'],
                  ['renderInfoCard', '(ctx: InfoCardContext) => ReactNode', '–', 'Replace the info card content.'],
                  ['sceneChildren', 'ReactNode', '–', 'Extra three.js content inside the scene.'],
                  ['theme', 'JourneyTheme', '–', 'bg, surface, ink, muted, line, accent, accentInk, focus, soft, fontDisplay, fontBody, fontMono.'],
                  ['height', 'number | string', '660', 'Height of the board block.'],
                  ['reducedMotion', 'boolean', 'OS setting', 'Shorter moves, no camera sweep, no confetti.'],
                  ['storeRef', 'MutableRefObject<JourneyStore>', '–', 'Imperative handle.'],
                  ['onServiceChange', '(serviceId) => void', '–', 'Map switched.'],
                  ['onVehicleChange', '(journey, vehicleId) => void', '–', 'Vehicle changed.'],
                  ['onStepChange', '(journey, step, index) => void', '–', 'A delivery reached a station.'],
                  ['onComplete', '(journey) => void', '–', 'A delivery reached the last station.'],
                  ['className / style', '', '–', 'Applied to the root element.'],
                ].map(([p, t, d, desc]) => <tr key={p}><td><code>{p}</code></td><td><code>{t}</code></td><td>{d}</td><td>{desc}</td></tr>)}
              </tbody>
            </table>
            <h3>Exports</h3>
            <p className="docs-chips">
              {['DeliveryJourney', 'JourneyProvider', 'JourneyCanvas', 'ServiceBar', 'BottomBar', 'DeliveryTabs', 'VehiclePicker', 'StepButtons', 'StartButton', 'InfoCard', 'useInfoCardContext', 'useJourney', 'useJourneyStore', 'useActiveJourney', 'createJourneyStore', 'createConfig', 'validateConfig', 'defaultConfig', 'defaultSteps', 'defaultServices', 'defaultVehicles', 'defaultStationModels', 'defaultVehicleModels', 'PALETTE', 'Box', 'Cyl', 'Sph', 'tint', 'Label', 'buildRoute', 'pointAt', 'routeIndexForStatus', 'useReducedMotion'].map((e) => <code key={e}>{e}</code>)}
            </p>
            <p>Types: <code>Step</code>, <code>Service</code>, <code>Vehicle</code>, <code>JourneyConfig</code>, <code>JourneyConfigInput</code>, <code>Journey</code>, <code>OrderInput</code>, <code>JourneyTheme</code>, <code>StationModel</code>, <code>VehicleModel</code>, <code>JourneyStore</code>, <code>JourneyState</code>, <code>Route</code>, <code>InfoCardContext</code>.</p>
          </Section>

          <Section id="faq" title="11. FAQ">
            <h3>The board is blank</h3>
            <p>Check that <code>delivery-journey-3d/styles.css</code> is imported, that the parent has a width, and that WebGL is available (open the console; three.js logs context errors). On Next.js use <code>dynamic(..., {'{ ssr: false }'})</code>.</p>
            <h3>Two copies of three.js</h3>
            <p>Make sure <code>three</code> and <code>@react-three/fiber</code> are installed once at the app level. With pnpm, hoist them or add them to your app's dependencies.</p>
            <h3>My status is not in the route</h3>
            <p>A status only matches a station that exists on the selected service's route. If a status is missing, the vehicle waits at the depot (<code>routeIndexForStatus</code> returns 0). Add the step to the service or map your status to the nearest one before passing it.</p>
            <h3>Can several boards be on one page?</h3>
            <p>Yes. Each <code>DeliveryJourney</code> owns its own store. Keep the count small; each one is a WebGL context.</p>
            <h3>Performance on phones</h3>
            <p>Use <code>height</code> around 400–480 on small screens, keep <code>maxJourneys</code> low, and prefer the built-in low-poly models or Draco-compressed <code>.glb</code> files under 2.5 MB.</p>
          </Section>
        </div>
      </div>
    </main>
  )
}
