# delivery-journey-3d

Interactive 3D order-delivery journey for React. Pick a delivery type, pick a
vehicle, and drive the parcel station by station across an animated 3D board.
Several deliveries can run at once. Built on three.js, React Three Fiber and
zustand; everything is configurable and every part is exported.

```tsx
import { DeliveryJourney } from 'delivery-journey-3d'
import 'delivery-journey-3d/styles.css'

<DeliveryJourney />
```

Tracking page, read-only, with the order placed at its live status:

```tsx
<DeliveryJourney
  service="express"
  orders={[{ id: 'Order #7781', status: 'AT_LOCAL_HUB', vehicle: 'van' }]}
  interactive={false}
  showServiceBar={false}
  height={420}
  theme={{ accent: '#1b6fd8' }}
/>
```

## Install

```bash
npm install delivery-journey-3d three @react-three/fiber @react-three/drei
```

React 18+, three 0.150+, @react-three/fiber 8+ and @react-three/drei 9+ are
peer dependencies, so the host app keeps one copy of each.

## `<DeliveryJourney>` props

| Prop | Type | Default | What it does |
|---|---|---|---|
| `config` | `JourneyConfigInput` | defaults | Override or extend steps, services, vehicles, 3D models, scene colours, lanes, slots. Records merge by key. |
| `service` | `string` | – | Controlled delivery type (map). |
| `defaultService` | `string` | first service | Initial delivery type when uncontrolled. |
| `orders` | `OrderInput[]` | – | Tracking mode: shows these orders at their `status`. Each `{ id, label?, vehicle?, status? }`. |
| `interactive` | `boolean` | `true` | Show the control bar. `false` = read-only tracker. |
| `showServiceBar` / `showDeliveries` / `showVehicles` / `showInfoCard` / `showHint` | `boolean` | `true` | Toggle parts of the UI. |
| `renderInfoCard` | `(ctx) => ReactNode` | – | Replace the info card content. `ctx` has journey, service, vehicle, step, stepIndex, totalSteps, text. |
| `sceneChildren` | `ReactNode` | – | Extra three.js content rendered inside the scene. |
| `theme` | `JourneyTheme` | – | Colour and font tokens (`bg`, `surface`, `ink`, `muted`, `line`, `accent`, `accentInk`, `focus`, `soft`, `fontDisplay`, `fontBody`, `fontMono`). |
| `height` | `number \| string` | `660` | Height of the board block. |
| `reducedMotion` | `boolean` | OS setting | Shorter moves, no camera sweep, no confetti. |
| `storeRef` | `MutableRefObject<JourneyStore>` | – | Imperative handle: `ref.current.getState().goTo(id, 3)`. |
| `onServiceChange` | `(serviceId) => void` | – | Map switched. |
| `onVehicleChange` | `(journey, vehicleId) => void` | – | Vehicle changed. |
| `onStepChange` | `(journey, step, index) => void` | – | A delivery reached a station. |
| `onComplete` | `(journey) => void` | – | A delivery reached the last station. |
| `className` / `style` | | – | Applied to the root element. |

## Configuration

Everything the component draws comes from one config object. Pass a partial and
it is merged with the defaults by key.

```tsx
import { DeliveryJourney, defaultServices, PALETTE } from 'delivery-journey-3d'

<DeliveryJourney
  config={{
    // a new vehicle (uses the built-in van model unless you add a vehicleModels entry)
    vehicles: { tuktuk: { id: 'tuktuk', label: 'Tuk-tuk', speed: 5, kmh: 25, color: '#e8590c', altitude: 0, blurb: 'Three-wheel courier' } },
    vehicleModels: { tuktuk: ScooterModel },
    // a new station reusing a built-in model
    steps: { gift_wrap: { id: 'gift_wrap', name: 'Gift wrapping', short: 'Wrap', color: PALETTE.pink, status: 'GIFT_WRAPPED', model: 'packing', desc: 'The gift is wrapped and a card added.' } },
    // a new delivery type built from the catalogue
    services: {
      gift: { id: 'gift', label: 'Gift delivery', tagline: 'Wrapped and delivered to the recipient', eta: '2–3 days', vehicle: 'tuktuk', doneWord: 'Gift delivered',
        steps: ['order_placed', 'order_confirmed', 'item_picked', 'gift_wrap', 'dispatch', 'in_transit', 'out_for_delivery', 'delivered'],
        map: { grass: '#c7e9b0', base: '#d9a05b', sky: '#ffe3ec' } },
    },
  }}
/>
```

`validateConfig` runs on mount and warns in the console about unknown step,
vehicle or model ids.

### Custom 3D models

A station model is a React component `({ step, active }) => JSX` rendered
inside the scene; a vehicle model is `({ vehicle, register, anchor }) => JSX`
where `register(radius)` wires wheels (`register(r, 'y')` for rotors) and
`<object3D ref={anchor}>` marks where the parcel sits. Build them from the
exported `Box`, `Cyl`, `Sph` primitives or load a `.glb` with drei's `useGLTF`.

