<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

const props = withDefaults(
  defineProps<{
    file: File
    /** Ratio largeur / hauteur du cadre (ex. 2/3 pour une affiche, 1 pour un avatar). */
    aspect: number
    /** Largeur en pixels de l'image recadrée. */
    outputWidth: number
    round?: boolean
    title?: string
  }>(),
  { round: false, title: 'Crop image' },
)
const emit = defineEmits<{ cancel: []; confirm: [file: File]; error: [message: string] }>()

const FRAME_W = 280
const MAX_ZOOM = 4

const frameH = computed(() => Math.round(FRAME_W / props.aspect))
const bitmap = shallowRef<ImageBitmap | null>(null)
const src = URL.createObjectURL(props.file)
const zoom = ref(1)
// Position du coin haut-gauche de l'image dans le cadre (px)
const x = ref(0)
const y = ref(0)
const busy = ref(false)

const baseScale = computed(() =>
  bitmap.value ? Math.max(FRAME_W / bitmap.value.width, frameH.value / bitmap.value.height) : 1,
)
const scale = computed(() => baseScale.value * zoom.value)
const dispW = computed(() => (bitmap.value ? bitmap.value.width * scale.value : 0))
const dispH = computed(() => (bitmap.value ? bitmap.value.height * scale.value : 0))

// L'image doit toujours couvrir entièrement le cadre
function clamp() {
  x.value = Math.min(0, Math.max(FRAME_W - dispW.value, x.value))
  y.value = Math.min(0, Math.max(frameH.value - dispH.value, y.value))
}

function setZoom(next: number) {
  const z = Math.min(MAX_ZOOM, Math.max(1, next))
  // On garde fixe le point de l'image situé au centre du cadre
  const cx = (FRAME_W / 2 - x.value) / scale.value
  const cy = (frameH.value / 2 - y.value) / scale.value
  zoom.value = z
  x.value = FRAME_W / 2 - cx * scale.value
  y.value = frameH.value / 2 - cy * scale.value
  clamp()
}

onMounted(async () => {
  try {
    // L'orientation EXIF est appliquée au décodage
    bitmap.value = await createImageBitmap(props.file)
  } catch {
    emit('error', 'Could not read this image: the file may be corrupted.')
    emit('cancel')
    return
  }
  x.value = (FRAME_W - dispW.value) / 2
  y.value = (frameH.value - dispH.value) / 2
})

// Capture : Échap ferme uniquement le recadrage, pas le formulaire qui est dessous
function onKey(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  e.stopImmediatePropagation()
  emit('cancel')
}
onMounted(() => window.addEventListener('keydown', onKey, true))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey, true)
  URL.revokeObjectURL(src)
  bitmap.value?.close()
})

// --- Déplacement à la souris / au doigt ---
let dragging = false
let lastX = 0
let lastY = 0

function handlePointerDown(e: PointerEvent) {
  dragging = true
  lastX = e.clientX
  lastY = e.clientY
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function handlePointerMove(e: PointerEvent) {
  if (!dragging) return
  x.value += e.clientX - lastX
  y.value += e.clientY - lastY
  lastX = e.clientX
  lastY = e.clientY
  clamp()
}
function handlePointerUp() {
  dragging = false
}
function handleWheel(e: WheelEvent) {
  setZoom(zoom.value * (e.deltaY < 0 ? 1.08 : 1 / 1.08))
}
function handleSlider(e: Event) {
  setZoom(Number((e.target as HTMLInputElement).value))
}

async function handleConfirm() {
  const bmp = bitmap.value
  if (!bmp || busy.value) return
  busy.value = true
  try {
    const w = props.outputWidth
    const h = Math.round(w / props.aspect)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas indisponible')
    ctx.drawImage(
      bmp,
      -x.value / scale.value,
      -y.value / scale.value,
      FRAME_W / scale.value,
      frameH.value / scale.value,
      0,
      0,
      w,
      h,
    )
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.92))
    if (!blob) throw new Error('encodage impossible')
    emit('confirm', new File([blob], 'image.webp', { type: blob.type }))
  } catch {
    emit('error', 'Could not crop this image.')
    emit('cancel')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/85 p-4"
    @mousedown.self="emit('cancel')"
  >
    <div
      class="w-full max-w-sm rounded bg-[#1b2128] p-6 shadow-2xl ring-1 ring-white/10"
      role="dialog"
      aria-modal="true"
    >
      <h2 class="mb-4 text-xs font-bold uppercase tracking-widest text-lb-muted">{{ title }}</h2>

      <div
        class="relative mx-auto touch-none select-none overflow-hidden bg-black ring-2 ring-lb-green"
        :class="round ? 'rounded-full' : 'rounded-[3px]'"
        :style="{ width: `${FRAME_W}px`, height: `${frameH}px`, cursor: 'grab' }"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointercancel="handlePointerUp"
        @wheel.prevent="handleWheel"
      >
        <img
          v-if="bitmap"
          :src="src"
          alt=""
          draggable="false"
          class="pointer-events-none absolute left-0 top-0 max-w-none"
          :style="{
            width: `${dispW}px`,
            height: `${dispH}px`,
            transform: `translate(${x}px, ${y}px)`,
          }"
        />
        <span v-else class="flex h-full items-center justify-center text-xs text-lb-muted">Loading…</span>
      </div>

      <div class="mt-5 flex items-center gap-3 text-lb-muted">
        <span class="text-xs">−</span>
        <input
          type="range"
          min="1"
          :max="MAX_ZOOM"
          step="0.01"
          :value="zoom"
          class="h-1 flex-1 cursor-pointer accent-lb-green"
          aria-label="Zoom"
          @input="handleSlider"
        />
        <span class="text-xs">+</span>
      </div>
      <p class="mt-2 text-center text-xs text-lb-muted">Drag to move, use the wheel or slider to zoom.</p>

      <div class="mt-6 flex justify-end gap-2">
        <button type="button" class="lb-btn lb-btn-danger" @click="emit('cancel')">Cancel</button>
        <button type="button" class="lb-btn lb-btn-green" :disabled="!bitmap || busy" @click="handleConfirm">
          Done
        </button>
      </div>
    </div>
  </div>
</template>
