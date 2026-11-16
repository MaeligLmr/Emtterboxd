<script setup lang="ts">
import { computed } from 'vue'
import { useSignedUrl } from '@/composables/useSignedUrl'
import type { Film } from '@/types/db/Film'
import { MAX_FAVORITES } from '@/constants'
import { filmHandler } from '@/handlers/filmHandler'
import { profileHandler } from '@/handlers/profileHandler'
import { formatDay } from '@/lib/date'
import BackButton from '@/components/BackButton.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'
import KebabMenu from '@/components/KebabMenu.vue'
import RewatchIcon from '@/components/RewatchIcon.vue'
import StarRating from '@/components/StarRating.vue'

const props = defineProps<{
  film: Film
  favoritesFull: boolean
  username: string
  avatarPath: string | null
}>()
const emit = defineEmits<{
  back: []
  edit: [film: Film]
  delete: [film: Film]
  rewatch: [film: Film]
  'toggle-favorite': [film: Film]
}>()

const posterSrc = useSignedUrl(() => props.film.poster_path, (p) => filmHandler.posterUrl(p))
const avatarSrc = useSignedUrl(() => props.avatarPath, (p) => profileHandler.avatarUrl(p))
const watchedOn = computed(() => formatDay(props.film.watched_at))
const favDisabled = computed(() => !props.film.favorite && props.favoritesFull)

function handleEdit() {
  emit('edit', props.film)
}
function handleDelete() {
  emit('delete', props.film)
}
function handleRewatch() {
  emit('rewatch', props.film)
}
function handleToggleFavorite() {
  emit('toggle-favorite', props.film)
}
</script>

<template>
  <!-- Mobile-first review page: top bar, author + title + rating + date next to the poster, then the comment -->
  <section class="mx-auto max-w-2xl">
    <div class="-mt-2 mb-2 flex items-center gap-1">
      <BackButton @click="emit('back')" />
      <h2 class="flex-1 text-xl font-bold text-white">Your Review</h2>
      <KebabMenu>
        <button
          type="button"
          role="menuitem"
          class="block w-full cursor-pointer px-4 py-2 text-left text-xs font-bold uppercase tracking-widest text-lb-text hover:bg-white/10 hover:text-white"
          @click="handleEdit"
        >
          Edit
        </button>
        <button
          type="button"
          role="menuitem"
          class="block w-full cursor-pointer px-4 py-2 text-left text-xs font-bold uppercase tracking-widest text-lb-text hover:bg-white/10 hover:text-red-400"
          @click="handleDelete"
        >
          Delete
        </button>
      </KebabMenu>
    </div>

    <div class="flex gap-4 border-b border-lb-line py-6">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-lb-panel text-sm font-bold uppercase text-lb-text ring-1 ring-white/20"
          >
            <img v-if="avatarSrc" :src="avatarSrc" alt="" class="h-full w-full object-cover" />
            <template v-else>{{ username.charAt(0) }}</template>
          </span>
          <span class="truncate text-base font-bold text-lb-text">{{ username }}</span>
        </div>

        <h1 class="mt-5 text-3xl font-extrabold leading-tight text-white">{{ film.title }}</h1>

        <div class="mt-3">
          <StarRating :model-value="film.rating" readonly size="1.9rem" />
          <span v-if="!film.rating" class="text-sm text-lb-muted">No rating</span>
        </div>

        <p class="mt-4 flex items-center gap-2 text-base text-lb-muted">
          <RewatchIcon v-if="film.rewatched" />
          {{ film.rewatched ? 'Rewatched' : 'Watched' }} {{ watchedOn }}
        </p>
      </div>

      <div
        class="aspect-[2/3] w-[34%] max-w-48 shrink-0 self-start overflow-hidden rounded-md bg-lb-panel ring-1 ring-white/20"
      >
        <img v-if="posterSrc" :src="posterSrc" :alt="film.title" class="h-full w-full object-cover" />
        <span v-else class="flex h-full items-center justify-center p-2 text-center text-xs text-lb-text">
          {{ film.title }}
        </span>
      </div>
    </div>

    <p v-if="film.comment" class="whitespace-pre-line py-6 text-lg leading-relaxed text-lb-text">
      {{ film.comment }}
    </p>
    <p v-else class="py-6 text-base italic text-lb-muted">No comment.</p>

    <div class="flex flex-wrap items-center gap-2 border-t border-lb-line pt-4">
      <button
        type="button"
        class="lb-btn lb-btn-grey"
        title="Marks the film as rewatched and sets the watch date to today"
        @click="handleRewatch"
      >
        <RewatchIcon /> I rewatched it
      </button>
      <FavoriteButton
        :favorite="film.favorite"
        :disabled="favDisabled"
        :title="favDisabled ? `Already ${MAX_FAVORITES} favorites` : undefined"
        @toggle="handleToggleFavorite"
      />
    </div>
  </section>
</template>
