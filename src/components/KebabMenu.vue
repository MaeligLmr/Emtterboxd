<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function handleToggle() {
  open.value = !open.value
}
function handleClose() {
  open.value = false
}
function onPointerDown(e: PointerEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-lb-text transition hover:bg-white/10 hover:text-white"
      aria-haspopup="menu"
      :aria-expanded="open"
      aria-label="Plus d'actions"
      @click="handleToggle"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="5" r="1.9" />
        <circle cx="12" cy="12" r="1.9" />
        <circle cx="12" cy="19" r="1.9" />
      </svg>
    </button>
    <div
      v-if="open"
      role="menu"
      class="absolute right-0 z-20 mt-1 min-w-44 overflow-hidden rounded bg-lb-panel py-1 shadow-xl ring-1 ring-white/10"
      @click="handleClose"
    >
      <slot />
    </div>
  </div>
</template>
