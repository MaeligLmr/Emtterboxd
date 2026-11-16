import { supabase } from '@/lib/supabase'
import { toWebp, WEBP_TYPE } from '@/lib/image/to-webp'

type WebpOptions = Parameters<typeof toWebp>[1]

const SIGNED_URL_TTL = 3600 // secondes
const cache = new Map<string, { url: string; expiresAt: number }>()

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw error ?? new Error('Not signed in')
  return data.user.id
}

export const storageHandler = {
  /** URL signée temporaire (les buckets sont privés). Mise en cache jusqu'à expiration. */
  async signedUrl(bucket: string, path: string | null): Promise<string | null> {
    if (!path) return null
    const key = `${bucket}/${path}`
    const hit = cache.get(key)
    if (hit && hit.expiresAt > Date.now()) return hit.url

    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL)
    if (error) throw error
    cache.set(key, { url: data.signedUrl, expiresAt: Date.now() + (SIGNED_URL_TTL - 60) * 1000 })
    return data.signedUrl
  },

  /**
   * Convertit l'image en WebP puis l'envoie dans <bucket>/<user_id>/<uuid>.webp.
   * Renvoie le chemin. Peut lever une ImageError (message affichable à l'utilisateur).
   */
  async upload(bucket: string, file: File, options?: WebpOptions): Promise<string> {
    const webp = await toWebp(file, options)
    const userId = await currentUserId()
    const path = `${userId}/${crypto.randomUUID()}.webp`
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, webp, { contentType: WEBP_TYPE, cacheControl: '31536000' })
    if (error) throw error
    return path
  },

  async remove(bucket: string, path: string | null): Promise<void> {
    if (!path) return
    cache.delete(`${bucket}/${path}`)
    await supabase.storage.from(bucket).remove([path])
  },
}
