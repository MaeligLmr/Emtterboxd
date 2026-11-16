<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'

const emit = defineEmits<{ click: [] }>()

function handleClick() {
  emit('click')
}
</script>

<template>
  <!-- Icon only: the label is for screen readers -->
  <button
    type="button"
    class="-ml-2 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-lb-blue"
    aria-label="Back"
    @click="handleClick"
  >
    <FontAwesomeIcon :icon="faArrowLeft" size="lg" />
  </button>
</template>
