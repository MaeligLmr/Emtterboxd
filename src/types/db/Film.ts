export interface Film {
  id: string
  user_id: string
  title: string
  poster_path: string | null
  rating: number | null
  comment: string | null
  rewatched: boolean
  favorite: boolean
  /** Date de visionnage, YYYY-MM-DD */
  watched_at: string
  created_at: string
}
