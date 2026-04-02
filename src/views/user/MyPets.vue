<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElEmpty, ElInput, ElMessage } from 'element-plus'
import { getMyPets } from '@/api/modules/adoption'

const router = useRouter()
const pets = ref<any[]>([])
const loading = ref(false)
const chatDraft = ref<Record<string, string>>({})
const chatMessages = ref<Record<string, string[]>>({})

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

function sendChat(catId?: string) {
  if (!catId) return
  const text = (chatDraft.value[catId] || '').trim()
  if (!text) {
    ElMessage.warning('请输入交流内容')
    return
  }
  if (!chatMessages.value[catId]) chatMessages.value[catId] = []
  chatMessages.value[catId].unshift(`我：${text}`)
  chatDraft.value[catId] = ''
  ElMessage.success('已发送到交流栏目')
}

function getChatPreview(catId?: string) {
  if (!catId) return []
  return (chatMessages.value[catId] || []).slice(0, 3)
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
        <div class="pet-info-row">
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

        <div class="chat-panel">
          <div class="chat-title">互相交流</div>
          <div class="chat-input-row">
            <el-input v-model="chatDraft[p.catId?._id || '']" placeholder="和其他领养人交流养护经验..." />
            <el-button type="success" size="small" @click="sendChat(p.catId?._id)">发送</el-button>
          </div>
          <div v-if="getChatPreview(p.catId?._id).length" class="chat-list">
            <div v-for="(msg, idx) in getChatPreview(p.catId?._id)" :key="idx" class="chat-item">{{ msg }}</div>
          </div>
          <div v-else class="chat-empty">暂无交流内容，发一条试试</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
.empty { margin-top: 24px; }
.list { margin-top: 16px; }
.item { padding: 12px; border: 1px solid #ebeef5; border-radius: 8px; margin-bottom: 10px; }
.pet-info-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.pet-info { display: flex; align-items: center; gap: 12px; }
.pet-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.pet-name { font-weight: 500; }
.pet-actions { display: flex; gap: 8px; }
.chat-panel { background: #f7fbff; border: 1px solid #dceaf7; border-radius: 8px; padding: 10px; }
.chat-title { font-size: 13px; font-weight: 600; color: #33608f; margin-bottom: 8px; }
.chat-input-row { display: flex; gap: 8px; }
.chat-list { margin-top: 8px; }
.chat-item { font-size: 13px; color: #4b5b6b; padding: 4px 0; border-bottom: 1px dashed #d8e4f0; }
.chat-empty { margin-top: 8px; font-size: 12px; color: #8a99a8; }
</style>