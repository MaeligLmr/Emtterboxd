<script setup lang="ts">
defineProps<{ disabled?: boolean; title?: string }>()
const model = defineModel<boolean>({ required: true })

function handleToggle() {
  model.value = !model.value
}
</script>

<template>
  <div class="flex items-center gap-3" :title="title">
    <button
      type="button"
      role="switch"
      :aria-checked="model"
      :disabled="disabled"
      class="relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lb-blue disabled:cursor-not-allowed disabled:opacity-50"
      :class="model ? 'bg-lb-green' : 'bg-lb-panel'"
      @click="handleToggle"
    >
      <span
        class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
        :class="model ? 'translate-x-5' : 'translate-x-0'"
      />
    </button>
    <span class="text-sm" :class="disabled ? 'text-lb-muted' : 'text-lb-text'">
      <slot />
    </span>
  </div>
</template>
