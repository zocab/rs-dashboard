<template>
  <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
    <div class="w-full md:w-auto">
      <div class="relative mt-1">
        <StationSelector />
      </div>
    </div>
    <div class="flex gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center gap-1">
        <VueDatePicker v-model="selectedDate" :format="'yyyy-MM-dd'" @update:model-value="onDateChange"
          input-class-name="border border-gray-300 px-3 py-2 rounded w-full sm:w-60" placeholder="Jump to date..."
          text-input :enable-time-picker="false" />
        <Button @click="goToToday"
          class="px-4 py-2 rounded-lg border border-gray-300 bg-[#A5D6A7] text-gray-700 hover:bg-white shadow-sm transition cursor-pointer">
          Today
        </Button>
      </div>
      <div class="flex gap-0.5">
        <Button @click="changeWeek('prev')"
          class="cursor-pointer px-4 py-2 rounded-l-lg border border-gray-300 bg-[#a7ea1b] text-gray-700 hover:bg-white shadow-sm transition">
          Prev
        </Button>
        <Button @click="changeWeek('next')"
          class="cursor-pointer px-4 py-2 rounded-r-lg border border-gray-300 bg-[#a7ea1b] text-gray-700 hover:bg-white shadow-sm transition">
          Next
        </Button>
      </div>
    </div>
  </div>
  <div class="relative flex flex-col flex-1">
    <!-- Calendar header -->
    <div class="flex">
      <div v-for="(day, index) in weekDays" :key="index" :class="cn(
        'bg-white/80 border-l last-of-type:border-r border-gray-200 flex flex-col transition overflow-hidden flex-1 shrink-0',
      )
        ">
        <div
          class="flex flex-col text-center md:flex-row md:justify-between font-semibold text-gray-700 text-sm border-b p-3 bg-[#ffd95d]">
          <span class="text-gray-500">{{ format(day, 'EEE') }}</span>
          <span>{{ format(day, 'dd MMM') }}</span>
        </div>
      </div>
    </div>
    <!-- Calendar body -->
    <div class="relative flex-1 grid h-full w-full py-4">
      <div class="absolute top-0 bottom-0 w-full flex">
        <div v-for="(day, index) in weekDays" :key="index" :class="cn(
          'border-l last-of-type:border-r border-b flex flex-col transition overflow-hidden flex-1 shrink-0',
        )
          ">

        </div>
      </div>
      <div class="relative w-full overflow-y-auto">
        <HoverCard v-for="(event, i) in eventsToDisplay" :key="event.customerName + i">
          <HoverCardTrigger :class="[
            'absolute rounded-md flex items-center px-2 cursor-pointer text-sm truncate text-gray-700',
            eventBackgroundColor(event),
          ]" :style="getEventStyle(event)" @click="showBookingDetail(event)">
            {{ event.customerName }}
          </HoverCardTrigger>
          <HoverCardContent class="text-xs space-y-1 w-auto">
            <p>
              <span class="font-bold">Pick-up:</span>
              {{ format(parseISO(event.startDate), 'dd MMM yyyy, HH:mm') }}
            </p>
            <p>
              <span class="font-bold">Return:</span>
              {{ format(parseISO(event.endDate), 'dd MMM yyyy, HH:mm') }}
            </p>
          </HoverCardContent>
        </HoverCard>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  format,
  startOfWeek,
  parseISO,
  differenceInCalendarDays,
  startOfDay,
  endOfWeek,
  areIntervalsOverlapping,
} from 'date-fns'
import { useQuery } from '@tanstack/vue-query'
import type { Booking, Station } from '../types'
import VueDatePicker from '@vuepic/vue-datepicker'
import { useCalendarStore } from '../stores/calendarStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import StationSelector from '@/components/StationSelector.vue'
import { useCalendarLogic } from '@/composables/useCalendar'
import { CONFIGS } from '@/constants/config'

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

function showBookingDetail(booking: Booking) {
  router.push({
    name: 'bookingDetail',
    params: { stationId: booking.pickupReturnStationId, bookingId: booking.id },
  })
}

const station = computed(() => data.value?.find((s) => s.id === selectedStation.value?.id))

function assignLanes(events: Booking[]): (Booking & { lane: number })[] {
  const lanes: (Booking & { lane: number })[][] = []
  const eventsWithLane: (Booking & { lane: number })[] = []

  events.forEach((event) => {
    const eventStart = startOfDay(parseISO(event.startDate))
    let placed = false

    for (let i = 0; i < lanes.length; i++) {
      const lastEventInLane = lanes[i][lanes[i].length - 1]
      const lastEventEnd = startOfDay(parseISO(lastEventInLane.endDate))
      if (eventStart.getTime() > lastEventEnd.getTime()) {
        lanes[i].push({ ...event, lane: i })
        eventsWithLane.push({ ...event, lane: i })
        placed = true
        break
      }
    }

    if (!placed) {
      const laneIndex = lanes.length
      lanes.push([{ ...event, lane: laneIndex }])
      eventsWithLane.push({ ...event, lane: laneIndex })
    }
  })

  return eventsWithLane
}

const sortedEvents = computed(() => {
  if (!station.value) return []

  const weekStart = currentWeekStart.value
  const weekEnd = endOfCurrentWeek.value
  const weekInterval = { start: weekStart, end: weekEnd }

  return [...station.value.bookings]
    .filter((booking) => {
      const bookingInterval = {
        start: startOfDay(parseISO(booking.startDate)),
        end: startOfDay(parseISO(booking.endDate)),
      }

      return areIntervalsOverlapping(bookingInterval, weekInterval, { inclusive: true })
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
})

const eventsWithLane = computed(() => assignLanes(sortedEvents.value))

const endOfCurrentWeek = computed(() => endOfWeek(currentWeekStart.value, { weekStartsOn: 1 }))

const eventsToDisplay = computed(() => {
  return eventsWithLane.value.filter((event) => {
    const eventStart = startOfDay(parseISO(event.startDate))
    const eventEnd = startOfDay(parseISO(event.endDate))
    return eventEnd >= currentWeekStart.value && eventStart <= endOfCurrentWeek.value
  })
})

function getEventStyle(event: Booking & { lane: number }) {
  const originalStart = startOfDay(parseISO(event.startDate))
  const originalEnd = startOfDay(parseISO(event.endDate))

  const effectiveStart =
    originalStart < currentWeekStart.value ? currentWeekStart.value : originalStart
  const effectiveEnd = originalEnd > endOfCurrentWeek.value ? endOfCurrentWeek.value : originalEnd

  const startOffsetDays = differenceInCalendarDays(effectiveStart, currentWeekStart.value)
  const leftOffsetPercent = (startOffsetDays / 7) * 100

  const effectiveDays = differenceInCalendarDays(effectiveEnd, effectiveStart) + 1
  const widthPercent = (effectiveDays / 7) * 100

  const topPosition = event.lane * (CONFIGS.EVENT_HEIGHT + CONFIGS.EVENT_OFFSET_HEIGHT)

  return {
    position: 'absolute',
    width: `calc(${widthPercent}% - ${CONFIGS.EVENT_HORIZONTAL_MARGIN * 2}px)`,
    left: `calc(${leftOffsetPercent}% + ${CONFIGS.EVENT_HORIZONTAL_MARGIN}px)`,
    top: `${topPosition}px`,
    height: `${CONFIGS.EVENT_HEIGHT}px`,
  }
}

function eventBackgroundColor(event: Booking) {
  const originalEnd = startOfDay(parseISO(event.endDate))
  return originalEnd <= endOfCurrentWeek.value ? 'bg-orange-500' : 'bg-green-500'
}
</script>
