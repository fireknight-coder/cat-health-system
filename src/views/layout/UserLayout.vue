
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElButton } from 'element-plus'
import { computed, ref } from 'vue'
import iconUrl from '@/assets/icon.jpg'
import MobileNavBar from '@/components/MobileNavBar.vue'

const router = useRouter()
const auth = useAuthStore()

// 根据用户角色显示不同菜单
const menus = computed(() => {
  if (auth.isGuest) {
    return [
      { path: '/guest/adopt', name: '可领养' },
      { path: '/guest/catsociety', name: '哈吉米社区' },
    ]
  }
  return [
    { path: '/report', name: '上报流浪猫' },
    { path: '/adopt', name: '可领养' },
    { path: '/pets', name: '我的宠物' },
    { path: '/catsociety', name: '哈吉米社区' },
  ]
})

// 移动端显示的菜单（游客和用户略有不同）
const mobileNavMenus = computed(() => {
  if (auth.isGuest) {
    return [
      { path: '/guest/adopt', name: '可领养' },
      { path: '/guest/catsociety', name: '社区' },
    ]
  }
  return [
    { path: '/report', name: '上报' },
    { path: '/adopt', name: '可领养' },
    { path: '/pets', name: '我的' },
    { path: '/catsociety', name: '社区' },
  ]
})

// 当前是否是移动视图
const isMobileView = ref(false)

// 检测屏幕宽度
function checkScreenSize() {
  isMobileView.value = window.innerWidth < 769
}

// 初始化检测
checkScreenSize()
window.addEventListener('resize', checkScreenSize)

// 显示用户信息
const userDisplayName = computed(() => {
  if (auth.isGuest) return '游客'
  return auth.isSuperAdmin ? `🛡️ ${auth.username || auth.userId}` : (auth.username || auth.userId)
})

const showLoginBtn = computed(() => auth.isGuest)


