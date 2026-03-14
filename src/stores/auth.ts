// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Role = 'user' | 'admin' | 'superadmin' | 'pending_admin'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const role = ref<Role>((localStorage.getItem('role') as Role) || 'user')
  const userId = ref<string | null>(localStorage.getItem('userId'))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => role.value === 'admin' || role.value === 'superadmin')
  const isUser = computed(() => role.value === 'user' || role.value === 'pending_admin')
  const isSuperAdmin = computed(() => role.value === 'superadmin')

  function login(t: string, r: Role, id: string) {
    token.value = t
    role.value = r
    userId.value = id
    
    localStorage.setItem('token', t)
    localStorage.setItem('role', r)
    localStorage.setItem('userId', id)
  }

  function logout() {
    token.value = null
    role.value = 'user'
    userId.value = null
    
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('userId')
  }

  const canAccessAdmin = computed(() => isAdmin.value)

  // 权限检查函数
  function hasPermission(requiredRole: Role): boolean {
    const roleHierarchy: Record<Role, number> = {
      'user': 1,
      'admin': 2,
      'superadmin': 3,
      'pending_admin': 1
    }
    
    return roleHierarchy[role.value] >= roleHierarchy[requiredRole]
  }

  return { 
    token, 
    role, 
    userId, 
    isLoggedIn, 
    isAdmin, 
    isUser, 
    isSuperAdmin, 
    login, 
    logout, 
    canAccessAdmin,
    hasPermission
  }
})