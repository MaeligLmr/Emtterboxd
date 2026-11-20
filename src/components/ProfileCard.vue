<script setup lang="ts">
import { useSignedUrl } from '@/composables/useSignedUrl'
import type { PublicProfile } from '@/types/db/PublicProfile'
import { profileHandler } from '@/handlers/profileHandler'

const props = defineProps<{ profile: PublicProfile }>()
const emit = defineEmits<{ open: [profile: PublicProfile] }>()

const avatar = useSignedUrl(() => props.profile.avatar_path, (p) => profileHandler.avatarUrl(p))

function handleOpen() {
  emit('open', props.profile)
}
</script>

<template>
  <button
    type="button"
    class="group flex w-full cursor-pointer flex-col items-center gap-3 rounded p-3 text-center transition hover:bg-white/5"
    @click="handleOpen"
  >
    <span
      class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-lb-panel text-2xl font-bold uppercase text-lb-text ring-2 ring-white/20 transition group-hover:ring-lb-blue"
    >
      <img v-if="avatar" :src="avatar" alt="" class="h-full w-full object-cover" />
      <template v-else>{{ profile.username.charAt(0) }}</template>
    </span>
    <span class="w-full truncate text-sm font-bold text-white">{{ profile.username }}</span>
  </button>
</template>
