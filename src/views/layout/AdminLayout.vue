<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElButton } from 'element-plus'

const router = useRouter()
const auth = useAuthStore()

const menus = [
  { path: '/admin/dashboard', name: '数据仪表盘' },
  { path: '/admin/reports', name: '上报审核' },
  { path: '/admin/cats', name: '猫档案' },
  { path: '/admin/interventions', name: '干预工单' },
  { path: '/admin/adoptions', name: '领养申请' },
]

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="admin-layout">
    <header class="header">
      <span class="title">社区猫管理 · 管理端</span>
      <nav class="nav">
        <router-link v-for="m in menus" :key="m.path" :to="m.path" class="nav-link">{{ m.name }}</router-link>
      </nav>
      <el-button size="small" @click="logout">退出</el-button>
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
.main { flex: 1; padding: 24px; }
</style>
