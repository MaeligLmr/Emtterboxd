import { ref } from 'vue'
import type { Route } from '@/types/ui/Route'
import type { Tab } from '@/types/ui/Tab'

// Hash routing (works on GitHub Pages without any server setup):
//   #/profil  #/on-site  #/explore  #/login
//   #/film/new  #/film/<id>  #/film/<id>/edit
//   #/u/<username>  #/u/<username>/diary  #/u/<username>/film/<id>     (public, read-only)
const TAB_SLUGS: Record<Tab, string> = {
  profile: 'profil',
  site: 'on-site',
  explore: 'explore',
}
const DEFAULT_TAB: Tab = 'profile'

function parseHash(): Route {
  const [path = '', query = ''] = window.location.hash.replace(/^#\/?/, '').split('?')
  const parts = path.split('/').filter(Boolean)

  if (parts[0] === 'login') return { name: 'login' }

  if (parts[0] === 'u' && parts[1]) {
    const username = decodeURIComponent(parts[1])
    if (parts[2] === 'film' && parts[3]) {
      return { name: 'user-film', username, id: decodeURIComponent(parts[3]) }
    }
    return { name: 'user', username, section: parts[2] === 'diary' ? 'diary' : 'profile' }
  }

  if (parts[0] === 'film' && parts[1]) {
    if (parts[1] === 'new') {
      return { name: 'film-new', favorite: new URLSearchParams(query).get('favorite') === '1' }
    }
    const id = decodeURIComponent(parts[1])
    return parts[2] === 'edit' ? { name: 'film-edit', id } : { name: 'film', id }
  }
  const tab = (Object.keys(TAB_SLUGS) as Tab[]).find((t) => TAB_SLUGS[t] === parts[0])
  return { name: 'tab', tab: tab ?? DEFAULT_TAB }
}

const route = ref<Route>(parseHash())
// Last visited tab: used as the "back" target from a film page
const lastTab = ref<Tab>(route.value.name === 'tab' ? route.value.tab : 'site')

// Also covers the browser's back / forward buttons
window.addEventListener('hashchange', () => {
  route.value = parseHash()
  if (route.value.name === 'tab') lastTab.value = route.value.tab
  window.scrollTo(0, 0)
})

function navigate(path: string) {
  window.location.hash = path
}

const user = (username: string) => `/u/${encodeURIComponent(username)}`

export function useRoute() {
  return {
    route,
    lastTab,
    goTab: (tab: Tab) => navigate(`/${TAB_SLUGS[tab]}`),
    goLogin: () => navigate('/login'),
    goNewFilm: (opts?: { favorite?: boolean }) =>
      navigate(opts?.favorite ? '/film/new?favorite=1' : '/film/new'),
    goFilm: (id: string) => navigate(`/film/${encodeURIComponent(id)}`),
    goEditFilm: (id: string) => navigate(`/film/${encodeURIComponent(id)}/edit`),
    goUser: (username: string) => navigate(user(username)),
    goUserDiary: (username: string) => navigate(`${user(username)}/diary`),
    goUserFilm: (username: string, id: string) =>
      navigate(`${user(username)}/film/${encodeURIComponent(id)}`),
  }
}
