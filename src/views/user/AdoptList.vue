<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElEmpty } from 'element-plus'
import { getAdoptableCats, getCatById } from '@/api/modules/cat'
import type { CatItem } from '@/api/modules/cat'

const router = useRouter()
const list = ref<CatItem[]>([])
const loading = ref(false)
const catDetails = ref<Record<string, CatItem>>({})

async function load() {
  loading.value = true
  try {
    const res: any = await getAdoptableCats({ pageSize: 20 })
    list.value = res?.data?.list ?? []
    for (const cat of list.value) {
      try {
        const detailRes = await getCatById(cat.id)
        catDetails.value[cat.id] = (detailRes as any)?.data
      } catch {}
    }
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function goApply(catId: string) {
  router.push({ name: 'AdoptDetail', params: { catId } })
}

function getCatDetail(catId: string) {
  return catDetails.value[catId]
}

onMounted(load)
</script>

<template>
  <div class="page">
    <h2>🐱 可领养猫咪</h2>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!list.length" class="empty">
      <ElEmpty description="暂无可领养猫咪" />
    </div>
    <div v-else class="adopt-grid">
      <div v-for="cat in list" :key="cat.id" class="adopt-card">
        <div class="card-img">
          <img v-if="cat.avatar || (getCatDetail(cat.id)?.images?.[0])" :src="cat.avatar || getCatDetail(cat.id)?.images?.[0]" />
          <div v-else class="img-placeholder">🐱</div>
        </div>
        <div class="card-name">{{ cat.name || '未命名' }}</div>
        <el-button type="primary" link @click="goApply(cat.id)">查看详情</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { 
  background: #f5f7fa; 
  padding: 20px; 
  min-height: 100vh; }

h2 { margin: 0 0 20px 0; 
  color: #303133; }
.loading, .empty { padding: 40px; text-align: center; }
.adopt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; }
.adopt-card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); transition: transform 0.2s; }
.adopt-card:hover { transform: translateY(-4px); box-shadow: 0 4px 20px rgba(0,0,0,0.12); }
.card-img { width: 100%; height: 180px; background: #f5f7fa; overflow: hidden; }
.card-img img { width: 100%; height: 100%; object-fit: cover; }
.img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 60px; }
.card-name { text-align: center; font-size: 18px; font-weight: 600; color: #303133; padding: 12px 0 8px; }
</style>