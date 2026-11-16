<script setup lang="ts">
import { computed, ref } from 'vue'
import AppLogo from '@/components/AppLogo.vue'
import PasswordInput from '@/components/PasswordInput.vue'
import { useAuth } from '@/composables/useAuth'
import { profileHandler } from '@/handlers/profileHandler'
import { isUsernameValid, USERNAME_HINT } from '@/lib/validation/username'

const MIN_PASSWORD_LENGTH = 6

const { signIn, signUp } = useAuth()

const mode = ref<'login' | 'signup'>('login')
const firstName = ref('')
const lastName = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const confirmation = ref('')
const loading = ref(false)
const error = ref('')
const info = ref('')

const isSignup = computed(() => mode.value === 'signup')
const usernameOk = computed(() => isUsernameValid(username.value))
const passwordOk = computed(() => password.value.length >= MIN_PASSWORD_LENGTH)
const confirmationOk = computed(() => confirmation.value === password.value)
// No error while typing (a partial password is not a mismatch yet):
// only once the field loses focus, or the input is already as long as the password.
const confirmationTouched = ref(false)
const showMismatch = computed(
  () =>
    confirmation.value !== '' &&
    !confirmationOk.value &&
    (confirmationTouched.value || confirmation.value.length >= password.value.length),
)
const canSubmit = computed(
  () =>
    !loading.value &&
    (!isSignup.value ||
      (firstName.value.trim() !== '' &&
        lastName.value.trim() !== '' &&
        usernameOk.value &&
        passwordOk.value &&
        confirmationOk.value)),
)

function handleUsernameInput(e: Event) {
  const input = e.target as HTMLInputElement
  username.value = input.value.normalize('NFC').replace(/\s/g, '')
}

function handleToggleMode() {
  mode.value = isSignup.value ? 'login' : 'signup'
  error.value = ''
  info.value = ''
}

async function handleSubmit() {
  if (!canSubmit.value) return
  loading.value = true
  error.value = ''
  info.value = ''
  try {
    if (!isSignup.value) {
      const { error: e } = await signIn(email.value, password.value)
      if (e) throw e
      return
    }
    if (!(await profileHandler.usernameAvailable(username.value))) {
      error.value = 'This username is already taken.'
      return
    }
    const { data, error: e } = await signUp({
      firstName: firstName.value,
      lastName: lastName.value,
      username: username.value,
      email: email.value,
      password: password.value,
    })
    if (e) throw e
    if (!data.session) info.value = 'Account created: confirm your email, then sign in.'
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Something went wrong'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center px-4 py-10">
    <AppLogo class="mb-8 scale-125" />
    <form
      class="w-full max-w-sm space-y-4 rounded bg-[#1b2128] p-6 ring-1 ring-white/10"
      @submit.prevent="handleSubmit"
    >
      <h1 class="text-xs font-bold uppercase tracking-widest text-lb-muted">
        {{ isSignup ? 'Create an account' : 'Sign in' }}
      </h1>

      <template v-if="isSignup">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="lb-label" for="first-name">First name</label>
            <input
              id="first-name"
              v-model="firstName"
              required
              maxlength="60"
              autocomplete="given-name"
              class="lb-input"
            />
          </div>
          <div>
            <label class="lb-label" for="last-name">Last name</label>
            <input
              id="last-name"
              v-model="lastName"
              required
              maxlength="60"
              autocomplete="family-name"
              class="lb-input"
            />
          </div>
        </div>
        <div>
          <label class="lb-label" for="username">Username</label>
          <input
            id="username"
            :value="username"
            required
            maxlength="20"
            autocomplete="username"
            class="lb-input"
            @input="handleUsernameInput"
          />
          <p
            class="mt-1 text-xs"
            :class="username && !usernameOk ? 'text-red-400' : 'text-lb-muted'"
          >
            {{ USERNAME_HINT }}
          </p>
        </div>
      </template>

      <div>
        <label class="lb-label" for="email">Email</label>
        <input id="email" v-model="email" type="email" required autocomplete="email" class="lb-input" />
      </div>
      <div>
        <label class="lb-label" for="password">Password</label>
        <PasswordInput
          id="password"
          v-model="password"
          :minlength="isSignup ? MIN_PASSWORD_LENGTH : undefined"
          :autocomplete="isSignup ? 'new-password' : 'current-password'"
        />
      </div>
      <div v-if="isSignup">
        <label class="lb-label" for="confirmation">Confirm password</label>
        <PasswordInput
          id="confirmation"
          v-model="confirmation"
          autocomplete="new-password"
          @blur="confirmationTouched = true"
        />
        <p v-if="showMismatch" class="mt-1 text-xs text-red-400">
          Passwords do not match.
        </p>
        <p v-else-if="confirmation && confirmationOk" class="mt-1 text-xs text-lb-green">
          ✓ Passwords match.
        </p>
      </div>

      <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
      <p v-if="info" class="text-sm text-lb-green">{{ info }}</p>
      <button type="submit" class="lb-btn lb-btn-green w-full" :disabled="!canSubmit">
        {{ loading ? '…' : isSignup ? 'Sign up' : 'Sign in' }}
      </button>
      <button
        type="button"
        class="w-full cursor-pointer text-center text-xs text-lb-muted hover:text-white"
        @click="handleToggleMode"
      >
        {{ isSignup ? 'Already have an account? Sign in' : 'No account yet? Create one' }}
      </button>
    </form>
  </main>
</template>
