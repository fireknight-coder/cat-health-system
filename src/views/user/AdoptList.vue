<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElEmpty } from 'element-plus'
import { getAdoptableCats } from '@/api/modules/cat'
import { getCatStatusLabel } from '@/stores/dictionary'
import type { CatItem } from '@/api/modules/cat'

const router = useRouter()
const list = ref<CatItem[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await getAdoptableCats({ pageSize: 20 })
    list.value = (res as { list: CatItem[] }).list ?? []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function goApply(catId: string) {
  router.push({ name: 'AdoptApply', params: { catId } })
}

onMounted(load)
</script>

<template>
  <div class="page">
    <h2>可领养列表</h2>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!list.length" class="empty">
      <ElEmpty description="暂无可领养猫咪" />
    </div>
    <div v-else class="grid">
      <div v-for="cat in list" :key="cat.id" class="card">
        <div class="avatar">{{ cat.avatar ? '图' : '🐱' }}</div>
        <div class="info">
          <span class="name">{{ cat.name || '未命名' }}</span>
          <span class="status">{{ getCatStatusLabel(cat.status as any) }}</span>
        </div>
        <el-button type="primary" size="small" @click="goApply(cat.id)">申请领养</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
.loading, .empty { padding: 24px; text-align: center; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
.card { border: 1px solid #ebeef5; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.avatar { width: 64px; height: 64px; background: #f5f7fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.name { font-weight: 600; }
.status { font-size: 12px; color: #909399; }
</style>
