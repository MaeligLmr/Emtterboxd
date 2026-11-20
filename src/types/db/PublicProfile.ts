/** A row of the public_profiles view: only what a visitor is allowed to see. */
export interface PublicProfile {
  user_id: string
  username: string
  avatar_path: string | null
}
