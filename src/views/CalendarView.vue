<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { useQuery } from '@tanstack/vue-query'
import type { Booking, Station } from '../types'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import IconChevronDown from '../components/icons/IconChevronDown.vue'
import IconCheck from '../components/icons/IconCheck.vue'
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  TransitionRoot
} from '@headlessui/vue'
import { useCalendarStore } from '../stores/calendarStore'

async function fetchStations(): Promise<Station[]> {
  const res = await fetch('https://605c94c36d85de00170da8b4.mockapi.io/stations')
  const resData = await res.json()
  calendarStore.setStations(resData)
  return resData
}

const { data } = useQuery({ queryKey: ['stations'], queryFn: fetchStations,  })
const router = useRouter()
const calendarStore = useCalendarStore()

const selectedStation = computed({
  get: () => calendarStore.selectedStation,
  set: (v) => calendarStore.setStation(v)
})
const selectedDate = computed({
  get: () => calendarStore.selectedDate,
  set: (v) => calendarStore.setDate(v)
})

const query = ref('')
const currentWeekStart = ref(startOfWeek(selectedDate.value, { weekStartsOn: 1 }))

watch(selectedDate, (newVal) => {
  currentWeekStart.value = startOfWeek(newVal, { weekStartsOn: 1 })
})

const filteredStations = computed(() => {
  const stations = data.value ?? []
  if (!query.value) return stations
  return stations.filter(x =>
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
  const st = data.value?.find(x => x.id === selectedStation.value?.id)
  if (!st) return []
  return st.bookings.filter(b => {
    const s = parseISO(b.startDate)
    const e = parseISO(b.endDate)
    return isSameDay(day, s) || isSameDay(day, e)
  })
}

function showBookingDetail(b: Booking) {
  router.push({ name: 'bookingDetail', params: { stationId: b.pickupReturnStationId, bookingId: b.id } })
}

function getStationName(s: unknown): string {
  return (s as Station)?.name || ''
}
</script>

<template>
  <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
    <div class="w-72">
      <Combobox v-model="selectedStation">
        <div class="relative mt-1">
          <div class="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none sm:text-sm">
            <ComboboxInput
              class="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
              :displayValue="getStationName"
              @change="query = $event.target.value"
              placeholder="Select station..."
            />
            <ComboboxButton class="absolute inset-y-0 right-0 flex items-center pr-2">
              <IconChevronDown class="h-5 w-5 text-gray-400" />
            </ComboboxButton>
          </div>
          <TransitionRoot leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" @after-leave="query = ''">
            <ComboboxOptions class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 sm:text-sm">
              <div v-if="filteredStations.length === 0 && query !== ''" class="relative cursor-default select-none px-4 py-2 text-gray-700">
                No stations found.
              </div>
              <ComboboxOption
                v-for="st in filteredStations"
                :key="st.id"
                :value="st"
                as="template"
                v-slot="{ selected, active }"
              >
                <li class="relative cursor-default select-none py-2 pl-10 pr-4" :class="{ 'bg-purple-300 text-white': active, 'text-gray-900': !active }">
                  <span class="block truncate" :class="{ 'font-medium': selected, 'font-normal': !selected }">
                    {{ st.name }}
                  </span>
                  <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3" :class="{ 'text-white': active, 'text-teal-600': !active }">
                    <IconCheck class="h-5 w-5" />
                  </span>
                </li>
              </ComboboxOption>
            </ComboboxOptions>
          </TransitionRoot>
        </div>
      </Combobox>
    </div>
    <div class="flex gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center gap-1">
        <VueDatePicker
          v-model="selectedDate"
          :format="'yyyy-MM-dd'"
          @update:model-value="onDateChange"
          input-class-name="border border-gray-300 px-3 py-2 rounded w-full sm:w-60"
          placeholder="Jump to date..."
        />
        <button
          @click="goToToday"
          class="px-4 py-2 rounded-lg border border-gray-300 bg-white/90 text-gray-700 hover:bg-white shadow-sm transition cursor-pointer"
        >
          Today
        </button>
      </div>
      <div class="flex gap-0.5">
        <button @click="prevWeek" class="cursor-pointer px-4 py-2 rounded-l-lg border border-gray-300 bg-white/90 text-gray-700 hover:bg-white shadow-sm transition">
          Prev
        </button>
        <button @click="nextWeek" class="cursor-pointer px-4 py-2 rounded-r-lg border border-gray-300 bg-white/90 text-gray-700 hover:bg-white shadow-sm transition">
          Next
        </button>
      </div>
    </div>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-7 gap-2">
    <div v-for="(day, index) in weekDays" :key="index" class="bg-white/80 rounded-lg shadow-sm border border-gray-200 p-3 backdrop-blur-sm flex flex-col hover:shadow-md transition">
      <div class="font-semibold text-gray-700 text-sm mb-3">
        {{ formatDate(day, 'EEE dd MMM') }}
      </div>
      <div class="flex-1 overflow-y-auto space-y-2">
        <div
          v-for="b in bookingsForDay(day)"
          :key="b.id"
          class="text-xs p-2 rounded shadow cursor-pointer hover:opacity-95 hover:scale-[1.01] transition-transform duration-150"
          :class="bookingClass(day, b)"
          @click="showBookingDetail(b)"
          :title="`Start: ${format(parseISO(b.startDate), 'dd MMM yyyy')} | End: ${format(parseISO(b.endDate), 'dd MMM yyyy')}`"
        >
          {{ b.customerName }}
        </div>
      </div>
    </div>
  </div>
</template>
