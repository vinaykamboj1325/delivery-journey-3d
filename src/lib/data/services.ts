import type { Service } from '../types'

export type DefaultServiceId =
  | 'standard' | 'express' | 'sameday' | 'nextday' | 'scheduled' | 'cod' | 'pickup' | 'international' | 'return'

/** One map per delivery type. The step lists follow the business flows exactly. */
export const defaultServices: Record<DefaultServiceId, Service> = {
  standard: {
    id: 'standard', label: 'Standard delivery', tagline: 'Regular shipping through every hub', eta: '3–5 days', vehicle: 'truck', doneWord: 'Delivered',
    steps: ['order_placed', 'order_confirmed', 'item_picked', 'packed', 'dispatched', 'in_transit', 'arrives_local_hub', 'out_for_delivery', 'delivered'],
    map: { grass: '#9fdc8a', base: '#c9a27a', sky: '#c9e7ff' },
  },
  express: {
    id: 'express', label: 'Express delivery', tagline: 'Priority processing and the fast line-haul', eta: '1–2 days', vehicle: 'van', doneWord: 'Delivered',
    steps: ['order_placed', 'priority_processing', 'pick_pack', 'priority_dispatch', 'fast_transit', 'local_hub', 'out_for_delivery', 'delivered'],
    map: { grass: '#a8d98a', base: '#d9a05b', sky: '#ffe9c9' },
  },
  sameday: {
    id: 'sameday', label: 'Same-day delivery', tagline: 'Picked locally and delivered today', eta: 'Today', vehicle: 'drone', doneWord: 'Delivered same day',
    steps: ['order_placed', 'immediate_confirmation', 'fast_picking', 'packing', 'immediate_dispatch', 'local_delivery_center', 'out_for_delivery', 'delivered_sameday'],
    map: { grass: '#8fd4c9', base: '#8aa6d9', sky: '#dbe8ff' },
  },
  nextday: {
    id: 'nextday', label: 'Next-day delivery', tagline: 'Overnight transit, on the doorstep tomorrow', eta: 'Tomorrow', vehicle: 'car', doneWord: 'Delivered next day',
    steps: ['order_placed', 'order_processing', 'pick_pack', 'dispatch', 'overnight_transit', 'destination_hub', 'out_for_delivery', 'delivered_nextday'],
    map: { grass: '#8fc9a8', base: '#7a8ab7', sky: '#c7cff5' },
  },
  scheduled: {
    id: 'scheduled', label: 'Scheduled delivery', tagline: 'Delivered in a date and time slot the customer picks', eta: 'Chosen slot', vehicle: 'van', doneWord: 'Delivered',
    steps: ['order_placed', 'order_confirmed', 'select_slot', 'pick_pack', 'dispatch', 'local_hub', 'slot_assigned', 'out_for_delivery', 'delivered'],
    map: { grass: '#b5dc8a', base: '#c99a7a', sky: '#d6f0ff' },
  },
  cod: {
    id: 'cod', label: 'Cash on delivery', tagline: 'Customer pays the courier at the door', eta: '2–4 days', vehicle: 'scooter', doneWord: 'Delivery completed',
    steps: ['order_placed', 'cod_selected', 'order_processing', 'pick_pack', 'dispatch', 'out_for_delivery', 'customer_pays', 'handed_over', 'delivery_completed'],
    map: { grass: '#c9dc8a', base: '#d4b05b', sky: '#fff0c2' },
  },
  pickup: {
    id: 'pickup', label: 'Click & collect', tagline: 'Store pickup: the customer collects in person', eta: '1–2 days', vehicle: 'robot', doneWord: 'Order completed',
    steps: ['order_placed', 'pickup_selected', 'store_prepares', 'customer_notified', 'customer_arrives', 'verification', 'item_handed_over', 'order_completed'],
    map: { grass: '#9fdca8', base: '#b7a27a', sky: '#e3f2e6' },
  },
  international: {
    id: 'international', label: 'International delivery', tagline: 'Export, flight, import customs and local courier', eta: '7–14 days', vehicle: 'truck', doneWord: 'Delivered',
    steps: ['order_placed', 'order_processing', 'packing', 'export_docs', 'customs_clearance', 'international_transit', 'import_customs', 'destination_hub', 'local_courier', 'out_for_delivery', 'delivered'],
    map: { grass: '#a3d1c3', base: '#9a8ab7', sky: '#d2e4ff' },
  },
  return: {
    id: 'return', label: 'Return delivery', tagline: 'Item goes back to the seller for a refund', eta: '5–10 days', vehicle: 'bike', doneWord: 'Return completed',
    steps: ['return_requested', 'return_approved', 'pickup_scheduled', 'item_collected', 'return_transit', 'warehouse_receives', 'inspection', 'refund', 'return_completed'],
    map: { grass: '#d9c98a', base: '#b78a7a', sky: '#f3dede' },
  },
}

