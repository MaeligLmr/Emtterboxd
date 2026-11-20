<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { useRoute } from '@/composables/useRoute'
import { useSignedUrl } from '@/composables/useSignedUrl'
import { filmHandler } from '@/handlers/filmHandler'
import { profileHandler } from '@/handlers/profileHandler'
import type { Film } from '@/types/db/Film'
import type { PublicProfile } from '@/types/db/PublicProfile'
import BackButton from '@/components/BackButton.vue'
import FilmCard from '@/components/FilmCard.vue'
import FilmView from '@/views/FilmView.vue'
import SiteView from '@/views/SiteView.vue'

// Read-only pages of a public profile: profile, diary and a single film
const props = defineProps<{ username: string; section: 'profile' | 'diary' | 'film'; filmId?: string }>()

const { goTab, goUser, goUserDiary, goUserFilm } = useRoute()

const profile = ref<PublicProfile | null>(null)
const films = ref<Film[]>([])
const loading = ref(true)
const error = ref('')

watch(
  () => props.username,
  async (name) => {
    loading.value = true
    error.value = ''
    profile.value = null
    films.value = []
    try {
      const found = await profileHandler.getPublic(name)
      profile.value = found
      if (found) films.value = await filmHandler.listPublic(found.user_id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Could not load this profile'
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

const avatar = useSignedUrl(() => profile.value?.avatar_path, (p) => profileHandler.avatarUrl(p))
const favorites = computed(() => films.value.filter((f) => f.favorite))
const recent = computed(() => films.value.slice(0, 5))
const film = computed(() => films.value.find((f) => f.id === props.filmId))

function handleOpenFilm(f: Film) {
  goUserFilm(props.username, f.id)
}
function handleBackToExplore() {
  goTab('explore')
}
function handleBackToProfile() {
  goUser(props.username)
}
function handleMoreActivity() {
  goUserDiary(props.username)
}
</script>

<template>
  <p v-if="loading" class="py-16 text-center text-sm text-lb-muted">Loading…</p>
  <p v-else-if="error" class="text-sm text-red-400">{{ error }}</p>

  <div v-else-if="!profile" class="py-20 text-center text-lb-muted">
    <p class="mb-4">This profile doesn't exist or is private.</p>
    <BackButton class="mx-auto" @click="handleBackToExplore" />
  </div>

  <!-- A single film, read-only -->
  <template v-else-if="section === 'film'">
    <FilmView
      v-if="film"
      readonly
      :film="film"
      :favorites-full="false"
      :username="profile.username"
      :avatar-path="profile.avatar_path"
      @back="handleBackToProfile"
    />
    <div v-else class="py-20 text-center text-lb-muted">
      <p class="mb-4">Film not found.</p>
      <BackButton class="mx-auto" @click="handleBackToProfile" />
    </div>
  </template>

  <!-- Diary, read-only -->
  <section v-else-if="section === 'diary'">
    <div class="-mt-2 mb-4 flex items-center gap-1">
      <BackButton @click="handleBackToProfile" />
      <h1 class="text-xl font-bold text-white">{{ profile.username }} · Diary</h1>
    </div>
    <SiteView readonly :films="films" @open="handleOpenFilm" />
  </section>

  <!-- Profile, read-only -->
  <section v-else>
    <div class="-mt-2 mb-2 flex items-center gap-1">
      <BackButton @click="handleBackToExplore" />
    </div>

    <div class="flex flex-col items-center pb-8 text-center">
      <span
        class="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-lb-panel text-4xl font-bold uppercase text-lb-text ring-2 ring-white/20"
      >
        <img v-if="avatar" :src="avatar" alt="Profile photo" class="h-full w-full object-cover" />
        <template v-else>{{ profile.username.charAt(0) }}</template>
      </span>
      <h1 class="mt-4 text-2xl font-bold text-white">{{ profile.username }}</h1>
      <p class="mt-1 text-xs uppercase tracking-widest text-lb-muted">
        {{ films.length }} film{{ films.length === 1 ? '' : 's' }}
      </p>
    </div>

    <div class="-mx-4 border-t border-lb-line px-4 py-6 sm:mx-0 sm:px-0">
      <h2 class="mb-4 text-sm uppercase tracking-[0.2em] text-lb-muted">Favorites</h2>
      <p v-if="!favorites.length" class="text-sm text-lb-muted">No favorites yet.</p>
      <ul v-else class="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <li
          v-for="f in favorites"
          :key="f.id"
          class="w-28 shrink-0 snap-start sm:w-[calc((100%-3rem)/5)]"
        >
          <FilmCard :film="f" @open="handleOpenFilm" />
        </li>
      </ul>
    </div>

    <div class="-mx-4 border-y border-lb-line px-4 py-6 sm:mx-0 sm:px-0">
      <h2 class="mb-4 text-sm uppercase tracking-[0.2em] text-lb-muted">Recent activity</h2>
      <p v-if="!recent.length" class="text-sm text-lb-muted">Nothing logged yet.</p>
      <template v-else>
        <ul class="grid grid-cols-4 gap-3 sm:grid-cols-5">
          <li v-for="(f, i) in recent" :key="f.id" :class="i === 4 ? 'hidden sm:block' : ''">
            <FilmCard :film="f" @open="handleOpenFilm" />
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
      </template>
    </div>
  </section>
</template>
