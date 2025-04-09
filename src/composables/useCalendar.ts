import { ref, computed, watch } from 'vue'
import { startOfWeek, addDays } from 'date-fns'
import { useCalendarStore } from '@/stores/calendarStore'

export function useCalendarLogic() {
  const calendarStore = useCalendarStore()

  const selectedDate = computed({
    get: () => calendarStore.selectedDate,
    set: (date) => calendarStore.setDate(date),
  })

  const currentWeekStart = ref(startOfWeek(selectedDate.value, { weekStartsOn: 1 }))

  watch(selectedDate, (newValue) => {
    currentWeekStart.value = startOfWeek(newValue, { weekStartsOn: 1 })
  })

  const weekDays = computed(() =>
    Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart.value, i)),
  )

  function goToToday() {
    const today = new Date()
    selectedDate.value = today
    currentWeekStart.value = startOfWeek(today, { weekStartsOn: 1 })
  }

  function changeWeek(direction: 'next' | 'prev') {
    const offset = direction === 'next' ? 7 : -7
    const newStart = addDays(currentWeekStart.value, offset)
    calendarStore.setDate(newStart)
    currentWeekStart.value = newStart
  }

  return {
    selectedDate,
    currentWeekStart,
    weekDays,
    goToToday,
    changeWeek,
  }
}
