<template>
  <div class="w-full">
    <div v-if="isLoadingBooking" class="text-center text-gray-700 text-sm">
      Loading booking details...
    </div>

    <div
      v-else-if="booking"
      class="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg flex flex-col space-y-4"
    >
      <h2 class="text-2xl font-bold text-gray-800 drop-shadow-sm flex items-center">
        Booking Details
      </h2>

      <div class="flex flex-col md:flex-row gap-5">
        <div class="flex flex-col gap-4 w-1/3">
          <div class="flex flex-col">
            <span class="font-semibold text-gray-700">Customer Name</span>
            <span class="text-gray-800">{{ booking.customerName }}</span>
          </div>

          <div class="flex flex-col">
            <span class="font-semibold text-gray-700">Pick-up date</span>
            <span class="text-gray-800">{{ formatDate(booking.startDate) }}</span>
          </div>

          <div class="flex flex-col">
            <span class="font-semibold text-gray-700">Return date</span>
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

          <Dialog v-model:open="showDialog">
            <DialogTrigger>
              <Button
                variant="outline"
                class="flex gap-2 cursor-pointer px-3 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-[#388E3C] to-[#A5D6A7] hover:from-[#2e7030] hover:to-[#8bc78e] shadow-md hover:shadow-lg transition"
                ><CalendarClock /> Reschedule</Button
              >
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reschedule Booking</DialogTitle>
                <DialogDescription> Select a new pick-up and return date. </DialogDescription>
              </DialogHeader>

              <div class="flex flex-col gap-4">
                <VueDatePicker
                  v-model="newDateRange"
                  :enable-time-picker="true"
                  :range="true"
                  :model-type="'iso'"
                  :format="'yyyy-MM-dd HH:mm'"
                  :min-date="new Date()"
                  class="w-full [&_input]:text-xs!"
                />

                <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
              </div>

              <DialogFooter class="mt-4">
                <Button
                  :disabled="!newDateRange || newDateRange.length !== 2"
                  @click="handleReschedule"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div class="flex gap-2 flex-1 justify-center">
          <div class="w-56">
            <IconCamperVan />
          </div>
        </div>
      </div>

      <div class="pt-4">
        <Button variant="outline" @click="goBack">
          <ChevronLeft />
          Back to Calendar
        </Button>
      </div>
    </div>

    <div v-else class="text-center text-red-500">Booking not found.</div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import VueDatePicker from '@vuepic/vue-datepicker'

import type { Booking } from '../types'
import { useCalendarStore } from '../stores/calendarStore'

import IconCamperVan from '@/components/icons/IconCamperVan.vue'
import { ChevronLeft, CalendarClock } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const route = useRoute()
const router = useRouter()
const stationId = route.params.stationId as string
const bookingId = route.params.bookingId as string

const calendarStore = useCalendarStore()

const { data: booking, isLoading: isLoadingBooking } = useQuery<Booking>({
  queryKey: ['booking', stationId, bookingId],
  queryFn: async () => {
    const res = await fetch(
      `https://605c94c36d85de00170da8b4.mockapi.io/stations/${stationId}/bookings/${bookingId}`,
    )
    if (!res.ok) throw new Error('Failed to fetch booking')
    return res.json()
  },
})

const stationName = computed(() => {
  if (!calendarStore.stations.length) return 'Unknown'
  const station = calendarStore.stations.find((s) => s.id === stationId)
  return station?.name || 'Unknown'
})

const bookingDuration = computed(() => {
  if (!booking.value) return 0
  return Math.max(
    1,
    differenceInCalendarDays(parseISO(booking.value.endDate), parseISO(booking.value.startDate)),
  )
})

const formatDate = (dateStr: string) => format(parseISO(dateStr), 'EEEE, dd MMM yyyy, HH:mm')

const showDialog = ref(false)
const newDateRange = ref<[string, string] | null>(null)
const errorMessage = ref('')

function goBack() {
  router.push('/')
}

const queryClient = useQueryClient()

const updateBookingMutation = useMutation({
  mutationFn: async ([startDate, endDate]: [string, string]) => {
    const response = await fetch(
      `https://605c94c36d85de00170da8b4.mockapi.io/stations/${stationId}/bookings/${bookingId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      },
    )
    if (!response.ok) throw new Error('Failed to update booking')
    return response.json()
  },
  onSuccess: () => {
    toast.success('Booking rescheduled successfully')
    showDialog.value = false
    queryClient.invalidateQueries({ queryKey: ['booking', stationId, bookingId] })
  },
  onError: () => {
    errorMessage.value = 'Failed to update booking. Please try again.'
    toast.error('Update failed', { description: errorMessage.value })
  },
})

async function handleReschedule() {
  errorMessage.value = ''
  if (!newDateRange.value || newDateRange.value.length !== 2) return

  const [startDate, endDate] = newDateRange.value
  updateBookingMutation.mutate([startDate, endDate])
}

watch(showDialog, (isOpen) => {
  if (isOpen && booking.value) {
    newDateRange.value = [booking.value.startDate, booking.value.endDate]
  }
})
</script>