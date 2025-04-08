<template>
  <div class="w-full">
    <div v-if="isLoadingBooking" class="text-center text-gray-700 text-sm">
      Loading booking details...
    </div>

    <div v-else-if="booking" class="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg flex flex-col space-y-4">
      <h2 class="text-2xl font-bold text-gray-800 drop-shadow-sm flex items-center">
        Booking Details
      </h2>

      <div class="flex flex-col">
        <span class="font-semibold text-gray-700">Customer Name</span>
        <span class="text-gray-800">{{ booking.customerName }}</span>
      </div>

      <div class="flex flex-col">
        <span class="font-semibold text-gray-700">Start Date</span>
        <span class="text-gray-800">{{ formatDate(booking.startDate) }}</span>
      </div>

      <div class="flex flex-col">
        <span class="font-semibold text-gray-700">End Date</span>
        <span class="text-gray-800">{{ formatDate(booking.endDate) }}</span>
      </div>

      <div class="flex flex-col">
        <span class="font-semibold text-gray-700">Duration</span>
        <span class="text-gray-800">
          {{ bookingDuration }} day<span v-if="bookingDuration !== 1">s</span>
        </span>
      </div>

      <div class="flex flex-col">
        <span class="font-semibold text-gray-700">Station</span>
        <span class="text-gray-800">{{ stationName }}</span>
      </div>

      <div class="pt-4">
        <button
          @click="goBack"
          class="px-5 py-2 rounded-lg font-semibold text-white
                 bg-gradient-to-r from-indigo-500 to-purple-600
                 hover:from-indigo-600 hover:to-purple-700
                 shadow-md hover:shadow-lg transition"
        >
          Back to Calendar
        </button>
      </div>
    </div>

    <div v-else class="text-center text-red-500">
      Booking not found.
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { useQuery } from '@tanstack/vue-query'
import type { Booking } from '../types'
import { useCalendarStore } from '../stores/calendarStore'

const route = useRoute()
const router = useRouter()
const calendarStore = useCalendarStore()

const stationId = route.params.stationId as string
const bookingId = route.params.bookingId as string

const {
  data: booking,
  isLoading: isLoadingBooking,
} = useQuery<Booking>({
  queryKey: ['booking', stationId, bookingId],
  queryFn: async () => {
    const res = await fetch(`https://605c94c36d85de00170da8b4.mockapi.io/stations/${stationId}/bookings/${bookingId}`)
    if (!res.ok) throw new Error('Failed to fetch booking')
    return res.json()
  },
})

const stationName = computed(() => {
  if (!calendarStore.stations.length) return 'Unknown'
  const station = calendarStore.stations.find(s => s.id === stationId)
  return station?.name || 'Unknown'
})

const formatDate = (dateStr: string) => format(parseISO(dateStr), 'PPPP p')

const bookingDuration = computed(() => {
  if (!booking.value) return 0
  return differenceInCalendarDays(
    parseISO(booking.value.endDate),
    parseISO(booking.value.startDate)
  )
})

function goBack() {
  router.push('/')
}
</script>
