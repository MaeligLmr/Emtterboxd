<script setup lang="ts">
defineProps<{ favorite: boolean; disabled?: boolean; title?: string }>()
const emit = defineEmits<{ toggle: [] }>()

function handleClick() {
  emit('toggle')
}
</script>

<template>
  <!-- Empty star when not a favorite, filled star when it is -->
  <button
    type="button"
    class="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-lb-blue disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    :class="favorite ? 'text-lb-orange' : 'text-lb-muted hover:text-white'"
    :aria-pressed="favorite"
    :aria-label="favorite ? 'Remove from favorites' : 'Add to favorites'"
    :title="title ?? (favorite ? 'Remove from favorites' : 'Add to favorites')"
    :disabled="disabled"
    @click="handleClick"
  >
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class="transition"
      :fill="favorite ? 'currentColor' : 'none'"
    >
      <path d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95L12 2.5z" />
    </svg>
  </button>
</template>
