import { supabase } from '@/lib/supabase'
import { storageHandler } from '@/handlers/storageHandler'
import type { Profile } from '@/types/db/Profile'

const BUCKET = 'avatars'

export const profileHandler = {
  avatarUrl(path: string | null): Promise<string | null> {
    return storageHandler.signedUrl(BUCKET, path)
  },

  async usernameAvailable(username: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('username_available', { p_username: username })
    if (error) throw error
    return data === true
  },

  async get(): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').maybeSingle()
    if (error) throw error
    return data as Profile | null
  },

  /** Envoie la nouvelle photo, met à jour le profil, supprime l'ancienne. Renvoie le chemin. */
  async setAvatar(file: File, previous: string | null): Promise<string> {
    const { data: u, error: ue } = await supabase.auth.getUser()
    if (ue || !u.user) throw ue ?? new Error('Not signed in')

    const path = await storageHandler.upload(BUCKET, file, { maxWidth: 512 })
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: u.user.id, avatar_path: path, updated_at: new Date().toISOString() })
    if (error) {
      await storageHandler.remove(BUCKET, path)
      throw error
    }
    await storageHandler.remove(BUCKET, previous)
    return path
  },
}
