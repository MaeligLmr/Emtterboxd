<script setup lang="ts">
import { useSignedUrl } from '@/composables/useSignedUrl'
import type { Film } from '@/types/db/Film'
import { filmHandler } from '@/handlers/filmHandler'
import { dayOfMonth } from '@/lib/date'
import RewatchIcon from './RewatchIcon.vue'
import StarRating from './StarRating.vue'

const props = defineProps<{ film: Film }>()
const emit = defineEmits<{ open: [film: Film] }>()

const poster = useSignedUrl(() => props.film.poster_path, (p) => filmHandler.posterUrl(p))

function handleOpen() {
  emit('open', props.film)
}
</script>

<template>
  <button
    type="button"
    class="flex w-full cursor-pointer items-center gap-4 px-4 text-left transition hover:bg-white/5"
    @click="handleOpen"
  >
    <span
      class="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-lb-line text-3xl font-light text-lb-text"
    >
      {{ dayOfMonth(film.watched_at) }}
    </span>

    <span class="aspect-[2/3] w-11 shrink-0 overflow-hidden rounded-[3px] bg-lb-panel ring-1 ring-white/20">
      <img v-if="poster" :src="poster" alt="" loading="lazy" class="h-full w-full object-cover" />
    </span>

    <span class="min-w-0 flex-1 self-stretch border-b border-lb-line py-4">
      <span class="block text-lg font-bold leading-snug text-white">{{ film.title }}</span>
      <span class="mt-1 flex items-center gap-2">
        <StarRating :model-value="film.rating" readonly size="1rem" />
        <RewatchIcon v-if="film.rewatched" class="text-sm text-lb-muted" />
      </span>
    </span>
  </button>
</template>
