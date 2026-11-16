import { ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { SignupInput } from '@/types/ui/SignupInput'

const session = ref<Session | null>(null)
const ready = ref(false)

supabase.auth.getSession().then(({ data }) => {
  session.value = data.session
  ready.value = true
})
supabase.auth.onAuthStateChange((_event, s) => {
  session.value = s
})

export function useAuth() {
  return {
    session,
    ready,
    signIn: (email: string, password: string) =>
      supabase.auth.signInWithPassword({ email, password }),
    // Les métadonnées sont recopiées dans `profiles` par un trigger SQL (handle_new_user)
    signUp: (input: SignupInput) =>
      supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            first_name: input.firstName.trim(),
            last_name: input.lastName.trim(),
            username: input.username,
          },
        },
      }),
    signOut: () => supabase.auth.signOut(),
  }
}
