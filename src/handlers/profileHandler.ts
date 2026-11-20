import { supabase } from '@/lib/supabase'
import { storageHandler } from '@/handlers/storageHandler'
import type { Profile } from '@/types/db/Profile'
import type { PublicProfile } from '@/types/db/PublicProfile'

const BUCKET = 'avatars'

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw error ?? new Error('Not signed in')
  return data.user.id
}

export const profileHandler = {
  avatarUrl(path: string | null): Promise<string | null> {
    return storageHandler.signedUrl(BUCKET, path)
  },

  async usernameAvailable(username: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('username_available', { p_username: username })
    if (error) throw error
    return data === true
  },

  /** The signed-in user's own profile (RLS only lets them read their own row). */
  async get(): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').maybeSingle()
    if (error) throw error
    return data as Profile | null
  },

  /** Public profiles, listed for visitors (read through the public_profiles view). */
  async listPublic(): Promise<PublicProfile[]> {
    const { data, error } = await supabase
      .from('public_profiles')
      .select('*')
      .order('username', { ascending: true })
    if (error) throw error
    return data as PublicProfile[]
  },

  async getPublic(username: string): Promise<PublicProfile | null> {
    const { data, error } = await supabase
      .from('public_profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle()
    if (error) throw error
    return data as PublicProfile | null
  },

  async setPublic(isPublic: boolean): Promise<void> {
    const userId = await currentUserId()
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: userId, is_public: isPublic, updated_at: new Date().toISOString() })
    if (error) throw error
  },

  async setUsername(username: string): Promise<void> {
    const userId = await currentUserId()
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: userId, username, updated_at: new Date().toISOString() })
    // 23505 = unique violation (usernames are unique, ignoring case)
    if (error?.code === '23505') throw new Error('This username is already taken.')
    if (error) throw error
  },

  /** Uploads the new photo, updates the profile, removes the old one. Returns the path. */
  async setAvatar(file: File, previous: string | null): Promise<string> {
    const userId = await currentUserId()

    const path = await storageHandler.upload(BUCKET, file, { maxWidth: 512 })
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: userId, avatar_path: path, updated_at: new Date().toISOString() })
    if (error) {
      await storageHandler.remove(BUCKET, path)
      throw error
    }
    await storageHandler.remove(BUCKET, previous)
    return path
  },
}
