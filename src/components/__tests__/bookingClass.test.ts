import { formatISO, addDays } from 'date-fns'
import type { Booking } from '@/types'
import { describe, expect, it } from 'vitest'
import { bookingClass } from '@/lib/bookingClass'

describe('bookingClass', () => {
  const today = new Date()

  const baseBooking: Booking = {
    id: '1',
    customerName: 'Alice',
    pickupReturnStationId: 'station1',
    startDate: formatISO(today),
    endDate: formatISO(addDays(today, 2)),
  }

  it('returns green class if booking starts today', () => {
    const result = bookingClass(today, baseBooking)
    expect(result).toBe('bg-green-200 text-green-800')
  })

  it('returns red class if booking ends today', () => {
    const booking = {
      ...baseBooking,
      startDate: formatISO(addDays(today, -2)),
      endDate: formatISO(today),
    }
    const result = bookingClass(today, booking)
    expect(result).toBe('bg-red-200 text-red-800')
  })

  it('returns gray class if booking does not start or end today', () => {
    const booking = {
      ...baseBooking,
      startDate: formatISO(addDays(today, -3)),
      endDate: formatISO(addDays(today, 3)),
    }
    const result = bookingClass(today, booking)
    expect(result).toBe('bg-gray-100 text-gray-700')
  })
})
