<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElMessage, ElInput } from 'element-plus'
import { getInterventionById, updateInterventionStatus } from '@/api/modules/intervention'
import { getInterventionStatusLabel } from '@/stores/dictionary'
import type { InterventionItem } from '@/api/modules/intervention'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id as string)
const intervention = ref<InterventionItem | null>(null)
const loading = ref(false)
const resultRemark = ref('')

async function load() {
  loading.value = true
  try {
    const res = await getInterventionById(id.value)
    intervention.value = (res as any).data ?? res
  } catch {
    intervention.value = null
  } finally {
    loading.value = false
  }
}

async function setDone() {
  if (!intervention.value) return
  const intId = (intervention.value as any)._id || intervention.value.id
  try {
    await updateInterventionStatus(intId, 'DONE', { remark: resultRemark.value })
    ElMessage.success('已结案')
    load()
  } catch {
    ElMessage.error('操作失败')
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
<h2 v-if="intervention">干预工单 · 申请人: {{ (intervention as any).createdBy?.username || '-' }} ({{ (intervention as any).createdBy?._id || id }})</h2>
<h2 v-else>加载中...</h2>
    <div v-if="loading" class="loading">加载中...</div>
    <template v-else-if="intervention">
    <div v-if="(intervention as any).catId" class="cat-info">
      <p>电话：{{ (intervention as any).createdBy?.phone || '-' }}</p>
      <p>猫咪ID：{{ (intervention as any).catId._id }}</p>
      <p>猫咪名字：{{ (intervention as any).catId.name }}</p>
      <img v-if="(intervention as any).catId.avatar" :src="(intervention as any).catId.avatar" style="width:100px;height:100px;object-fit:cover;border-radius:8px" />
    </div>
      <p>状态：{{ getInterventionStatusLabel(intervention.status as any) }}</p>
      <p>创建时间：{{ intervention.createdAt }}</p>
      <p v-if="(intervention as any).description">描述：{{ (intervention as any).description }}</p>
      <div v-if="(intervention as any).outcome" class="result-section">
        <h4>处理结果</h4>
        <p>{{ (intervention as any).outcome }}</p>
      </div>
      <div v-if="(intervention as any).replies?.length" class="replies-section">
        <h4>回复记录</h4>
        <div v-for="(reply, idx) in (intervention as any).replies" :key="idx" class="reply-item">
          <p>{{ reply.content }}</p>
          <span class="reply-time">{{ reply.createdAt }}</span>
        </div>
      </div>
      <div v-if="intervention.status !== 'completed'" class="section">
        <el-input v-model="resultRemark" type="textarea" :rows="2" placeholder="处理结果备注" />
        <el-button type="primary" @click="setDone">结案</el-button>
      </div>
    </template>
    <div v-else class="empty">未找到工单</div>
    <el-button @click="router.push('/admin/interventions')">返回列表</el-button>
  </div>
</template>

<style scoped>
.page { background: #fff; 
  padding: 24px; 
  border-radius: 8px; }
.section { 
  margin: 16px 0; 
}
.result-section, .replies-section { 
  margin: 16px 0; 
  padding: 12px; 
  background: #f5f7fa; 
  border-radius: 8px; }
.result-section h4, .replies-section h4 { 
  margin: 0 0 8px 0; 
}
.reply-item { 
  padding: 8px 0; 
  border-bottom: 1px solid #eee; 
}
.reply-item:last-child { 
  border-bottom: none; 
}
.reply-time { 
  font-size: 12px; 
  color: #999; }
</style>