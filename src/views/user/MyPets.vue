<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElEmpty } from 'element-plus'
import { getMyPets } from '@/api/modules/adoption'

const router = useRouter()
const pets = ref<any[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await getMyPets()
    pets.value = (res as any).data ?? []
  } catch {
    pets.value = []
  } finally {
    loading.value = false
  }
}

function goBind() {
  router.push({ name: 'DeviceBind' })
}
function goLocation(petId: string) {
  router.push({ name: 'PetLocation', params: { petId } })
}

function goObservation(catId?: string) {
  if (!catId) return
  router.push({ name: 'ObservationCreate', query: { catId } })
}

function goIntervention(catId?: string) {
  if (!catId) return
  router.push({ name: 'InterventionCreate', query: { catId } })
}

onMounted(load)
</script>

<template>
  <div class="page">
    <h2>我的宠物</h2>
    <div v-if="!pets.length" class="empty">
      <ElEmpty description="暂无可领养宠物" />
    </div>
    <div v-else class="list">
      <div v-for="p in pets" :key="p._id" class="item">
        <div class="pet-info">
          <img v-if="p.catId?.avatar" :src="p.catId.avatar" class="pet-avatar" />
          <span class="pet-name">{{ p.catId?.name || '未命名' }}</span>
        </div>
        <div class="pet-actions">
          <el-button size="small" type="primary" @click="goObservation(p.catId?._id)">观察报告</el-button>
          <el-button size="small" type="warning" @click="goIntervention(p.catId?._id)">请求干预</el-button>
          <el-button size="small" @click="goLocation(p.catId?._id)">查看位置</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
.empty { margin-top: 24px; }
.list { margin-top: 16px; }
.item { display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1px solid #ebeef5; border-radius: 8px; margin-bottom: 8px; }
.pet-info { display: flex; align-items: center; gap: 12px; }
.pet-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.pet-name { font-weight: 500; }
.pet-actions { display: flex; gap: 8px; }
</style>