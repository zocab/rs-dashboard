export interface Booking {
  id: string
  pickupReturnStationId: string
  customerName: string
  startDate: string // ISO date string
  endDate: string // ISO date string
}

export interface Station {
  id: string
  name: string
  bookings: Booking[]
}
