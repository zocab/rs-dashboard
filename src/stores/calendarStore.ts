import { defineStore } from 'pinia'
import type { Station } from '../types'

interface CalendarState {
  selectedStation: Station | null
  selectedDate: Date
  stations: Station[]
}

export const useCalendarStore = defineStore('calendar', {
  state: (): CalendarState => ({
    selectedStation: null,
    selectedDate: new Date('2021-02-16'),
    stations: [],
  }),
  actions: {
    setStation(station: Station | null) {
      this.selectedStation = station
    },
    setDate(date: Date) {
      this.selectedDate = date
    },
    setStations(stations: Station[]) {
      this.stations = stations
    },
  },
  persist: true,
})
