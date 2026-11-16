<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  id: string
  autocomplete?: string
  minlength?: number
}>()
const emit = defineEmits<{ blur: [] }>()
const model = defineModel<string>({ required: true })

const visible = ref(false)

function handleToggle() {
  visible.value = !visible.value
}
</script>

<template>
  <div class="relative">
    <input
      :id="id"
      v-model="model"
      :type="visible ? 'text' : 'password'"
      required
      :minlength="minlength"
      :autocomplete="autocomplete"
      class="lb-input pr-10"
      @blur="emit('blur')"
    />
    <button
      type="button"
      class="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center text-lb-muted hover:text-white"
      :aria-label="visible ? 'Hide password' : 'Show password'"
      :aria-pressed="visible"
      @click="handleToggle"
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <template v-if="visible">
          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
          <path d="M1 1l22 22" />
        </template>
        <template v-else>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </template>
      </svg>
    </button>
  </div>
</template>
