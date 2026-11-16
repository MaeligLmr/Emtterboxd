<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{ modelValue: number | null; readonly?: boolean; size?: string }>(),
  { readonly: false, size: '1.9rem' },
)
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

const hover = ref<number | null>(null)
const shown = computed(() => hover.value ?? props.modelValue ?? 0)

function fill(n: number): number {
  return Math.max(0, Math.min(1, shown.value - (n - 1))) * 100
}

function pick(value: number) {
  emit('update:modelValue', props.modelValue === value ? null : value)
}
</script>

<template>
  <div
    v-if="!readonly"
    class="inline-flex items-center gap-0.5"
    @mouseleave="hover = null"
  >
    <span
      v-for="n in 5"
      :key="n"
      class="relative select-none leading-none"
      :style="{
        fontSize: size,
        backgroundImage: `linear-gradient(90deg, #00e054 ${fill(n)}%, #2c3440 ${fill(n)}%)`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }"
    >
      ★
      <button
        type="button"
        class="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
        :aria-label="`${n - 0.5} stars`"
        @mouseenter="hover = n - 0.5"
        @click="pick(n - 0.5)"
      />
      <button
        type="button"
        class="absolute inset-y-0 right-0 w-1/2 cursor-pointer"
        :aria-label="`${n} stars`"
        @mouseenter="hover = n"
        @click="pick(n)"
      />
    </span>
  </div>
  <span
    v-else-if="modelValue"
    class="text-lb-green tracking-tight"
    :style="{ fontSize: size }"
    :title="`${modelValue} / 5`"
  >
    {{ '★'.repeat(Math.floor(modelValue)) }}{{ modelValue % 1 ? '½' : '' }}
  </span>
</template>
