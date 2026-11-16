<script setup lang="ts">
import type { Tab } from '@/types/ui/Tab'
import AppLogo from './AppLogo.vue'

defineProps<{ tabs: { id: Tab; label: string }[]; current: Tab }>()
const emit = defineEmits<{ select: [tab: Tab]; add: []; 'sign-out': [] }>()
</script>

<template>
  <!-- Mobile : logo + actions sur la 1re ligne, onglets sur la 2e. À partir de sm : tout sur une ligne. -->
  <header class="border-b border-white/5 bg-lb-bg">
    <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 px-4 pt-3 sm:py-4">
      <AppLogo class="order-1" />

      <div class="order-2 flex items-center gap-1 sm:order-3 sm:gap-3">
        <!-- Mobile : bouton flottant en bas à droite. À partir de sm : bouton classique dans l'en-tête. -->
        <button
          type="button"
          class="fixed bottom-5 right-5 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-lb-green text-white shadow-lg shadow-black/50 transition hover:bg-[#2cf070] sm:static sm:h-auto sm:w-auto sm:rounded-[3px] sm:px-4 sm:py-2 sm:text-xs sm:font-bold sm:uppercase sm:tracking-widest sm:shadow-none"
          aria-label="Add a film"
          @click="emit('add')"
        >
          <span class="text-3xl leading-none sm:hidden" aria-hidden="true">+</span>
          <span class="hidden sm:inline">+ Add</span>
        </button>
        <button
          type="button"
          class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-lb-muted transition hover:bg-white/10 hover:text-white"
          aria-label="Sign out"
          title="Sign out"
          @click="emit('sign-out')"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
      </div>

      <nav class="order-3 -mx-4 flex w-[calc(100%+2rem)] overflow-x-auto sm:order-2 sm:mx-0 sm:w-auto sm:gap-6">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          class="flex-1 shrink-0 cursor-pointer whitespace-nowrap border-b-2 px-3 py-3 text-center text-xs font-bold uppercase tracking-widest transition sm:flex-none sm:px-0 sm:py-1"
          :class="
            current === t.id
              ? 'border-lb-green text-white'
              : 'border-transparent text-lb-muted hover:text-white'
          "
          @click="emit('select', t.id)"
        >
          {{ t.label }}
        </button>
      </nav>
    </div>
  </header>
</template>
