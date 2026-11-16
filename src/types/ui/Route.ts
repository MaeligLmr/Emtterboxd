import type { Tab } from './Tab'

export type Route =
  | { name: 'tab'; tab: Tab }
  | { name: 'film-new'; favorite: boolean }
  | { name: 'film'; id: string }
  | { name: 'film-edit'; id: string }
