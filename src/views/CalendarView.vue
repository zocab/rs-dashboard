<template>
  <div
    class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0"
  >
    <div class="w-full md:w-auto">
      <div class="relative mt-1">
        <StationSelector />
      </div>
    </div>
    <div class="flex gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center gap-1">
        <VueDatePicker
          v-model="selectedDate"
          :format="'yyyy-MM-dd'"
          @update:model-value="onDateChange"
          input-class-name="border border-gray-300 px-3 py-2 rounded w-full sm:w-60"
          placeholder="Jump to date..."
          text-input
          :enable-time-picker="false"
        />
        <Button
          @click="goToToday"
          class="px-4 py-2 rounded-lg border border-gray-300 bg-[#A5D6A7] text-gray-700 hover:bg-white shadow-sm transition cursor-pointer"
        >
          Today
        </Button>
      </div>
      <div class="flex gap-0.5">
        <button
          @click="changeWeek('prev')"
          class="cursor-pointer px-4 py-2 rounded-l-lg border border-gray-300 bg-[#a7ea1b] text-gray-700 hover:bg-white shadow-sm transition"
        >
          Prev
        </button>
        <button
          @click="changeWeek('next')"
          class="cursor-pointer px-4 py-2 rounded-r-lg border border-gray-300 bg-[#a7ea1b] text-gray-700 hover:bg-white shadow-sm transition"
        >
          Next
        </button>
      </div>
    </div>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-7">
    <div
      v-for="(day, index) in weekDays"
      :key="index"
      :class="
        cn(
          'bg-white/80 shadow-sm border border-gray-200 flex flex-col hover:shadow-md transition overflow-hidden',
          'first-of-type:rounded-tl-lg last-of-type:rounded-tr-lg',
          'first-of-type:rounded-tr-lg first-of-type:sm:rounded-tr-none',
        )
      "
    >
      <div
        class="flex justify-between font-semibold text-gray-700 text-sm border-b p-3 bg-[#ffd95d]"
      >
        <span class="text-gray-500">{{ format(day, 'EEE') }}</span>
        <span>{{ format(day, 'dd MMM') }}</span>
      </div>
      <div class="flex-1 space-y-2 overflow-hidden py-4 px-3 md:min-h-44">
        <HoverCard v-for="booking in bookingsForDay(day)" :key="booking.id">
          <HoverCardTrigger
            :class="bookingClass(day, booking)"
            @click="showBookingDetail(booking)"
            class="text-xs p-2 rounded shadow cursor-pointer transition-transform duration-150 flex flex-col"
          >
            <span>{{ booking.customerName }}</span>
            <span class="text-[10px] text-gray-600 mt-1">
              {{
                isSameDay(day, parseISO(booking.startDate))
                  ? 'Pickup: ' + format(parseISO(booking.startDate), 'HH:mm')
                  : 'Return: ' + format(parseISO(booking.endDate), 'HH:mm')
              }}
            </span>
          </HoverCardTrigger>
          <HoverCardContent class="text-xs space-y-1 w-auto">
            <p>
              <span class="font-bold">From:</span>
              {{ format(parseISO(booking.startDate), 'dd MMM yyyy, HH:mm') }}
            </p>
            <p>
              <span class="font-bold">To:</span>
              {{ format(parseISO(booking.endDate), 'dd MMM yyyy, HH:mm') }}
            </p>
          </HoverCardContent>
        </HoverCard>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { format, startOfWeek, isSameDay, parseISO } from 'date-fns'
import { useQuery } from '@tanstack/vue-query'
import type { Booking, Station } from '../types'
import VueDatePicker from '@vuepic/vue-datepicker'
import { useCalendarStore } from '../stores/calendarStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import StationSelector from '@/components/StationSelector.vue'
import { useCalendarLogic } from '@/composables/useCalendar'
import { bookingClass } from '@/lib/bookingClass'

const { selectedDate, currentWeekStart, weekDays, goToToday, changeWeek } = useCalendarLogic()

const calendarStore = useCalendarStore()
const router = useRouter()

const selectedStation = computed({
  get: () => calendarStore.selectedStation,
  set: (v) => calendarStore.setStation(v),
})

async function fetchStations(): Promise<Station[]> {
  const res = await fetch('https://605c94c36d85de00170da8b4.mockapi.io/stations')
  const resData = await res.json()
  calendarStore.stations = resData
  return resData
}

const { data } = useQuery({ queryKey: ['stations'], queryFn: fetchStations })

watch(selectedDate, (newValue) => {
  currentWeekStart.value = startOfWeek(newValue, { weekStartsOn: 1 })
})

watch(
  () => data.value,
  (stations) => {
    if (stations && stations.length > 0 && !selectedStation.value) {
      selectedStation.value = stations[0]
    }
  },
  { immediate: true },
)

function onDateChange(date: Date) {
  if (!date) return
  currentWeekStart.value = startOfWeek(date, { weekStartsOn: 1 })
}

function bookingsForDay(day: Date): Booking[] {
  if (!selectedStation.value) return []
  const station = data.value?.find((s) => s.id === selectedStation.value?.id)
  if (!station) return []
  return station.bookings.filter((booking) => {
    const start = parseISO(booking.startDate)
    const end = parseISO(booking.endDate)
    return isSameDay(day, start) || isSameDay(day, end)
  })
}

function showBookingDetail(booking: Booking) {
  router.push({
    name: 'bookingDetail',
    params: { stationId: booking.pickupReturnStationId, bookingId: booking.id },
  })
}
</script>
