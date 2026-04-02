<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElTag, ElCard } from 'element-plus'
import { getCatById } from '@/api/modules/cat'
import { getObservations } from '@/api/modules/observation'

const route = useRoute()
const router = useRouter()
const catId = route.params.id as string
const cat = ref<any>(null)
const observations = ref<any[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const [catRes, obsRes] = await Promise.all([
      getCatById(catId),
      getObservations(catId)
    ])
    cat.value = (catRes as any).data
    observations.value = (obsRes as any).data ?? []
  } catch {
    cat.value = null
  } finally {
    loading.value = false
  }
}

function isUserRecord(record: any) {
  return record.recordedBy?.username === 'user' || record.isUserRecord
}

onMounted(load)
</script>

<template>
  <div class="page">
    <el-button @click="router.push('/pets')">返回我的宠物</el-button>
    <div v-if="loading" class="loading">加载中...</div>
    <template v-else-if="cat">
      <h2>{{ cat.name }}</h2>
      <div class="info">
        <p>状态：<el-tag>{{ cat.status }}</el-tag></p>
        <p v-if="cat.age">年龄：{{ cat.age }}岁</p>
        <p v-if="cat.gender">性别：{{ cat.gender }}</p>
        <p v-if="cat.color">毛色：{{ cat.color }}</p>
      </div>
      
      <el-card header="观察记录" class="observation-card">
        <div v-if="!observations.length">暂无记录</div>
        <div v-else>
          <div v-for="obs in observations" :key="obs._id" class="observation-item">
            <div class="obs-header">
              <el-tag :type="isUserRecord(obs) ? 'warning' : 'success'" size="small">
                {{ isUserRecord(obs) ? '我的记录' : '管理员记录' }}
              </el-tag>
              <span class="obs-time">{{ obs.observedAt }}</span>
            </div>
            <p>{{ obs.content }}</p>
          </div>
        </div>
      </el-card>
    </template>
    <div v-else>未找到猫咪</div>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
.info { margin: 16px 0; }
.info p { margin: 8px 0; }
.observation-card { margin-top: 24px; }
.observation-item { padding: 12px 0; border-bottom: 1px solid #eee; }
.obs-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
.obs-time { color: #999; font-size: 12px; }
</style>