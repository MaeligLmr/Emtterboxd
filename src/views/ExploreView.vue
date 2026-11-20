<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from '@/composables/useRoute'
import { profileHandler } from '@/handlers/profileHandler'
import type { PublicProfile } from '@/types/db/PublicProfile'
import ProfileCard from '@/components/ProfileCard.vue'

const { goUser } = useRoute()

const profiles = ref<PublicProfile[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    profiles.value = await profileHandler.listPublic()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not load public profiles'
  } finally {
    loading.value = false
  }
})

function handleOpen(profile: PublicProfile) {
  goUser(profile.username)
}
</script>

<template>
  <section>
    <h1 class="mb-4 border-b border-lb-line pb-1.5 text-sm uppercase tracking-[0.2em] text-lb-muted">
      Public profiles
    </h1>
    <p v-if="loading" class="py-16 text-center text-sm text-lb-muted">Loading…</p>
    <p v-else-if="error" class="text-sm text-red-400">{{ error }}</p>
    <p v-else-if="!profiles.length" class="py-16 text-center text-lb-muted">No public profiles yet.</p>
    <ul v-else class="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5">
      <li v-for="profile in profiles" :key="profile.user_id">
        <ProfileCard :profile="profile" @open="handleOpen" />
      </li>
    </ul>
  </section>
</template>
