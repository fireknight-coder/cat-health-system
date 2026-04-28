// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Role = 'user' | 'admin' | 'superadmin' | 'pending_admin' | 'guest'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const storedRole = (localStorage.getItem('role') as Role) || 'guest'
  // 安全校验：如果没有有效token，强制重置为guest，避免残留role导致状态不一致
  const role = ref<Role>(token.value ? storedRole : 'guest')
  const userId = ref<string | null>(localStorage.getItem('userId'))
  const username = ref<string | null>(localStorage.getItem('username'))

  // 修复：未登录时（无token）强制视为guest，不受残留role影响
  const isLoggedIn = computed(() => !!token.value && role.value !== 'guest')
  const isGuest = computed(() => !token.value || role.value === 'guest')
  const isAdmin = computed(() => role.value === 'admin' || role.value === 'superadmin')
  const isUser = computed(() => role.value === 'user' || role.value === 'pending_admin')
  const isSuperAdmin = computed(() => role.value === 'superadmin')

  function login(t: string, r: Role, id: string, u?: string) {
    token.value = t
    role.value = r
    userId.value = id
    username.value = u || null
    localStorage.setItem('token', t)
    localStorage.setItem('role', r)
    localStorage.setItem('userId', id)
    if (u) localStorage.setItem('username', u)
  }

  function guestLogin() {
    token.value = null
    role.value = 'guest'
    userId.value = null
    username.value = '游客'
    localStorage.removeItem('token')
    localStorage.setItem('role', 'guest')
    localStorage.setItem('username', '游客')
    localStorage.removeItem('userId')
  }

  function logout() {
    token.value = null
    role.value = 'guest'
    userId.value = null
    username.value = null

    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
  }

  // 权限检查函数
  function hasPermission(requiredRole: Role): boolean {
    const roleHierarchy: Record<Role, number> = {
      'guest': 0,
      'user': 1,
      'admin': 2,
      'superadmin': 3,
      'pending_admin': 1
    }

    return roleHierarchy[role.value] >= roleHierarchy[requiredRole]
  }

  const canAccessAdmin = computed(() => isAdmin.value)
  const canCreatePost = computed(() => isLoggedIn.value && !isGuest.value)
  const canComment = computed(() => isLoggedIn.value && !isGuest.value)
  const canApplyAdoption = computed(() => isLoggedIn.value && !isGuest.value)

  return {
    token,
    role,
    userId,
    username,
    isLoggedIn,
    isGuest,
    isAdmin,
    isUser,
    isSuperAdmin,
    login,
    guestLogin,
    logout,
    canAccessAdmin,
    canCreatePost,
    canComment,
    canApplyAdoption,
    hasPermission
  }
})