import type { Tab } from './Tab'

export type Route =
  | { name: 'tab'; tab: Tab }
  | { name: 'login' }
  | { name: 'film-new'; favorite: boolean }
  | { name: 'film'; id: string }
  | { name: 'film-edit'; id: string }
  // Public, read-only pages (no sign-in needed)
  | { name: 'user'; username: string; section: 'profile' | 'diary' }
  | { name: 'user-film'; username: string; id: string }
