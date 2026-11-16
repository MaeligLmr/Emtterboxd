<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import type { Film } from '@/types/db/Film'
import FilmCard from './FilmCard.vue'

defineProps<{ films: Film[] }>()
const emit = defineEmits<{ close: []; create: []; pick: [film: Film] }>()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => {
  window.addEventListener('keydown', onKey)
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <!-- Mobile : feuille plein écran collée en bas ; à partir de sm : boîte centrée -->
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/75 sm:items-center sm:p-6"
    @mousedown.self="emit('close')"
  >
    <div
      class="flex max-h-[85dvh] w-full flex-col rounded-t-xl bg-[#1b2128] shadow-2xl ring-1 ring-white/10 sm:max-w-xl sm:rounded"
      role="dialog"
      aria-modal="true"
      aria-label="Add a favorite"
    >
      <div class="flex items-center justify-between border-b border-lb-line px-4 py-3">
        <h2 class="text-xs font-bold uppercase tracking-widest text-lb-muted">Add a favorite</h2>
        <button
          type="button"
          class="-mr-2 flex h-11 w-11 cursor-pointer items-center justify-center text-2xl leading-none text-lb-muted hover:text-white"
          aria-label="Close"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <div class="overflow-y-auto p-4">
        <button type="button" class="lb-btn lb-btn-green w-full" @click="emit('create')">
          + Create a new review
        </button>

        <p class="mb-3 mt-6 text-xs font-bold uppercase tracking-widest text-lb-muted">
          Or pick one of my reviews
        </p>
        <p v-if="!films.length" class="py-6 text-center text-sm text-lb-muted">
          No non-favorite reviews yet.
        </p>
        <ul v-else class="grid grid-cols-3 gap-3 sm:grid-cols-4">
          <li v-for="film in films" :key="film.id">
            <FilmCard :film="film" @open="emit('pick', $event)" />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
