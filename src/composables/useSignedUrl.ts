import { ref, watch } from 'vue'

/** Résout un chemin de storage en URL signée, et se met à jour quand le chemin change. */
export function useSignedUrl(
  path: () => string | null | undefined,
  resolve: (path: string) => Promise<string | null>,
) {
  const url = ref<string | null>(null)

  watch(
    path,
    async (p) => {
      if (!p) {
        url.value = null
        return
      }
      try {
        const resolved = await resolve(p)
        if (path() === p) url.value = resolved // ignore les réponses périmées
      } catch {
        if (path() === p) url.value = null
      }
    },
    { immediate: true },
  )

  return url
}
