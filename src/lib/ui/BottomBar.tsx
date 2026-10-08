import { DeliveryTabs } from './DeliveryTabs'
import { StartButton } from './StartButton'
import { StepButtons } from './StepButtons'
import { VehiclePicker } from './VehiclePicker'

export interface BottomBarProps {
  className?: string
  /** Show the deliveries row (default true) */
  showDeliveries?: boolean
  /** Allow adding / removing deliveries (default true) */
  editable?: boolean
  /** Show vehicle options (default true) */
  showVehicles?: boolean
}

/** Default control bar: deliveries, vehicle options, Start button and step buttons. Compose your own from the parts if needed. */
export function BottomBar({ className, showDeliveries = true, editable = true, showVehicles = true }: BottomBarProps) {
  return (
    <div className={`dj-controls ${className ?? ''}`}>
      {showDeliveries && <DeliveryTabs editable={editable} />}
      <div className="dj-row">
        {showVehicles ? <VehiclePicker /> : <span />}
        <div className="dj-group">
          <StartButton />
        </div>
      </div>
      <StepButtons />
    </div>
  )
}
