
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElButton } from 'element-plus'
import { computed } from 'vue'
import iconUrl from '@/assets/icon.jpg'

const router = useRouter()
const auth = useAuthStore()

// 基础管理员菜单
const baseMenus = [
  { path: '/admin/dashboard', name: '事件统计' },
    { path: '/admin/feeding', name: '定点投喂' },
  { path: '/admin/reports', name: '上报审核' },
  { path: '/admin/cats', name: '猫档案' },
  { path: '/admin/interventions', name: '干预工单' },
  { path: '/admin/adoptions', name: '领养申请' },
  { path: '/admin/community', name: '哈基米社区' },

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
      <div class="brand-block">
        <div class="logo-wrap">
          <img :src="iconUrl" alt="icon" class="logo" />
        </div>
        <div class="title-block">
          <span class="eyebrow">Neighborhood Cat Care</span>
          <span class="title">{{ pageTitle }}</span>
        </div>
      </div>
      <nav class="nav">
        <router-link v-for="m in menus" :key="m.path" :to="m.path" class="nav-link">{{ m.name }}</router-link>
      </nav>
      <div class="user-info">
        <span class="username">{{ userDisplayName }}</span>
        <el-button class="logout-btn" size="small" @click="logout">退出</el-button>
      </div>
    </header>
    <main class="main">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.admin-layout { 
  --warm-bg-1: #fff9ef;
  --warm-bg-2: #f6ecdc;
  --warm-border: #e3d2bc;
  --warm-text: #4a3a2c;
  --warm-accent: #c98649;
  min-height: 100vh; 
  display: flex; 
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 9% 12%, rgba(255, 255, 255, 0.8), transparent 34%),
    radial-gradient(circle at 90% 6%, rgba(255, 231, 202, 0.42), transparent 38%),
    linear-gradient(160deg, var(--warm-bg-1) 0%, var(--warm-bg-2) 55%, #f1e6d7 100%);
}

.admin-layout::before,
.admin-layout::after {
  content: "";
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.admin-layout::before {
  width: 280px;
  height: 280px;
  right: -90px;
  top: 46px;
  background: radial-gradient(circle, rgba(245, 196, 145, 0.32) 0%, transparent 68%);
}

.admin-layout::after {
  width: 220px;
  height: 220px;
  left: -70px;
  bottom: -80px;
  background: radial-gradient(circle, rgba(233, 212, 184, 0.35) 0%, transparent 70%);
}

.header {
  position: sticky;
  top: 0;
  z-index: 25;
  display: flex; 
  align-items: center; 
  gap: 18px; 
  padding: 14px 24px; 
  background: linear-gradient(180deg, rgba(255, 251, 243, 0.96) 0%, rgba(246, 234, 218, 0.93) 100%);
  border-bottom: 1px solid var(--warm-border);
  color: var(--warm-text);
  box-shadow: 0 12px 30px rgba(112, 87, 58, 0.12);
  backdrop-filter: blur(7px);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 8px;
}

.logo-wrap {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  padding: 3px;
  background: linear-gradient(145deg, #f6cb9d, #e9aa6c);
  box-shadow: 0 9px 18px rgba(133, 84, 42, 0.22);
}

.logo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 13px;
}

.title-block {
  display: grid;
  gap: 2px;
}

.eyebrow {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #9a7658;
}

.title { 
  font-weight: 700;
  font-size: 24px;
  letter-spacing: 0.03em;
  color: #553f2f;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
}
.nav { 
  display: flex; 
  flex-wrap: wrap;
  gap: 10px; 
  flex: 1; 
}
.nav-link { 
  color: #5a4b3d;
  text-decoration: none; 
  border: 1px solid var(--warm-border);
  background: linear-gradient(145deg, #fffaf2, #f5eadb);
  border-radius: 999px;
  padding: 8px 14px;
  box-shadow: 0 5px 12px rgba(124, 93, 61, 0.08);
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 600;
}

.nav-link:hover {
  border-color: #d7b48f;
  color: #4e3c2d;
  background: linear-gradient(145deg, #fffdf9, #f9f0e4);
  transform: translateY(-1px) scale(1.01);
}

.nav-link.router-link-active { 
  color: #4f3c2b;
  font-weight: 600; 
  border-color: #cfa982;
  background: linear-gradient(145deg, #ffeed8, #f4dec4);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.82), 0 7px 16px rgba(120, 87, 52, 0.17);
}
.user-info { 
  display: flex; 
  align-items: center; 
  gap: 8px;
  border: 1px solid #ead8c4;
  border-radius: 999px;
  padding: 6px 8px 6px 12px;
  background: rgba(255, 250, 240, 0.74);
}
.username { 
  color: #5b4a3b;
  font-weight: 600;
  font-size: 14px;
}

.logout-btn {
  border: 1px solid #d8c4ab;
  color: #5a4634;
  background: linear-gradient(150deg, #fff8ef, #f2e1cf);
}

.logout-btn:hover {
  border-color: var(--warm-accent);
  color: #4d3c2d;
}

.main { 
  flex: 1; 
  padding: 24px;
  position: relative;
  z-index: 1;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: all 0.24s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 1280px) {
  .header {
    padding: 12px 14px;
  }

  .title {
    font-size: 20px;
  }

  .nav-link {
    padding: 7px 12px;
  }
}

@media (max-width: 1024px) {
  .header {
    flex-wrap: wrap;
  }

  .brand-block {
    width: 100%;
  }

  .nav {
    width: 100%;
    order: 3;
  }

  .user-info {
    margin-left: auto;
  }
}

@media (max-width: 760px) {
  .main {
    padding: 12px;
  }

  .title {
    font-size: 18px;
  }

  .user-info {
    width: 100%;
    justify-content: space-between;
    border-radius: 14px;
  }

  .nav-link {
    font-size: 12px;
  }
}
</style>