<template>
  <div class="relative">
    <input
      type="text"
      v-model="query"
      @input="onInput"
      placeholder="Search station..."
      class="border p-2 rounded w-full"
    />
    <ul v-if="suggestions.length" class="absolute bg-white border mt-1 w-full z-10">
      <li
        v-for="(suggestion, index) in suggestions"
        :key="index"
        @click="selectSuggestion(suggestion)"
        class="p-2 hover:bg-gray-200 cursor-pointer"
      >
        {{ suggestion.name }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { fetchStations } from '../api/station';
import type { Station } from '../types';

const emit = defineEmits<{ (e: 'select', station: Station): void }>();

const query = ref('');
const suggestions = ref<Station[]>([]);

const onInput = async () => {
  if (query.value.length < 2) {
    suggestions.value = [];
    return;
  }
  try {
    suggestions.value = await fetchStations(query.value);
  } catch (error) {
    console.error('Error fetching suggestions', error);
  }
};

const selectSuggestion = (suggestion: Station) => {
  query.value = suggestion.name;
  suggestions.value = [];
  emit('select', suggestion);
};
</script>
