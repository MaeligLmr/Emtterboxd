import { supabase } from '@/lib/supabase'
import { storageHandler } from '@/handlers/storageHandler'
import { todayIso } from '@/lib/date'
import type { Film } from '@/types/db/Film'
import type { FilmInput } from '@/types/ui/FilmInput'

const BUCKET = 'posters'

export const filmHandler = {
  posterUrl(path: string | null): Promise<string | null> {
    return storageHandler.signedUrl(BUCKET, path)
  },

  async list(): Promise<Film[]> {
    const { data, error } = await supabase
      .from('films')
      .select('*')
      .order('watched_at', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Film[]
  },

  async save(input: FilmInput, poster: File | null, existing: Film | null): Promise<Film> {
    const newPath = poster ? await storageHandler.upload(BUCKET, poster) : null

    const query = existing
      ? supabase
          .from('films')
          .update({ ...input, ...(newPath ? { poster_path: newPath } : {}) })
          .eq('id', existing.id)
      : supabase.from('films').insert({ ...input, poster_path: newPath })

    const { data, error } = await query.select().single()
    if (error) {
      await storageHandler.remove(BUCKET, newPath)
      throw error
    }
    if (existing && newPath) await storageHandler.remove(BUCKET, existing.poster_path)
    return data as Film
  },

  /**
   * "I rewatched it" toggle.
   * On: remembers the current watch date and moves it to today.
   * Off: puts the remembered watch date back.
   */
  async setRewatched(film: Film, rewatched: boolean): Promise<Film> {
    const patch = rewatched
      ? { rewatched: true, previous_watched_at: film.watched_at, watched_at: todayIso() }
      : {
          rewatched: false,
          watched_at: film.previous_watched_at ?? film.watched_at,
          previous_watched_at: null,
        }
    const { data, error } = await supabase
      .from('films')
      .update(patch)
      .eq('id', film.id)
      .select()
      .single()
    if (error) throw error
    return data as Film
  },

  async setFavorite(film: Film, favorite: boolean): Promise<Film> {
    const { data, error } = await supabase
      .from('films')
      .update({ favorite })
      .eq('id', film.id)
      .select()
      .single()
    if (error) throw error
    return data as Film
  },

  async remove(film: Film): Promise<void> {
    const { error } = await supabase.from('films').delete().eq('id', film.id)
    if (error) throw error
    await storageHandler.remove(BUCKET, film.poster_path)
  },
}
