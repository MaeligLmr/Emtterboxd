<script setup lang="ts">
import RewatchIcon from './RewatchIcon.vue'
import ToggleSwitch from './ToggleSwitch.vue'

defineProps<{ rewatched: boolean }>()
const emit = defineEmits<{ toggle: [] }>()

function handleChange() {
  emit('toggle')
}
</script>

<template>
  <!-- On: marks the film as rewatched and moves the watch date to today. Off: restores the previous date. -->
  <ToggleSwitch
    :model-value="rewatched"
    title="Turning this on sets the watch date to today"
    @update:model-value="handleChange"
  >
    <span class="inline-flex items-center gap-2"><RewatchIcon /> I rewatched it</span>
  </ToggleSwitch>
</template>
