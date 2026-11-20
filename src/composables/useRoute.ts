import { ref } from 'vue'
import type { Route } from '@/types/ui/Route'
import type { Tab } from '@/types/ui/Tab'

// Routage par hash (fonctionne sur GitHub Pages sans configuration serveur) :
//   #/profil  #/on-site
//   #/film/new  #/film/<id>  #/film/<id>/edit
const TAB_SLUGS: Record<Tab, string> = {
  profile: 'profil',
  site: 'on-site',
}
const DEFAULT_TAB: Tab = 'profile'

function parseHash(): Route {
  const [path = '', query = ''] = window.location.hash.replace(/^#\/?/, '').split('?')
  const parts = path.split('/').filter(Boolean)

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
// Dernier onglet visité : sert de « retour » depuis une page de film
const lastTab = ref<Tab>(route.value.name === 'tab' ? route.value.tab : 'site')

// Couvre aussi les boutons précédent / suivant du navigateur
window.addEventListener('hashchange', () => {
  route.value = parseHash()
  if (route.value.name === 'tab') lastTab.value = route.value.tab
  window.scrollTo(0, 0)
})

function navigate(path: string) {
  window.location.hash = path
}

export function useRoute() {
  return {
    route,
    lastTab,
    goTab: (tab: Tab) => navigate(`/${TAB_SLUGS[tab]}`),
    goNewFilm: (opts?: { favorite?: boolean }) =>
      navigate(opts?.favorite ? '/film/new?favorite=1' : '/film/new'),
    goFilm: (id: string) => navigate(`/film/${encodeURIComponent(id)}`),
    goEditFilm: (id: string) => navigate(`/film/${encodeURIComponent(id)}/edit`),
  }
}
