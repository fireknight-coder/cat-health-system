<script setup lang="ts">
import { computed }  from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps<{
  menus: { path: string; name: string; icon?: string }[]
  type: 'user' | 'admin'
}>()

const route = useRoute()
const router = useRouter()

function navigate(path: string) {
  router.push(path)
}

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

// 管理员图标
const adminIcons: Record<string, string> = {
  '事件统计': '📊',
  '定点投喂': '🍽️',
  '上报审核': '✅',
  '猫档案': '📁',
  '身份识别': '🔍',
  '干预工单': '📋',
  '领养申请': '💝',
  '哈基米社区': '🐱',
  '管理员审核': '🛡️',
}

// 用户图标
const userIcons: Record<string, string> = {
  '上报流浪猫': '📢',
  '可领养': '💝',
  '我的宠物': '🐱',
  '哈吉米社区': '🏠',
}

const icons = computed(() => {
  return props.type === 'admin' ? adminIcons : userIcons
})

function getIcon(name: string) {
  // 移除装饰字符
  const cleanName = name.replace(/^🛡️\s*/, '')
  return icons.value[cleanName] || '📄'
}
</script>

<template>
  <nav class="mobile-nav-bar">
    <div class="nav-items">
      <div
        v-for="item in menus"
        :key="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
        @click="navigate(item.path)"
      >
        <span class="nav-icon">{{ getIcon(item.name) }}</span>
        <span class="nav-label">{{ item.name.replace(/^🛡️\s*/, '') }}</span>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.mobile-nav-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: linear-gradient(180deg, rgba(255, 251, 243, 0.98) 0%, rgba(246, 234, 218, 0.95) 100%);
  border-top: 1px solid #e3d2bc;
  box-shadow: 0 -4px 20px rgba(112, 87, 58, 0.1);
  backdrop-filter: blur(10px);
  padding-bottom: max(4px, env(safe-area-inset-bottom));
  padding-top: 6px;
}

.nav-items {
  display: flex;
  justify-content: space-around;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  min-height: 50px;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 12px;
  gap: 2px;
}

.nav-item:hover {
  background: rgba(201, 134, 73, 0.08);
}

.nav-item.active {
  background: rgba(201, 134, 73, 0.15);
}

.nav-icon {
  font-size: 22px;
  line-height: 1;
  margin-bottom: 2px;
}

.nav-label {
  font-size: 11px;
  color: #7d624b;
  font-weight: 500;
  white-space: nowrap;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-item.active .nav-label {
  color: #c98649;
  font-weight: 600;
}

/* 在桌面端隐藏 */
@media (min-width: 769px) {
  .mobile-nav-bar {
    display: none;
  }
}

/* 小屏手机适配 */
@media (max-width: 480px) {
  .nav-icon {
    font-size: 20px;
  }

  .nav-label {
    font-size: 10px;
    max-width: 50px;
  }

  .nav-item {
    min-width: 50px;
    min-height: 48px;
    padding: 4px 4px;
  }
}
</style>
