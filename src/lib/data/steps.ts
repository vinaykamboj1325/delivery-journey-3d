import type { Step } from '../types'

/** The station models shipped with the package. Several steps share one model with their own name and colour. */
export type DefaultModelKind =
  | 'phone' | 'office' | 'warehouse' | 'sorter' | 'rack' | 'packing' | 'dock' | 'beacon' | 'house'
  | 'locker' | 'courier' | 'hub' | 'customs' | 'airport' | 'calendar' | 'cash' | 'store' | 'inspect' | 'refund' | 'night'

/** Palette used by the default steps. Exported so custom steps can reuse it. */
export const PALETTE = {
  coral: '#ff6b6b', orange: '#ff922b', yellow: '#ffd43b', green: '#51cf66', teal: '#38d9a9',
  blue: '#4dabf7', indigo: '#748ffc', violet: '#6741d9', pink: '#f783ac', mint: '#20c997',
  amber: '#fab005', lime: '#94d82d', cyan: '#22b8cf', grape: '#be4bdb', red: '#e03131', slate: '#495057',
}

const C = PALETTE
const s = (id: string, name: string, short: string, color: string, status: string, model: DefaultModelKind, desc: string): Step =>
  ({ id, name, short, color, status, model, desc })

/**
 * Catalogue of every station the default maps use. A delivery type picks an ordered
 * list of these (see services.ts).
 */
