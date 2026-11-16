<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRoute } from '@/composables/useRoute'
import { filmHandler } from '@/handlers/filmHandler'
import { profileHandler } from '@/handlers/profileHandler'
import { MAX_FAVORITES } from '@/constants'
import type { Film } from '@/types/db/Film'
import type { Tab } from '@/types/ui/Tab'
import AppHeader from '@/components/AppHeader.vue'
import BackButton from '@/components/BackButton.vue'
import AuthView from '@/views/AuthView.vue'
import FilmFormView from '@/views/FilmFormView.vue'
import FilmView from '@/views/FilmView.vue'
import ListView from '@/views/ListView.vue'
import ProfileView from '@/views/ProfileView.vue'
import SiteView from '@/views/SiteView.vue'
import WatchlistView from '@/views/WatchlistView.vue'

const { session, ready, signOut } = useAuth()
const { route, lastTab, goTab, goNewFilm, goFilm, goEditFilm } = useRoute()

const tabs: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'site', label: 'On Site' },
  { id: 'list', label: 'List' },
  { id: 'watchlist', label: 'Watchlist' },
]
const films = ref<Film[]>([])
const avatarPath = ref<string | null>(null)
const username = ref<string | null>(null)
const fullName = ref('')
const loading = ref(false)
const error = ref('')

const userId = computed(() => session.value?.user.id ?? null)
const displayName = computed(
  () => username.value ?? session.value?.user.email?.split('@')[0] ?? 'Me',
)
const favorites = computed(() => films.value.filter((f) => f.favorite).reverse())
const favoritesFull = computed(() => favorites.value.length >= MAX_FAVORITES)
const nonFavorites = computed(() => films.value.filter((f) => !f.favorite))
// Most recently watched films, shown on the profile
const recentFilms = computed(() =>
  [...films.value]
    .sort((a, b) => b.watched_at.localeCompare(a.watched_at) || b.created_at.localeCompare(a.created_at))
    .slice(0, 5),
)

// Film targeted by the /film/<id> and /film/<id>/edit routes
const currentFilm = computed(() => {
  const r = route.value
  if (r.name !== 'film' && r.name !== 'film-edit') return undefined
  return films.value.find((f) => f.id === r.id)
})

watch(
  userId,
  async (id) => {
    if (!id) {
      films.value = []
      avatarPath.value = null
      username.value = null
      fullName.value = ''
      return
    }
    loading.value = true
    error.value = ''
    try {
      const [list, loaded] = await Promise.all([filmHandler.list(), profileHandler.get()])
      films.value = list
      avatarPath.value = loaded?.avatar_path ?? null
      username.value = loaded?.username ?? null
      fullName.value = [loaded?.first_name, loaded?.last_name].filter(Boolean).join(' ')
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Could not load your data'
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

function replaceFilm(film: Film) {
  const i = films.value.findIndex((f) => f.id === film.id)
  if (i >= 0) films.value[i] = film
  else films.value.unshift(film)
}

function handleSelectTab(next: Tab) {
  goTab(next)
}
function handleMoreActivity() {
  goTab('site')
}
function handleCreateFavorite() {
  goNewFilm({ favorite: true })
}
async function handleAddFavorite(film: Film) {
  await handleToggleFavorite(film)
}
function handleAdd() {
  goNewFilm()
}
function handleOpen(film: Film) {
  goFilm(film.id)
}
function handleEdit(film: Film) {
  goEditFilm(film.id)
}
function handleBack() {
  goTab(lastTab.value)
}
function handleFormCancel() {
  const r = route.value
  if (r.name === 'film-edit') goFilm(r.id)
  else goTab(lastTab.value)
}
function handleSaved(film: Film) {
  replaceFilm(film)
  goFilm(film.id)
}
function handleAvatarChanged(path: string) {
  avatarPath.value = path
}
async function handleToggleFavorite(film: Film) {
  error.value = ''
  try {
    replaceFilm(await filmHandler.setFavorite(film, !film.favorite))
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not update favorites'
  }
}
async function handleMarkRewatched(film: Film) {
  error.value = ''
  try {
    replaceFilm(await filmHandler.markRewatched(film))
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not update the film'
  }
}
async function handleDelete(film: Film) {
  if (!confirm(`Delete “${film.title}”?`)) return
  try {
    await filmHandler.remove(film)
    films.value = films.value.filter((f) => f.id !== film.id)
    goTab(lastTab.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not delete the film'
  }
}
async function handleSignOut() {
  await signOut()
}
</script>

<template>
  <template v-if="ready">
    <AuthView v-if="!session" />
    <template v-else>
      <AppHeader
        :tabs="tabs"
        :current="lastTab"
        @select="handleSelectTab"
        @add="handleAdd"
        @sign-out="handleSignOut"
      />

      <main class="mx-auto max-w-5xl px-4 pb-28 pt-8 sm:pb-16">
        <p v-if="error" class="mb-4 text-sm text-red-400">{{ error }}</p>
        <p v-if="loading" class="py-16 text-center text-sm text-lb-muted">Loading…</p>

        <template v-else-if="route.name === 'tab'">
          <ProfileView
            v-if="lastTab === 'profile'"
            :name="displayName"
            :full-name="fullName"
            :avatar-path="avatarPath"
            :favorites="favorites"
            :candidates="nonFavorites"
            :recent="recentFilms"
            :total="films.length"
            @open="handleOpen"
            @avatar-changed="handleAvatarChanged"
            @add-favorite="handleAddFavorite"
            @create-favorite="handleCreateFavorite"
            @more-activity="handleMoreActivity"
          />
          <SiteView
            v-else-if="lastTab === 'site'"
            :films="films"
            @open="handleOpen"
            @add="handleAdd"
          />
          <ListView v-else-if="lastTab === 'list'" />
          <WatchlistView v-else />
        </template>

        <FilmFormView
          v-else-if="route.name === 'film-new'"
          :film="null"
          :default-favorite="route.favorite"
          :favorites-full="favoritesFull"
          @cancel="handleFormCancel"
          @saved="handleSaved"
        />

        <template v-else-if="currentFilm">
          <FilmFormView
            v-if="route.name === 'film-edit'"
            :key="currentFilm.id"
            :film="currentFilm"
            :favorites-full="favoritesFull"
            @cancel="handleFormCancel"
            @saved="handleSaved"
          />
          <FilmView
            v-else
            :film="currentFilm"
            :favorites-full="favoritesFull"
            :username="displayName"
            :avatar-path="avatarPath"
            @back="handleBack"
            @edit="handleEdit"
            @delete="handleDelete"
            @rewatch="handleMarkRewatched"
            @toggle-favorite="handleToggleFavorite"
          />
        </template>

        <div v-else class="py-20 text-center text-lb-muted">
          <p class="mb-4">Film not found.</p>
          <BackButton class="mx-auto" @click="handleBack" />
        </div>
      </main>
    </template>
  </template>
</template>