```tsx
const LockerGLB: StationModel = ({ step, active }) => {
  const { scene } = useGLTF('/models/locker.glb')
  return <primitive object={scene} scale={1.2} />
}
<DeliveryJourney config={{ stationModels: { locker: LockerGLB } }} />
```

### Composing your own layout

Every part is exported. Wrap them in `JourneyProvider` to share one store:

```tsx
import { JourneyProvider, JourneyCanvas, ServiceBar, StepButtons, StartButton, useJourney } from 'delivery-journey-3d'

<JourneyProvider defaultService="sameday">
  <ServiceBar />
  <div style={{ position: 'relative', height: 500 }}><JourneyCanvas /></div>
  <StartButton /> <StepButtons />
  <MyStatus />
</JourneyProvider>

function MyStatus() {
  const j = useJourney((s) => s.journeys[0])
  return <p>{j?.label}: step {j?.current}</p>
}
```

Exports: `DeliveryJourney`, `JourneyProvider`, `JourneyCanvas`, `ServiceBar`,
`BottomBar`, `DeliveryTabs`, `VehiclePicker`, `StepButtons`, `StartButton`,
`InfoCard`, `useInfoCardContext`, `useJourney`, `useJourneyStore`,
`useActiveJourney`, `createJourneyStore`, `createConfig`, `validateConfig`,
`defaultConfig`, `defaultSteps`, `defaultServices`, `defaultVehicles`,
`defaultStationModels`, `defaultVehicleModels`, every built-in model, the
primitives, `buildRoute`, `routeIndexForStatus`, `useReducedMotion`, and all
types.

## Built-in delivery types

| Type | Route | Vehicle | ETA |
|---|---|---|---|
| Standard delivery | Order placed → Order confirmed → Item picked → Packed → Dispatched → In transit → Arrives at local hub → Out for delivery → Delivered | Truck | 3–5 days |
| Express delivery | Order placed → Priority processing → Pick & pack → Priority dispatch → Fast transit → Local hub → Out for delivery → Delivered | Van | 1–2 days |
| Same-day delivery | Order placed → Immediate confirmation → Fast picking → Packing → Immediate dispatch → Local delivery center → Out for delivery → Delivered same day | Drone | Today |
| Next-day delivery | Order placed → Order processing → Pick & pack → Dispatch → Overnight transit → Destination hub → Out for delivery → Delivered next day | Car | Tomorrow |
| Scheduled delivery | Order placed → Order confirmed → Customer selects date/time → Pick & pack → Dispatch → Local hub → Delivery slot assigned → Out for delivery → Delivered | Van | Chosen slot |
| Cash on delivery | Order placed → COD selected → Processing → Pick & pack → Dispatch → Out for delivery → Customer pays → Package handed over → Delivery completed | Scooter | 2–4 days |
| Click & collect | Order placed → Pickup option selected → Store prepares item → Customer notified → Customer arrives → Verification → Item handed over → Order completed | Robot | 1–2 days |
| International delivery | Order placed → Processing → Packing → Export documentation → Customs clearance → International transit → Import customs → Destination hub → Local courier → Out for delivery → Delivered | Truck | 7–14 days |
| Return delivery | Return requested → Return approved → Pickup scheduled → Item collected → Return transit → Warehouse receives item → Inspection → Refund / replacement → Return completed | Bike | 5–10 days |

The board has 12 station slots over four road rows; unused slots become parks.
50 catalogue steps share 20 station models. Vehicles: bike, scooter, car,
truck, van, drone (flies), robot. Up to 6 deliveries at once.

## Backend statuses

Each step carries a `status` code (`ORDER_PLACED`, `PICKED`, `IN_TRANSIT`,
`CUSTOMS_CLEARANCE`, `READY_FOR_PICKUP`, `DELIVERED`, …). Pass an order with
that status and the vehicle is placed at the matching station of the current
route; `routeIndexForStatus(route, status)` does the lookup.

## Repository

```
src/lib/        the package (built to dist/ by `npm run build:lib`)
  DeliveryJourney.tsx   root component + JourneyProvider
  store.ts              per-instance zustand store, React context hooks
  config.ts             defaults, createConfig, validateConfig
  path.ts               route building, pointAt, status lookup
  data/                 default steps, services, vehicles
  scene/                canvas, board, camera, confetti, station + vehicle models
  ui/                   service bar, delivery tabs, vehicle picker, step buttons, start button, info card
  styles.css            scoped .dj-* styles driven by --dj-* tokens
src/demo/       demo site (interactive, tracking, read-only embed)
```

```bash
npm run dev         # demo at http://localhost:5173
npm run build:lib   # dist/index.js, index.cjs, *.d.ts, delivery-journey-3d.css
npm run build       # demo site
```

## Publishing

1. Set the final package name and version in `package.json` and remove `"private": true`.
2. `npm run build:lib`
3. `npm publish --access public`

## Licence

MIT
