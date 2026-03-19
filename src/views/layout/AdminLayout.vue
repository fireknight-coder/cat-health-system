<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElButton } from 'element-plus'
import { computed } from 'vue'

const router = useRouter()
const auth = useAuthStore()

// 基础管理员菜单
const baseMenus = [
  { path: '/admin/dashboard', name: '数据仪表盘' },
  { path: '/admin/reports', name: '上报审核' },
  { path: '/admin/cats', name: '猫档案' },
  { path: '/admin/interventions', name: '干预工单' },
  { path: '/admin/adoptions', name: '领养申请' },
]

// 超级管理员专属菜单
const superAdminMenus = [
  { path: '/admin/review', name: '🛡️ 管理员审核' }
]

// 根据角色决定显示的菜单
const menus = computed(() => {
  return auth.isSuperAdmin ? [...baseMenus, ...superAdminMenus] : baseMenus
})

// 显示用户信息
const userDisplayName = computed(() => {
  return auth.isSuperAdmin ? `🛡️ ${auth.username || auth.userId}` : (auth.username || auth.userId)
})

// 显示标题
const pageTitle = computed(() => {
  return auth.isSuperAdmin ? '社区猫管理 · 超级管理员端' : '社区猫管理 · 管理端'
})

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="admin-layout">
    <header class="header">
      <span class="title">{{ pageTitle }}</span>
      <nav class="nav">
        <router-link v-for="m in menus" :key="m.path" :to="m.path" class="nav-link">{{ m.name }}</router-link>
      </nav>
      <div class="user-info">
        <span class="username">{{ userDisplayName }}</span>
        <el-button size="small" @click="logout">退出</el-button>
      </div>
    </header>
    <main class="main">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.admin-layout { min-height: 100vh; display: flex; flex-direction: column; background: #f0f2f5; }
.header {
  display: flex; align-items: center; gap: 16px; padding: 12px 24px; background: #001529; color: #fff;
}
.title { font-weight: 600; margin-right: 24px; color: #fff; }
.nav { display: flex; gap: 16px; flex: 1; }
.nav-link { color: rgba(255,255,255,.7); text-decoration: none; }
.nav-link.router-link-active { color: #fff; font-weight: 600; }
.user-info { display: flex; align-items: center; gap: 12px; }
.username { color: rgba(255,255,255,.9); font-weight: 500; }
.main { flex: 1; padding: 24px; }
</style>