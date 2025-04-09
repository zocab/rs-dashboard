<template>
  <div
    class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0"
  >
    <div class="w-full md:w-auto">
      <div class="relative mt-1">
        <Combobox v-model="selectedStation">
          <ComboboxAnchor as-child>
            <ComboboxTrigger as-child>
              <Button
                variant="outline"
                class="justify-between bg-[#388E3C] hover:bg-[#388e3cde] text-white hover:text-white w-full"
              >
                <LocateIcon /> {{ selectedStation?.name ?? 'Select station' }}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </ComboboxTrigger>
          </ComboboxAnchor>

          <ComboboxList v-if="filteredStations.length > 0">
            <div class="relative w-full max-w-sm items-center">
              <ComboboxInput
                class="pl-2 focus-visible:ring-0 border-0 border-b rounded-none h-10"
                placeholder="Select station..."
              />
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
                <Search class="size-4 text-muted-foreground" />
              </span>
            </div>

            <ComboboxEmpty> No framework found. </ComboboxEmpty>

            <ComboboxGroup>
              <ComboboxItem
                v-for="station in filteredStations"
                :key="station.id"
                :value="station"
                class="cursor-pointer px-4 py-2 hover:bg-gray-100"
              >
                {{ station.name }}
              </ComboboxItem>
            </ComboboxGroup>
          </ComboboxList>
          <ComboboxEmpty v-else class="px-4 py-2 text-gray-500">No stations found.</ComboboxEmpty>
        </Combobox>
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
          @click="prevWeek"
          class="cursor-pointer px-4 py-2 rounded-l-lg border border-gray-300 bg-[#a7ea1b] text-gray-700 hover:bg-white shadow-sm transition"
        >
          Prev
        </button>
        <button
          @click="nextWeek"
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
          'first-of-type:rounded-tr-lg first-of-type:sm:rounded-tr-none'
        )
      "
    >
      <div
        class="flex justify-between font-semibold text-gray-700 text-sm border-b p-3 bg-[#ffd95d]"
      >
        <span class="text-gray-500">{{ formatDate(day, 'EEE') }}</span>
        <span>{{ formatDate(day, 'dd MMM') }}</span>
      </div>
      <div class="flex-1 space-y-2 overflow-hidden py-4 px-3 md:min-h-44">
        <HoverCard v-for="b in bookingsForDay(day)" :key="b.id">
          <HoverCardTrigger
            :class="bookingClass(day, b)"
            @click="showBookingDetail(b)"
            class="text-xs p-2 rounded shadow cursor-pointer transition-transform duration-150 flex"
            >{{ b.customerName }}</HoverCardTrigger
          >
          <HoverCardContent class="text-xs space-y-1 w-auto">
            <p>
              <span class="font-bold">From:</span>
              {{ format(parseISO(b.startDate), 'dd MMM yyyy, hh:mm a') }}
            </p>
            <p>
              <span class="font-bold">To:</span>
              {{ format(parseISO(b.endDate), 'dd MMM yyyy, hh:mm a') }}
            </p>
          </HoverCardContent>
        </HoverCard>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { useQuery } from '@tanstack/vue-query'
import type { Booking, Station } from '../types'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

import { useCalendarStore } from '../stores/calendarStore'

import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/ui/combobox'
import { ChevronsUpDown, Search, LocateIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

async function fetchStations(): Promise<Station[]> {
  const res = await fetch('https://605c94c36d85de00170da8b4.mockapi.io/stations')
  const resData = await res.json()
  calendarStore.stations = resData
  return resData
}

const { data } = useQuery({ queryKey: ['stations'], queryFn: fetchStations })
const router = useRouter()
const calendarStore = useCalendarStore()

const selectedStation = computed({
  get: () => calendarStore.selectedStation,
  set: (v) => calendarStore.setStation(v),
})
const selectedDate = computed({
  get: () => calendarStore.selectedDate,
  set: (v) => calendarStore.setDate(v),
})

const query = ref('')
const currentWeekStart = ref(startOfWeek(selectedDate.value, { weekStartsOn: 1 }))

watch(selectedDate, (newVal) => {
  currentWeekStart.value = startOfWeek(newVal, { weekStartsOn: 1 })
})

const filteredStations = computed(() => {
  const stations = data.value ?? []
  if (!query.value) return stations
  return stations.filter((x) =>
    x.name.toLowerCase().replace(/\s+/g, '').includes(query.value.toLowerCase().replace(/\s+/g, ''))
  )
})

watch(
  () => data.value,
  (stations) => {
    if (stations && stations.length > 0 && !selectedStation.value) {
      selectedStation.value = stations[0]
    }
  },
  { immediate: true }
)

function onDateChange(date: Date) {
  if (!date) return
  currentWeekStart.value = startOfWeek(date, { weekStartsOn: 1 })
}

function goToToday() {
  const today = new Date()
  selectedDate.value = today
  currentWeekStart.value = startOfWeek(today, { weekStartsOn: 1 })
}

const weekDays = computed(() =>
  Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart.value, i))
)

function formatDate(date: Date, fmt: string) {
  return format(date, fmt)
}

function prevWeek() {
  const newStart = addDays(currentWeekStart.value, -7)
  calendarStore.setDate(newStart)
  currentWeekStart.value = newStart
}

function nextWeek() {
  const newStart = addDays(currentWeekStart.value, 7)
  calendarStore.setDate(newStart)
  currentWeekStart.value = newStart
}

function bookingClass(day: Date, b: Booking) {
  const s = parseISO(b.startDate)
  const e = parseISO(b.endDate)
  if (isSameDay(day, s)) return 'bg-green-100 text-green-800'
  if (isSameDay(day, e)) return 'bg-red-100 text-red-800'
  return 'bg-gray-100 text-gray-700'
}

function bookingsForDay(day: Date): Booking[] {
  if (!selectedStation.value) return []
  const st = data.value?.find((x) => x.id === selectedStation.value?.id)
  if (!st) return []
  return st.bookings.filter((b) => {
    const s = parseISO(b.startDate)
    const e = parseISO(b.endDate)
    return isSameDay(day, s) || isSameDay(day, e)
  })
}

function showBookingDetail(b: Booking) {
  router.push({
    name: 'bookingDetail',
    params: { stationId: b.pickupReturnStationId, bookingId: b.id },
  })
}

</script>
