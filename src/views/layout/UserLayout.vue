<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMenu, ElMenuItem, ElButton } from 'element-plus'
import { computed } from 'vue'

const router = useRouter()
const auth = useAuthStore()

const menus = [
  { path: '/report', name: '上报流浪猫' },
  { path: '/adopt', name: '可领养' },
  { path: '/pets', name: '我的宠物' },
  { path: '/catsociety', name: '哈吉米社区' },
]

// 显示用户信息
const userDisplayName = computed(() => {
  return auth.isSuperAdmin ? `🛡️ ${auth.username || auth.userId}` : (auth.username || auth.userId)
})


function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="user-layout">
    <header class="header">
      <img src="E:\EdithKirkland\Desktop\cat-health-system\src\assets\icon.jpg" alt="icon" style="width: 50px; height: 50px;" />
      <span class="title">社区猫管理 · 用户端</span>
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

.user-layout { 
  min-height: 100vh;
  display: flex; 
  flex-direction: column; 
  background: #00641196; 
}
.header {
  display: flex; 
  align-items: center; 
  gap: 16px; 
  padding: 12px 24px; 
  background: #000000;
  color: #ff9a9a; 
  box-shadow: 0 1px 4px rgba(0,0,0,.08);
}
.title { 
  font-weight: 600; 
  font-size: 35px;
  margin-right: 24px; 
}
.nav { 
  display: flex; 
  gap: 16px; 
  flex: 1; 
}
.nav-link { 
  color: #46a20d; 
  text-decoration: none; 
}
.nav-link.router-link-active { 
  color: #ff9a9a;
  font-weight: 600;
   
  }
.main { 
  flex: 1; 
  padding: 24px; 
  }
.username { 
  color: #ff9a9a; 
  font-weight: 500;
  font-size: 25px; 
  margin-right: 10px;
}
</style>
