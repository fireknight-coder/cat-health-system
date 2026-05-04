<script setup lang="ts">
import { ref, onMounted, reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElEmpty, ElInput, ElMessage, ElDialog, ElSelect, ElOption, ElTag, ElMessageBox } from 'element-plus'
import { getMyPets } from '@/api/modules/adoption'
import { getPetGrowthRecords, addPetGrowthRecord, deletePetGrowthRecord, type PetGrowthRecord } from '@/api/modules/petGrowth'
import { getPetChatMessages, sendPetChatMessage, deletePetChatMessage, type PetChatMessage } from '@/api/modules/petChat'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const pets = ref<any[]>([])
const loading = ref(false)

// 成长记录相关
const growthDialogVisible = ref(false)
const growthRecords = ref<PetGrowthRecord[]>([])
const growthLoading = ref(false)
const currentPet = ref<any>(null)
const growthForm = reactive({ content: '', recordType: 'other' })
const growthSubmitting = ref(false)

// 聊天相关
const chatMessages = ref<Record<string, PetChatMessage[]>>({})
const chatDraft = ref<Record<string, string>>({})
const chatLoading = ref<Record<string, boolean>>({})

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

async function loadPets() {
  loading.value = true
  try {
    const res = await getMyPets() as any
    pets.value = res?.data ?? []
    // 加载每只宠物的聊天记录
    for (const p of pets.value) {
      const catId = p.catId?._id
      if (catId) await loadChat(catId)
    }
  } catch {
    pets.value = []
  } finally {
    loading.value = false
  }
}

// ---- 成长记录 ----
async function openGrowthDialog(pet: any) {
  currentPet.value = pet
  growthDialogVisible.value = true
  growthForm.content = ''
  growthForm.recordType = 'other'
  await loadGrowthRecords(pet._id)
}