function goToLogin() {
  router.push('/login')
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="user-layout" :class="{ 'mobile-view': isMobileView }">
    <header class="header">
      <div class="brand-block">
        <div class="logo-wrap">
          <img :src="iconUrl" alt="icon" class="logo" />
        </div>
        <div class="title-block" v-show="!isMobileView">
          <span class="eyebrow">Community Cat Circle</span>
          <span class="title">社区猫管理 · 用户端</span>
        </div>
        <span class="mobile-title" v-show="isMobileView">社区猫 · 用户端</span>
      </div>
      <nav class="nav" v-show="!isMobileView">
        <router-link v-for="m in menus" :key="m.path" :to="m.path" class="nav-link">{{ m.name }}</router-link>
      </nav>

      <!-- 桌面端用户信息 -->
      <div class="user-info" v-show="!isMobileView">
        <span class="username">{{ userDisplayName }}</span>
        <el-button v-if="showLoginBtn" class="login-btn" type="primary" size="small" @click="goToLogin">注册/登录</el-button>
        <el-button v-else class="logout-btn" size="small" @click="logout">退出</el-button>
      </div>

      <!-- 移动端头部用户信息 -->
      <div class="mobile-header-user" v-show="isMobileView">
        <span class="mobile-header-username">{{ userDisplayName }}</span>
        <el-button v-if="showLoginBtn" class="mobile-header-btn" type="primary" size="small" @click="goToLogin">登录</el-button>
        <el-button v-else class="mobile-header-btn logout" size="small" @click="logout">退出</el-button>
      </div>

    </header>
    <main class="main" :class="{ 'has-mobile-nav': isMobileView }">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <MobileNavBar :menus="mobileNavMenus" type="user" v-if="isMobileView" />
  </div>
</template>

<style scoped>

.user-layout { 
  --warm-bg-1: #fff8ee;
  --warm-bg-2: #f7ecdc;
  --warm-panel: #fffdf9;
  --warm-border: #e4d4c0;
  --warm-text: #4a3f35;
  --warm-accent: #c98649;
  min-height: 100vh;
  display: flex; 
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 11% 10%, rgba(255, 255, 255, 0.77), transparent 34%),
    radial-gradient(circle at 88% 9%, rgba(255, 233, 205, 0.44), transparent 36%),
    linear-gradient(160deg, var(--warm-bg-1) 0%, var(--warm-bg-2) 55%, #f2e6d7 100%);
}

.user-layout::before,
.user-layout::after {
  content: "";
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.user-layout::before {
  width: 240px;
  height: 240px;
  top: 60px;
  right: -80px;
  background: radial-gradient(circle, rgba(250, 202, 157, 0.32) 0%, transparent 68%);
}

.user-layout::after {
  width: 200px;
  height: 200px;
  left: -64px;
  bottom: -78px;
  background: radial-gradient(circle, rgba(232, 216, 196, 0.36) 0%, transparent 70%);
}

.header {
  position: sticky;
  top: 0;
  z-index: 25;
  display: flex; 
  align-items: center; 
  gap: 18px; 
  padding: 14px 24px; 
  background: linear-gradient(180deg, rgba(255, 250, 242, 0.95) 0%, rgba(246, 235, 219, 0.92) 100%);
  border-bottom: 1px solid var(--warm-border);
  color: var(--warm-text);
  box-shadow: 0 12px 30px rgba(112, 87, 58, 0.12);
  backdrop-filter: blur(7px);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-wrap {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  padding: 3px;
  background: linear-gradient(145deg, #f8d1a9, #ebb477);
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
  letter-spacing: 0.03em;
  font-size: 24px;
  color: #5d4a3b;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
}
.nav { 
  display: flex; 
  flex-wrap: wrap;
  gap: 10px; 
  flex: 1; 
}
.nav-link { 
  color: #55483d;
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

.main { 
  flex: 1; 
  padding: 24px;
  position: relative;
  z-index: 1;
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
  margin-right: 2px;
}

.login-btn {
  border: 1px solid #c98649;
  background: linear-gradient(145deg, var(--warm-accent), #b9763f);
  color: white;
}

.login-btn:hover {
  border-color: #d1945f;
  background: linear-gradient(145deg, #d1945f, #c08047);
}

.logout-btn {
  border: 1px solid #d8c4ab;
  background: linear-gradient(150deg, #fff8ef, #f2e1cf);
  color: #5a4634;
}

.logout-btn:hover {
  border-color: var(--warm-accent);
  color: #4d3c2d;
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

@media (max-width: 768px) {
  .user-layout {
    overflow-x: hidden;
  }

  .header {
    padding: 10px 16px;
    gap: 12px;
    position: relative;
  }

  .brand-block {
    margin-right: 0;
    width: auto;
    flex: 1;
  }

  .logo-wrap {
    width: 42px;
    height: 42px;
    border-radius: 12px;
  }

  .logo {
    border-radius: 9px;
  }

  .title-block {
    display: none;
  }

  .mobile-title {
    font-weight: 700;
    font-size: 18px;
    color: #5d4a3b;
    flex: 1;
  }

  .nav {
    display: none;
  }

  .user-info {
    display: none;
  }

  .main {
    padding: 12px;
    padding-bottom: calc(60px + 48px + max(8px, env(safe-area-inset-bottom)));
  }

  .main.has-mobile-nav {
    padding-bottom: calc(60px + max(8px, env(safe-area-inset-bottom)));
  }

  /* 移动端头部用户信息栏 */
  .mobile-header-user {
    display: flex !important;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .mobile-header-username {
    font-size: 13px;
    color: #5b4a3b;
    font-weight: 600;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-header-btn {
    padding: 5px 10px;
    min-height: 28px;
    font-size: 12px;
    border-radius: 12px;
  }

  .mobile-header-btn.logout {
    border: 1px solid #d8c4ab;
    background: linear-gradient(150deg, #fff8ef, #f2e1cf);
    color: #5a4634;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 8px 12px;
  }

  .mobile-title {
    font-size: 16px;
  }

  .main {
    padding: 8px;
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
