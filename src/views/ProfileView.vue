<script setup lang="ts">
import { computed, ref } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { useSignedUrl } from '@/composables/useSignedUrl'
import { IMAGE_INPUT_TYPES } from '@/lib/image/to-webp'
import type { Film } from '@/types/db/Film'
import { MAX_FAVORITES } from '@/constants'
import { profileHandler } from '@/handlers/profileHandler'
import FilmCard from '@/components/FilmCard.vue'
import FavoritePicker from '@/components/FavoritePicker.vue'
import ImageCropper from '@/components/ImageCropper.vue'

const props = defineProps<{
  name: string
  fullName: string
  avatarPath: string | null
  favorites: Film[]
  candidates: Film[]
  recent: Film[]
  total: number
}>()
const emit = defineEmits<{
  open: [film: Film]
  'avatar-changed': [path: string]
  'add-favorite': [film: Film]
  'create-favorite': []
  'more-activity': []
}>()

const pickerOpen = ref(false)
function handleOpenPicker() {
  pickerOpen.value = true
}
function handleClosePicker() {
  pickerOpen.value = false
}
function handlePick(film: Film) {
  pickerOpen.value = false
  emit('add-favorite', film)
}
function handleCreate() {
  pickerOpen.value = false
  emit('create-favorite')
}
function handleMoreActivity() {
  emit('more-activity')
}

const uploading = ref(false)
const error = ref('')
const url = useSignedUrl(() => props.avatarPath, (p) => profileHandler.avatarUrl(p))
const emptySlots = computed(() => Math.max(0, MAX_FAVORITES - props.favorites.length))

const cropSource = ref<File | null>(null)

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  cropSource.value = input.files?.[0] ?? null
  input.value = '' // lets the same file be picked again
}
function handleCropCancel() {
  cropSource.value = null
}
function handleCropError(message: string) {
  error.value = message
}
async function handleCropped(cropped: File) {
  cropSource.value = null
  uploading.value = true
  error.value = ''
  try {
    emit('avatar-changed', await profileHandler.setAvatar(cropped, props.avatarPath))
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not change the photo'
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <section>
    <!-- Avatar + name, centered -->
    <div class="flex flex-col items-center pb-8 pt-2 text-center">
      <label
        class="group relative block h-28 w-28 shrink-0 cursor-pointer overflow-hidden rounded-full bg-lb-panel ring-2 ring-white/20 hover:ring-lb-blue"
        title="Change profile photo"
      >
        <img v-if="url" :src="url" alt="Profile photo" class="h-full w-full object-cover" />
        <span v-else class="flex h-full items-center justify-center text-4xl font-bold uppercase text-lb-text">
          {{ name.charAt(0) }}
        </span>
        <span
          class="absolute inset-0 flex items-center justify-center bg-black/60 text-[0.65rem] font-bold uppercase tracking-widest text-white opacity-0 transition group-hover:opacity-100"
        >
          {{ uploading ? '…' : 'Edit' }}
        </span>
        <input
          type="file"
          :accept="IMAGE_INPUT_TYPES.join(',')"
          class="sr-only"
          :disabled="uploading"
          @change="onFile"
        />
      </label>
      <h1 class="mt-4 text-2xl font-bold text-white">{{ name }}</h1>
      <p v-if="fullName" class="mt-0.5 text-sm text-lb-text">{{ fullName }}</p>
      <p class="mt-1 text-xs uppercase tracking-widest text-lb-muted">
        {{ total }} film{{ total > 1 ? 's' : '' }}
      </p>
      <p v-if="error" class="mt-3 text-sm text-red-400">{{ error }}</p>
    </div>

    <!-- Favorites: single row, scrollable sideways -->
    <div class="-mx-4 border-t border-lb-line px-4 py-6 sm:mx-0 sm:px-0">
      <h2 class="mb-4 text-sm uppercase tracking-[0.2em] text-lb-muted">
        Favorites
        <span class="ml-1">{{ favorites.length }}/{{ MAX_FAVORITES }}</span>
      </h2>
      <ul class="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <li
          v-for="film in favorites"
          :key="film.id"
          class="w-28 shrink-0 snap-start sm:w-[calc((100%-3rem)/5)]"
        >
          <FilmCard :film="film" @open="emit('open', $event)" />
        </li>
        <li
          v-for="n in emptySlots"
          :key="`empty-${n}`"
          class="w-28 shrink-0 snap-start sm:w-[calc((100%-3rem)/5)]"
        >
          <button
            type="button"
            class="flex aspect-[2/3] w-full cursor-pointer items-center justify-center rounded-[3px] border border-dashed border-lb-line text-2xl text-lb-line transition hover:border-lb-green hover:text-lb-green"
            aria-label="Add a favorite"
            @click="handleOpenPicker"
          >
            +
          </button>
        </li>
      </ul>
    </div>

    <!-- Recent activity: latest watched films, then a link to the full diary -->
    <div class="-mx-4 border-y border-lb-line px-4 py-6 sm:mx-0 sm:px-0">
      <h2 class="mb-4 text-sm uppercase tracking-[0.2em] text-lb-muted">Recent activity</h2>
      <p v-if="!recent.length" class="text-sm text-lb-muted">Nothing logged yet.</p>
      <ul v-else class="grid grid-cols-4 gap-3 sm:grid-cols-5">
        <li v-for="(film, i) in recent" :key="film.id" :class="i === 4 ? 'hidden sm:block' : ''">
          <FilmCard :film="film" @open="emit('open', $event)" />
        </li>
      </ul>
      <button
        type="button"
        class="mt-6 flex w-full cursor-pointer items-center justify-between text-xl text-lb-text transition hover:text-white"
        @click="handleMoreActivity"
      >
        More activity
        <FontAwesomeIcon :icon="faChevronRight" class="text-base text-lb-muted" />
      </button>
    </div>

    <FavoritePicker
      v-if="pickerOpen"
      :films="candidates"
      @close="handleClosePicker"
      @create="handleCreate"
      @pick="handlePick"
    />

    <ImageCropper
      v-if="cropSource"
      :file="cropSource"
      :aspect="1"
      :output-width="512"
      round
      title="Crop profile photo"
      @confirm="handleCropped"
      @cancel="handleCropCancel"
      @error="handleCropError"
    />
  </section>
</template>