export const defaultSteps: Record<string, Step> = Object.fromEntries([
  /* ordering */
  s('order_placed', 'Order placed', 'Order', C.coral, 'ORDER_PLACED', 'phone', 'The customer places the order. The station lights up and the parcel is loaded onto the vehicle.'),
  s('order_confirmed', 'Order confirmed', 'Confirm', C.orange, 'ORDER_CONFIRMED', 'office', 'Payment is confirmed and the order is accepted.'),
  s('order_processing', 'Order processing', 'Process', C.orange, 'PROCESSING', 'office', 'The order is validated and sent to the warehouse system.'),
  s('priority_processing', 'Priority processing', 'Priority', C.orange, 'PRIORITY_PROCESSING', 'office', 'The order jumps the queue and is processed ahead of standard orders.'),
  s('immediate_confirmation', 'Immediate confirmation', 'Confirm', C.orange, 'CONFIRMED', 'office', 'The order is confirmed within seconds so picking can start right away.'),
  s('cod_selected', 'COD selected', 'COD', C.amber, 'COD_SELECTED', 'cash', 'The customer chooses cash on delivery. Payment will be taken at the door.'),
  s('pickup_selected', 'Pickup option selected', 'Pickup opt.', C.mint, 'PICKUP_SELECTED', 'store', 'The customer chooses to collect the order from a store.'),
  s('select_slot', 'Customer selects date/time', 'Slot', C.cyan, 'SLOT_SELECTED', 'calendar', 'The customer picks a delivery date and time window.'),
  /* warehouse */
  s('item_picked', 'Item picked', 'Pick', C.yellow, 'PICKED', 'rack', 'A picker takes the item from the rack.'),
  s('fast_picking', 'Fast picking', 'Pick', C.yellow, 'PICKED', 'rack', 'The item is picked from a local micro-warehouse.'),
  s('pick_pack', 'Pick & pack', 'Pick & pack', C.yellow, 'PICKED_PACKED', 'packing', 'The item is picked, packed and labelled in one pass.'),
  s('packed', 'Packed', 'Pack', C.blue, 'PACKED', 'packing', 'Items are packed and labelled.'),
  s('packing', 'Packing', 'Pack', C.blue, 'PACKED', 'packing', 'Items are packed and labelled.'),
  s('store_prepares', 'Store prepares item', 'Prepare', C.yellow, 'PREPARING', 'warehouse', 'The warehouse or store sets the item aside for collection.'),
  /* dispatch */
  s('dispatched', 'Dispatched', 'Dispatch', C.indigo, 'DISPATCHED', 'dock', 'Parcels are loaded at the dock and handed to the carrier.'),
  s('dispatch', 'Dispatch', 'Dispatch', C.indigo, 'DISPATCHED', 'dock', 'Parcels are loaded at the dock and handed to the carrier.'),
  s('priority_dispatch', 'Priority dispatch', 'Dispatch', C.indigo, 'PRIORITY_DISPATCHED', 'dock', 'The parcel goes on the first truck out.'),
  s('immediate_dispatch', 'Immediate dispatch', 'Dispatch', C.indigo, 'DISPATCHED', 'dock', 'The parcel leaves as soon as it is packed.'),
  /* transit */
  s('in_transit', 'In transit', 'Transit', C.violet, 'IN_TRANSIT', 'beacon', 'The parcel travels between hubs while the route beacon tracks it.'),
  s('fast_transit', 'Fast transit', 'Transit', C.violet, 'IN_TRANSIT', 'beacon', 'The parcel moves on the express line-haul.'),
  s('overnight_transit', 'Overnight transit', 'Overnight', C.slate, 'IN_TRANSIT', 'night', 'The parcel travels through the night to the destination city.'),
  s('international_transit', 'International transit', 'Flight', C.violet, 'INTERNATIONAL_TRANSIT', 'airport', 'The parcel flies to the destination country.'),
  s('return_transit', 'Return transit', 'Transit', C.violet, 'RETURN_IN_TRANSIT', 'beacon', 'The returned item travels back to the warehouse.'),
  /* hubs */
  s('local_hub', 'Local hub', 'Hub', C.teal, 'AT_LOCAL_HUB', 'hub', 'The parcel arrives at the hub nearest the customer.'),
  s('arrives_local_hub', 'Arrives at local hub', 'Hub', C.teal, 'AT_LOCAL_HUB', 'hub', 'The parcel arrives at the hub nearest the customer.'),
  s('local_delivery_center', 'Local delivery center', 'Center', C.teal, 'AT_DELIVERY_CENTER', 'hub', 'The parcel is handed to the local delivery centre.'),
  s('destination_hub', 'Destination hub', 'Hub', C.teal, 'AT_DESTINATION_HUB', 'hub', 'The parcel reaches the hub in the destination city.'),
  s('local_courier', 'Local courier', 'Courier', C.amber, 'WITH_LOCAL_COURIER', 'courier', 'A local courier takes over for the last mile.'),
  /* customs */
  s('export_docs', 'Export documentation', 'Export docs', C.cyan, 'EXPORT_DOCS', 'office', 'Commercial invoice and customs forms are prepared.'),
  s('customs_clearance', 'Customs clearance', 'Customs', C.red, 'CUSTOMS_CLEARANCE', 'customs', 'The parcel clears export customs.'),
  s('import_customs', 'Import customs', 'Import', C.red, 'IMPORT_CUSTOMS', 'customs', 'The parcel clears customs in the destination country; duties are paid.'),
  /* last mile */
  s('slot_assigned', 'Delivery slot assigned', 'Slot', C.cyan, 'SLOT_ASSIGNED', 'calendar', 'The courier confirms the time window for the delivery.'),
  s('out_for_delivery', 'Out for delivery', 'Out', C.amber, 'OUT_FOR_DELIVERY', 'courier', 'The courier has the parcel on the van and is on the way.'),
  s('customer_pays', 'Customer pays', 'Pay', C.amber, 'PAYMENT_COLLECTED', 'cash', 'The courier collects the cash payment at the door.'),
  s('handed_over', 'Package handed over', 'Handover', C.pink, 'HANDED_OVER', 'house', 'The parcel is handed to the customer.'),
  s('delivered', 'Delivered', 'Deliver', C.pink, 'DELIVERED', 'house', 'The parcel is handed over at the door.'),
  s('delivered_sameday', 'Delivered same day', 'Deliver', C.pink, 'DELIVERED', 'house', 'Delivered on the day the order was placed.'),
  s('delivered_nextday', 'Delivered next day', 'Deliver', C.pink, 'DELIVERED', 'house', 'Delivered the morning after the order was placed.'),
  s('delivery_completed', 'Delivery completed', 'Done', C.green, 'COMPLETED', 'house', 'Payment received and the delivery is closed.'),
  /* click & collect */
  s('customer_notified', 'Customer notified', 'Notify', C.blue, 'READY_FOR_PICKUP', 'phone', 'The customer gets a message that the order is ready.'),
  s('customer_arrives', 'Customer arrives', 'Arrive', C.indigo, 'CUSTOMER_ARRIVED', 'store', 'The customer comes to the store pickup desk.'),
  s('verification', 'Verification', 'Verify', C.cyan, 'VERIFIED', 'inspect', 'Order number and ID are checked.'),
  s('item_handed_over', 'Item handed over', 'Handover', C.pink, 'HANDED_OVER', 'locker', 'The item is handed to the customer.'),
  s('order_completed', 'Order completed', 'Done', C.green, 'COMPLETED', 'store', 'The pickup order is closed.'),
  /* returns */
  s('return_requested', 'Return requested', 'Request', C.coral, 'RETURN_REQUESTED', 'phone', 'The customer asks to return the item.'),
  s('return_approved', 'Return approved', 'Approve', C.orange, 'RETURN_APPROVED', 'office', 'The seller approves the return and issues a label.'),
  s('pickup_scheduled', 'Pickup scheduled', 'Schedule', C.cyan, 'PICKUP_SCHEDULED', 'calendar', 'A courier pickup is booked for a chosen slot.'),
  s('item_collected', 'Item collected', 'Collect', C.amber, 'ITEM_COLLECTED', 'house', 'The courier collects the item from the customer.'),
  s('warehouse_receives', 'Warehouse receives item', 'Receive', C.yellow, 'RETURN_RECEIVED', 'warehouse', 'The seller or warehouse checks the return in.'),
  s('inspection', 'Inspection', 'Inspect', C.cyan, 'INSPECTION', 'inspect', 'The item is inspected for condition and completeness.'),
  s('refund', 'Refund / replacement', 'Refund', C.green, 'REFUNDED', 'refund', 'The refund is issued or a replacement is sent.'),
  s('return_completed', 'Return completed', 'Done', C.green, 'RETURN_COMPLETED', 'store', 'The return is closed.'),
].map((st) => [st.id, st]))
