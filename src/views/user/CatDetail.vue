<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElTag, ElCard, ElEmpty, ElInput, ElSelect, ElOption, ElMessageBox, ElMessage } from 'element-plus'
import { getCatById } from '@/api/modules/cat'
import { getObservations } from '@/api/modules/observation'
import { useAuthStore } from '@/stores/auth'
import { getPetGrowthRecords, addPetGrowthRecord, deletePetGrowthRecord, type PetGrowthRecord } from '@/api/modules/petGrowth'
import { getPetChatMessages, sendPetChatMessage, deletePetChatMessage, type PetChatMessage } from '@/api/modules/petChat'
import { getMyPets } from '@/api/modules/adoption'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const catId = route.params.id as string
const cat = ref<any>(null)
const observations = ref<any[]>([])
const loading = ref(false)

// 成长记录
const growthRecords = ref<PetGrowthRecord[]>([])
const growthLoading = ref(false)
const growthForm = reactive({ content: '', recordType: 'other' })
const growthSubmitting = ref(false)
const adoptionId = ref<string | null>(null)

// 聊天交流
const chatMessages = ref<PetChatMessage[]>([])
const chatLoading = ref(false)
const chatDraft = ref('')

const recordTypeOptions = [
  { label: '体重', value: 'weight' },
  { label: '健康', value: 'health' },
  { label: '行为', value: 'behavior' },
  { label: '喂食', value: 'feeding' },
  { label: '成长', value: 'growth' },
  { label: '其他', value: 'other' },
]

function recordTypeLabel(t: string) {
  return recordTypeOptions.find(o => o.value === t)?.label || t
}

function formatTime(time: string) {
  const d = new Date(time)
  if (Number.isNaN(d.getTime())) return time
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatRole(role: string) {
  if (role === 'superadmin') return '超级管理员'
  if (role === 'admin') return '管理员'
  return '用户'
}

async function load() {
  loading.value = true
  try {
    const [catRes, obsRes] = await Promise.all([
      getCatById(catId),
      getObservations(catId)
    ])
    cat.value = (catRes as any).data
    observations.value = (obsRes as any).data ?? []

    // 尝试查找领养记录以加载成长记录和聊天
    await tryLoadAdoptionData()
  } catch {
    cat.value = null
  } finally {
    loading.value = false
  }
}

async function tryLoadAdoptionData() {
  try {
    const petsRes = await getMyPets() as any
    const myPets = petsRes?.data ?? []
    const found = myPets.find((p: any) => p.catId?._id === catId || p.catId === catId)
    if (found?._id) {
      adoptionId.value = found._id
      await Promise.all([loadGrowthRecords(found._id), loadChat()])
    }
  } catch {
    // 管理员可能没有领养记录，尝试直接加载聊天
    try { await loadChat() } catch {}
  }
}

async function loadGrowthRecords(adoptionIdVal: string) {
  growthLoading.value = true
  try {
    const res = await getPetGrowthRecords(adoptionIdVal) as any
    growthRecords.value = res?.data ?? []
  } catch {
    growthRecords.value = []
  } finally {
    growthLoading.value = false
  }
}

async function submitGrowthRecord() {
  const text = growthForm.content.trim()
  if (!text) {
    ElMessage.warning('请输入记录内容')
    return
  }
  if (!adoptionId.value) {
    ElMessage.warning('未找到领养记录')
    return
  }
  growthSubmitting.value = true
  try {
    await addPetGrowthRecord(adoptionId.value, { content: text, recordType: growthForm.recordType })
    ElMessage.success('记录已保存')
    growthForm.content = ''
    growthForm.recordType = 'other'
    await loadGrowthRecords(adoptionId.value)
  } catch {
    ElMessage.error('保存失败')
  } finally {
    growthSubmitting.value = false
  }
}

async function handleDeleteRecord(record: PetGrowthRecord) {
  try {
    await ElMessageBox.confirm('确定删除该记录吗？', '删除确认', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
    })
    await deletePetGrowthRecord(record._id)
    ElMessage.success('已删除')
    if (adoptionId.value) await loadGrowthRecords(adoptionId.value)
  } catch (err: any) {
    if (err && err !== 'cancel') ElMessage.error('删除失败')
  }
}

async function loadChat() {
  chatLoading.value = true
  try {
    const res = await getPetChatMessages(catId) as any
    chatMessages.value = res?.data?.messages ?? []
  } catch {
    chatMessages.value = []
  } finally {
    chatLoading.value = false
  }
}

async function sendChat() {
  const text = chatDraft.value.trim()
  if (!text) {
    ElMessage.warning('请输入交流内容')
    return
  }
  try {
    await sendPetChatMessage({ catId, content: text })
    chatDraft.value = ''
    await loadChat()
    ElMessage.success('发送成功')
  } catch {
    ElMessage.error('发送失败')
  }
}

