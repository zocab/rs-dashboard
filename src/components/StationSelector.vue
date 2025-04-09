<template>
  <Combobox v-model="selectedStation">
    <ComboboxAnchor as-child>
      <ComboboxTrigger as-child>
        <Button
          variant="outline"
          class="justify-between bg-[#388E3C] hover:bg-[#388e3cde] text-white hover:text-white w-full"
        >
          <LocateIcon />
          {{ selectedStation?.name ?? 'Select station' }}
          <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxList>
      <div class="relative w-full max-w-sm items-center">
        <ComboboxInput
          v-model="query"
          class="pl-2 focus-visible:ring-0 border-0 border-b rounded-none h-10"
          placeholder="Search station..."
        />
        <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
          <Search class="size-4 text-muted-foreground" />
        </span>
      </div>

      <ComboboxEmpty v-if="loading">Loading...</ComboboxEmpty>
      <ComboboxEmpty v-else-if="!filteredStations.length">No stations found.</ComboboxEmpty>

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
  </Combobox>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { debounce } from 'lodash-es'
import { LocateIcon, ChevronsUpDown, Search } from 'lucide-vue-next'
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
import type { Station } from '@/types'
import { useCalendarStore } from '@/stores/calendarStore'

const query = ref('')
const loading = ref(false)
const filteredStations = ref<Station[]>([])
const calendarStore = useCalendarStore()

const selectedStation = computed({
  get: () => calendarStore.selectedStation,
  set: (v) => calendarStore.setStation(v),
})

const fetchStations = debounce(async (q: string) => {
  if (!q) {
    filteredStations.value = []
    return
  }

  loading.value = true
  try {
    const res = await fetch(`https://605c94c36d85de00170da8b4.mockapi.io/stations?name=${encodeURIComponent(q)}`)
    filteredStations.value = await res.json()
  } catch (err) {
    console.error(err)
    filteredStations.value = []
  } finally {
    loading.value = false
  }
}, 300)

watch(query, (val) => {
  fetchStations(val)
})

onMounted(() => {
  if (!selectedStation.value) {
    fetchStations('')
  }
})
</script>
