<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMenu, ElMenuItem, ElButton } from 'element-plus'

const router = useRouter()
const auth = useAuthStore()

const menus = [
  { path: '/report', name: '上报流浪猫' },
  { path: '/adopt', name: '可领养' },
  { path: '/pets', name: '我的宠物' },
]

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="user-layout">
    <header class="header">
      <span class="title">社区猫管理 · 用户端</span>
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
.user-layout { min-height: 100vh; display: flex; flex-direction: column; background: #f5f7fa; }
.header {
  display: flex; align-items: center; gap: 16px; padding: 12px 24px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.08);
}
.title { font-weight: 600; margin-right: 24px; }
.nav { display: flex; gap: 16px; flex: 1; }
.nav-link { color: #409eff; text-decoration: none; }
.nav-link.router-link-active { font-weight: 600; }
.main { flex: 1; padding: 24px; }
</style>
