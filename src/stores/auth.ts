import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Role = 'user' | 'admin'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const role = ref<Role>('user')
  const userId = ref<string | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => role.value === 'admin')
  const isUser = computed(() => role.value === 'user')

  function login(t: string, r: Role, id: string) {
    token.value = t
    role.value = r
    userId.value = id
  }

  function logout() {
    token.value = null
    role.value = 'user'
    userId.value = null
  }

  const canAccessAdmin = computed(() => isAdmin.value)

  return { token, role, userId, isLoggedIn, isAdmin, isUser, login, logout, canAccessAdmin }
})