async function loadGrowthRecords(adoptionId: string) {
  growthLoading.value = true
  try {
    const res = await getPetGrowthRecords(adoptionId) as any
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
  growthSubmitting.value = true
  try {
    await addPetGrowthRecord(currentPet.value._id, {
      content: text,
      recordType: growthForm.recordType,
    })
    ElMessage.success('记录已保存')
    growthForm.content = ''
    growthForm.recordType = 'other'
    await loadGrowthRecords(currentPet.value._id)
  } catch {
    ElMessage.error('保存失败，请稍后重试')
  } finally {
    growthSubmitting.value = false
  }
}

async function handleDeleteRecord(record: PetGrowthRecord) {
  try {
    await ElMessageBox.confirm('确定删除该记录吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deletePetGrowthRecord(record._id)
    ElMessage.success('已删除')
    await loadGrowthRecords(currentPet.value._id)
  } catch (err: any) {
    if (err && err !== 'cancel') ElMessage.error('删除失败')
  }
}

// ---- 聊天交流 ----
async function loadChat(catId: string) {
  chatLoading.value[catId] = true
  try {
    const res = await getPetChatMessages(catId) as any
    chatMessages.value[catId] = res?.data?.messages ?? []
  } catch {
    chatMessages.value[catId] = []
  } finally {
    chatLoading.value[catId] = false
  }
}

async function sendChat(pet: any) {
  const catId = pet.catId?._id
  if (!catId) return
  const text = (chatDraft.value[catId] || '').trim()
  if (!text) {
    ElMessage.warning('请输入交流内容')
    return
  }
  try {
    await sendPetChatMessage({ catId, content: text })
    chatDraft.value[catId] = ''
    await loadChat(catId)
    ElMessage.success('发送成功')
  } catch {
    ElMessage.error('发送失败，请稍后重试')
  }
}

async function handleDeleteChat(msg: PetChatMessage, catId: string) {
  try {
    await ElMessageBox.confirm('确定删除该消息吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deletePetChatMessage(msg._id)
    ElMessage.success('已删除')
    await loadChat(catId)
  } catch (err: any) {
    if (err && err !== 'cancel') ElMessage.error('删除失败')
  }
}

function getChatPreview(catId?: string) {
  if (!catId) return []
  return (chatMessages.value[catId] || []).slice(0, 5)
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

onMounted(loadPets)
</script>

<template>
  <div class="page">
    <h2>我的宠物</h2>

    <div v-if="loading" v-loading="true" style="min-height:200px"></div>
    <div v-else-if="!pets.length" class="empty">
      <ElEmpty description="暂无已领养的宠物" />
    </div>

    <div v-else class="list">
      <div v-for="p in pets" :key="p._id" class="item">
        <!-- 宠物信息行 -->
        <div class="pet-info-row">
          <div class="pet-info">
            <img v-if="p.catId?.avatar" :src="p.catId.avatar" class="pet-avatar" />
            <span class="pet-name">{{ p.catId?.name || '未命名' }}</span>
            <el-tag v-if="p.catId?.breed" size="small" type="info">{{ p.catId.breed }}</el-tag>
          </div>
          <div class="pet-actions">
            <el-button size="small" type="primary" @click="openGrowthDialog(p)">成长记录</el-button>
            <el-button size="small" type="warning" @click="goObservation(p.catId?._id)">观察报告</el-button>
            <el-button size="small" type="danger" @click="goIntervention(p.catId?._id)">请求干预</el-button>
            <el-button size="small" @click="goLocation(p.catId?._id)">查看位置</el-button>
          </div>
        </div>

        <!-- 交流面板 -->
        <div class="chat-panel">
          <div class="chat-title">交流记录（领养人 + 管理员）</div>
          <div class="chat-input-row">
            <el-input v-model="chatDraft[p.catId?._id || '']" placeholder="记录状态、交流养护经验..." @keyup.enter="sendChat(p)" />
            <el-button type="success" size="small" @click="sendChat(p)">发送</el-button>
          </div>

          <div v-if="chatLoading[p.catId?._id]" class="chat-loading">加载中...</div>
          <div v-else-if="getChatPreview(p.catId?._id).length" class="chat-list">
            <div v-for="msg in getChatPreview(p.catId?._id)" :key="msg._id" class="chat-item">
              <div class="chat-item-top">
                <span class="chat-sender">{{ msg.senderName }}</span>
                <el-tag v-if="msg.isImportant" type="danger" size="small">重要</el-tag>
                <span class="chat-time">{{ formatTime(msg.createdAt) }}</span>
                <el-button
                  v-if="auth.isAdmin || msg.senderId === auth.userId"
                  link type="danger" size="small"
                  @click="handleDeleteChat(msg, p.catId?._id)"
                >删除</el-button>
              </div>
              <div class="chat-content">{{ msg.content }}</div>
            </div>
          </div>
          <div v-else class="chat-empty">暂无交流内容，发一条试试</div>
        </div>
      </div>
    </div>

    <!-- 成长记录弹窗 -->
    <el-dialog v-model="growthDialogVisible" :title="`成长记录 - ${currentPet?.catId?.name || ''}`" width="700px" destroy-on-close>
      <div class="growth-form">
        <el-select v-model="growthForm.recordType" placeholder="记录类型" style="width: 140px">
          <el-option v-for="opt in recordTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-input v-model="growthForm.content" type="textarea" :rows="3" placeholder="记录宠物状态（体重、健康、行为、喂食等）..." style="flex:1" />
        <el-button type="primary" :loading="growthSubmitting" @click="submitGrowthRecord">保存记录</el-button>
      </div>

      <div class="growth-list" v-loading="growthLoading">
        <div v-if="!growthRecords.length" class="growth-empty">暂无记录</div>
        <div v-for="r in growthRecords" :key="r._id" class="growth-item">
          <div class="growth-item-top">
            <el-tag size="small" :type="r.recordType === 'health' ? 'danger' : 'info'">{{ recordTypeLabel(r.recordType) }}</el-tag>
            <span class="growth-recorder">{{ r.recorderName }}（{{ formatRole(r.recorderRole) }}）</span>
            <span class="growth-time">{{ formatTime(r.recordDate || r.createdAt) }}</span>
            <el-button
              v-if="auth.isAdmin || r.recorderId === auth.userId"
              link type="danger" size="small"
              @click="handleDeleteRecord(r)"
            >删除</el-button>
          </div>
          <div class="growth-content">{{ r.content }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
.empty { margin-top: 24px; }
.list { margin-top: 16px; }
.item { padding: 12px; border: 1px solid #ebeef5; border-radius: 8px; margin-bottom: 10px; }
.pet-info-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; gap: 8px; }
.pet-info { display: flex; align-items: center; gap: 12px; }
.pet-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.pet-name { font-weight: 500; font-size: 16px; }
.pet-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.chat-panel { background: #f7fbff; border: 1px solid #dceaf7; border-radius: 8px; padding: 10px; margin-top: 4px; }
.chat-title { font-size: 13px; font-weight: 600; color: #33608f; margin-bottom: 8px; }
.chat-input-row { display: flex; gap: 8px; }
.chat-loading { text-align: center; padding: 12px; color: #999; }
.chat-list { margin-top: 8px; display: grid; gap: 6px; }
.chat-item { background: #fff; border: 1px solid #e4edf7; border-radius: 8px; padding: 8px 10px; }
.chat-item-top { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.chat-sender { font-weight: 600; font-size: 13px; color: #33608f; }
.chat-time { font-size: 12px; color: #999; margin-left: auto; }
.chat-content { font-size: 13px; color: #4b5b6b; line-height: 1.6; white-space: pre-wrap; }
.chat-empty { margin-top: 8px; font-size: 12px; color: #8a99a8; }

/* 成长记录 */
.growth-form { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 16px; }
.growth-list { display: grid; gap: 8px; max-height: 350px; overflow: auto; }
.growth-empty { text-align: center; padding: 20px; color: #999; }
.growth-item { background: #fafafa; border: 1px solid #eee; border-radius: 8px; padding: 10px; }
.growth-item-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.growth-recorder { font-size: 13px; color: #666; }
.growth-time { font-size: 12px; color: #999; margin-left: auto; }
.growth-content { font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap; }

@media (max-width: 768px) {
  .page { padding: 16px; }
  .pet-info-row { flex-direction: column; align-items: flex-start; }
  .pet-actions { width: 100%; }
  .pet-actions .el-button { padding: 6px 10px; font-size: 12px; }
  .chat-input-row { flex-wrap: wrap; }
  .growth-form { flex-wrap: wrap; }
  .growth-form .el-select { width: 100% !important; }
}

@media (max-width: 480px) {
  .page { padding: 12px; }
  .pet-actions { gap: 4px; }
  .pet-actions .el-button { padding: 5px 8px; font-size: 11px; flex: 1; }
}
</style>
