<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useSignedUrl } from '@/composables/useSignedUrl'
import { IMAGE_INPUT_TYPES } from '@/lib/image/to-webp'
import { todayIso } from '@/lib/date'
import type { Film } from '@/types/db/Film'
import { MAX_FAVORITES } from '@/constants'
import { filmHandler } from '@/handlers/filmHandler'
import BackButton from '@/components/BackButton.vue'
import ImageCropper from '@/components/ImageCropper.vue'
import StarRating from '@/components/StarRating.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'

const props = defineProps<{ film: Film | null; favoritesFull: boolean; defaultFavorite?: boolean }>()
const emit = defineEmits<{ cancel: []; saved: [film: Film] }>()

const today = todayIso()
const title = ref(props.film?.title ?? '')
const rating = ref<number | null>(props.film?.rating ?? null)
const comment = ref(props.film?.comment ?? '')
const watchedAt = ref(props.film?.watched_at ?? today)
const favorite = ref(props.film?.favorite ?? props.defaultFavorite ?? false)
const cropSource = ref<File | null>(null)
const file = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const loading = ref(false)
const error = ref('')

const currentPoster = useSignedUrl(() => props.film?.poster_path, (p) => filmHandler.posterUrl(p))
const shownPoster = computed(() => previewUrl.value ?? currentPoster.value)

// No new favorite once the 5 slots are taken (unless this film already holds one)
const favoriteBlocked = computed(() => props.favoritesFull && !props.film?.favorite && !favorite.value)

function handleToggleFavorite() {
  favorite.value = !favorite.value
}
function handleFile(e: Event) {
  const input = e.target as HTMLInputElement
  cropSource.value = input.files?.[0] ?? null
  input.value = '' // lets the same file be picked again
}
function handleCropped(cropped: File) {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  file.value = cropped
  previewUrl.value = URL.createObjectURL(cropped)
  cropSource.value = null
}
function handleCropCancel() {
  cropSource.value = null
}
function handleCropError(message: string) {
  error.value = message
}
onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

async function handleSubmit() {
  loading.value = true
  error.value = ''
  try {
    const saved = await filmHandler.save(
      {
        title: title.value.trim(),
        rating: rating.value,
        comment: comment.value.trim() || null,
        favorite: favorite.value,
        watched_at: watchedAt.value || today,
      },
      file.value,
      props.film,
    )
    emit('saved', saved)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not save the film'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <div class="-mt-2 mb-4 flex items-center gap-1">
      <BackButton @click="emit('cancel')" />
      <h1 class="text-xl font-bold text-white">{{ film ? 'Edit film' : 'Add a film' }}</h1>
    </div>
    <form class="rounded bg-[#1b2128] p-6 ring-1 ring-white/10" @submit.prevent="handleSubmit">
      <div class="flex flex-col gap-6 sm:flex-row">
        <label
          class="relative block aspect-[2/3] w-40 shrink-0 cursor-pointer self-center overflow-hidden rounded-[3px] bg-lb-panel ring-1 ring-white/20 hover:ring-lb-blue sm:self-start"
        >
          <img v-if="shownPoster" :src="shownPoster" alt="Poster" class="h-full w-full object-cover" />
          <span v-else class="flex h-full items-center justify-center p-3 text-center text-xs text-lb-muted">
            Click to add a poster
          </span>
          <input type="file" :accept="IMAGE_INPUT_TYPES.join(',')" class="sr-only" @change="handleFile" />
        </label>
        <div class="flex-1 space-y-4">
          <div>
            <label class="lb-label" for="title">Title</label>
            <input id="title" v-model="title" required maxlength="200" class="lb-input" />
          </div>
          <div>
            <label class="lb-label" for="watched-at">Watch date</label>
            <input
              id="watched-at"
              v-model="watchedAt"
              type="date"
              required
              :max="today"
              class="lb-input scheme-dark"
            />
          </div>
          <div class="flex items-end justify-between gap-3">
            <div>
              <span class="lb-label">Rating</span>
              <StarRating v-model="rating" />
            </div>
            <FavoriteButton
              :favorite="favorite"
              :disabled="favoriteBlocked"
              :title="favoriteBlocked ? `Already ${MAX_FAVORITES} favorites` : undefined"
              @toggle="handleToggleFavorite"
            />
          </div>
          <div>
            <label class="lb-label" for="comment">Comment</label>
            <textarea id="comment" v-model="comment" rows="4" class="lb-input resize-y" />
          </div>
        </div>
      </div>
      <p v-if="error" class="mt-4 text-sm text-red-400">{{ error }}</p>
      <div class="mt-6 flex justify-end gap-2">
        <button type="button" class="lb-btn lb-btn-danger" @click="emit('cancel')">Cancel</button>
        <button type="submit" class="lb-btn lb-btn-green" :disabled="loading || !title.trim()">
          {{ loading ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </form>

    <ImageCropper
      v-if="cropSource"
      :file="cropSource"
      :aspect="2 / 3"
      :output-width="800"
      title="Crop poster"
      @confirm="handleCropped"
      @cancel="handleCropCancel"
      @error="handleCropError"
    />
  </section>
</template>
