import type { Booking } from '@/types'
import { isSameDay, parseISO } from 'date-fns'

function bookingClass(day: Date, booking: Booking) {
  const start = parseISO(booking.startDate)
  const end = parseISO(booking.endDate)
  if (isSameDay(day, start)) return 'bg-green-200 text-green-800'
  if (isSameDay(day, end)) return 'bg-red-200 text-red-800'
  return 'bg-gray-100 text-gray-700'
}

export { bookingClass }
