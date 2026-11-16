<script setup lang="ts">
import { useSignedUrl } from '@/composables/useSignedUrl'
import type { Film } from '@/types/db/Film'
import { filmHandler } from '@/handlers/filmHandler'
import StarRating from './StarRating.vue'
import RewatchIcon from './RewatchIcon.vue'

const props = defineProps<{ film: Film }>()
const emit = defineEmits<{ open: [film: Film] }>()
const url = useSignedUrl(() => props.film.poster_path, (p) => filmHandler.posterUrl(p))
</script>

<template>
  <button type="button" class="group block w-full cursor-pointer text-left" @click="emit('open', film)">
    <div
      class="relative aspect-[2/3] overflow-hidden rounded-[3px] bg-lb-panel ring-1 ring-white/20 transition group-hover:ring-2 group-hover:ring-lb-blue"
    >
      <img v-if="url" :src="url" :alt="film.title" loading="lazy" class="h-full w-full object-cover" />
      <span
        v-else
        class="flex h-full items-center justify-center p-3 text-center text-sm font-semibold text-lb-text"
      >
        {{ film.title }}
      </span>
      <span
        class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pb-1.5 pt-6 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100"
      >
        {{ film.title }}
      </span>
    </div>
    <div class="mt-1.5 flex h-5 items-center gap-1.5 px-0.5">
      <StarRating :model-value="film.rating" readonly size="0.8rem" />
      <RewatchIcon v-if="film.rewatched" class="text-lb-muted" />
    </div>
  </button>
</template>
