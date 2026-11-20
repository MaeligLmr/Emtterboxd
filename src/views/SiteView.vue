<script setup lang="ts">
import { computed } from 'vue'
import type { Film } from '@/types/db/Film'
import { formatMonth } from '@/lib/date'
import DiaryEntry from '@/components/DiaryEntry.vue'

// readonly: public diary of someone else (no "add" call to action)
const props = defineProps<{ films: Film[]; readonly?: boolean }>()
const emit = defineEmits<{ open: [film: Film]; add: [] }>()

// Diary: newest first, grouped by month of the watch date
const months = computed(() => {
  const sorted = [...props.films].sort(
    (a, b) => b.watched_at.localeCompare(a.watched_at) || b.created_at.localeCompare(a.created_at),
  )
  const groups: { key: string; label: string; films: Film[] }[] = []
  for (const film of sorted) {
    const key = film.watched_at.slice(0, 7)
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.films.push(film)
    else groups.push({ key, label: formatMonth(film.watched_at), films: [film] })
  }
  return groups
})

function handleOpen(film: Film) {
  emit('open', film)
}
function handleAdd() {
  emit('add')
}
</script>

<template>
  <section class="-mx-4 sm:mx-0">
    <div v-if="!films.length" class="px-4 py-20 text-center text-lb-muted">
      <p class="mb-4">No films yet.</p>
      <button v-if="!readonly" type="button" class="lb-btn lb-btn-green" @click="handleAdd">
        Add a film
      </button>
    </div>

    <div v-for="month in months" :key="month.key">
      <h2 class="bg-lb-panel px-4 py-3 text-sm font-medium uppercase tracking-[0.2em] text-lb-text">
        {{ month.label }}
      </h2>
      <ul>
        <li v-for="film in month.films" :key="film.id">
          <DiaryEntry :film="film" @open="handleOpen" />
        </li>
      </ul>
    </div>
  </section>
</template>