async function handleDeleteChat(msg: PetChatMessage) {
  try {
    await ElMessageBox.confirm('确定删除该消息吗？', '删除确认', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
    })
    await deletePetChatMessage(msg._id)
    ElMessage.success('已删除')
    await loadChat()
  } catch (err: any) {
    if (err && err !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <el-button @click="router.back()">返回</el-button>
    <div v-if="loading" class="loading">加载中...</div>
    <template v-else-if="cat">
      <div class="cat-header">
        <img v-if="cat.avatar" :src="cat.avatar" class="cat-avatar" />
        <div>
          <h2>{{ cat.name }}</h2>
          <div class="cat-meta">
            <el-tag>{{ cat.status }}</el-tag>
            <span v-if="cat.age">{{ cat.age }}岁</span>
            <span v-if="cat.gender">{{ cat.gender === 'male' ? '公猫' : '母猫' }}</span>
            <span v-if="cat.breed">{{ cat.breed }}</span>
          </div>
        </div>
      </div>

      <!-- 观察记录 -->
      <el-card header="📝 观察记录" class="section-card">
        <div v-if="!observations.length">暂无记录</div>
        <div v-else class="record-list">
          <div v-for="obs in observations" :key="obs._id" class="record-item">
            <div class="record-top">
              <el-tag size="small">{{ obs.isUserRecord ? '用户记录' : '管理员记录' }}</el-tag>
              <span class="record-time">{{ obs.observedAt }}</span>
            </div>
            <p>{{ obs.content }}</p>
          </div>
        </div>
      </el-card>

      <!-- 成长记录 -->
      <el-card class="section-card">
        <template #header>
          <span>📊 成长记录</span>
        </template>
        <div class="growth-form" v-if="adoptionId">
          <el-select v-model="growthForm.recordType" placeholder="类型" style="width: 120px" size="small">
            <el-option v-for="opt in recordTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
          <el-input v-model="growthForm.content" type="textarea" :rows="2" placeholder="记录宠物状态..." size="small" style="flex:1" />
          <el-button type="primary" size="small" :loading="growthSubmitting" @click="submitGrowthRecord">保存</el-button>
        </div>
        <div v-else class="no-adoption-tip">该猫暂无已批准的领养记录</div>

        <div v-loading="growthLoading" class="record-list">
          <div v-if="!growthRecords.length && !growthLoading" class="empty-tip">暂无成长记录</div>
          <div v-for="r in growthRecords" :key="r._id" class="record-item">
            <div class="record-top">
              <el-tag size="small" :type="r.recordType === 'health' ? 'danger' : 'info'">{{ recordTypeLabel(r.recordType) }}</el-tag>
              <span class="record-author">{{ r.recorderName }}（{{ formatRole(r.recorderRole) }}）</span>
              <span class="record-time">{{ formatTime(r.recordDate || r.createdAt) }}</span>
              <el-button link type="danger" size="small" @click="handleDeleteRecord(r)">删除</el-button>
            </div>
            <p>{{ r.content }}</p>
          </div>
        </div>
      </el-card>

      <!-- 交流记录 -->
      <el-card class="section-card">
        <template #header>
          <span>💬 交流记录</span>
        </template>
        <div class="chat-input-row">
          <el-input v-model="chatDraft" type="textarea" :rows="2" placeholder="输入消息..." @keyup.enter.ctrl="sendChat" />
          <el-button type="success" size="small" @click="sendChat">发送</el-button>
        </div>

        <div v-loading="chatLoading" class="record-list">
          <div v-if="!chatMessages.length && !chatLoading" class="empty-tip">暂无交流记录</div>
          <div v-for="msg in chatMessages" :key="msg._id" class="chat-item">
            <div class="record-top">
              <span class="record-author">{{ msg.senderName }}（{{ formatRole(msg.senderRole) }}）</span>
              <el-tag v-if="msg.isImportant" type="danger" size="small">重要</el-tag>
              <span class="record-time">{{ formatTime(msg.createdAt) }}</span>
              <el-button link type="danger" size="small" @click="handleDeleteChat(msg)">删除</el-button>
            </div>
            <p>{{ msg.content }}</p>
          </div>
        </div>
      </el-card>
    </template>
    <div v-else>未找到猫咪</div>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
.loading { text-align: center; padding: 40px; color: #999; }
.cat-header { display: flex; align-items: center; gap: 16px; margin: 16px 0; }
.cat-avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
.cat-meta { display: flex; align-items: center; gap: 10px; margin-top: 6px; color: #666; font-size: 14px; }

.section-card { margin-top: 20px; border-radius: 10px; }

.growth-form { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 12px; }
.no-adoption-tip { color: #999; font-size: 13px; margin-bottom: 10px; }

.record-list { display: grid; gap: 8px; }
.empty-tip { text-align: center; padding: 16px; color: #999; font-size: 13px; }
.record-item { background: #fafafa; border: 1px solid #eee; border-radius: 8px; padding: 10px; }
.record-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
.record-author { font-weight: 600; font-size: 13px; color: #33608f; }
.record-time { font-size: 12px; color: #999; margin-left: auto; }
.record-item p { margin: 0; font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap; }

.chat-input-row { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 12px; }
.chat-item { background: #f7fbff; border: 1px solid #dceaf7; border-radius: 8px; padding: 10px; }
.chat-item p { margin: 0; font-size: 14px; color: #4b5b6b; line-height: 1.6; white-space: pre-wrap; }

@media (max-width: 768px) {
  .page { padding: 16px; }
  .cat-header { flex-direction: column; align-items: flex-start; }
  .growth-form { flex-wrap: wrap; }
  .growth-form .el-select { width: 100% !important; }
  .chat-input-row { flex-wrap: wrap; }
}
</style>
