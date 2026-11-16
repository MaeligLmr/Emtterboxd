export interface FilmInput {
  title: string
  rating: number | null
  comment: string | null
  favorite: boolean
  /** Date de visionnage, YYYY-MM-DD */
  watched_at: string
}
