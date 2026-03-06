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
    intervention.value = await getInterventionById(id.value) as InterventionItem
  } catch {
    intervention.value = null
  } finally {
    loading.value = false
  }
}

async function setDone() {
  if (!intervention.value) return
  try {
    await updateInterventionStatus(intervention.value.id, 'DONE', { remark: resultRemark.value })
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
    <h2>干预工单 · {{ id }}</h2>
    <div v-if="loading" class="loading">加载中...</div>
    <template v-else-if="intervention">
      <p>猫ID：{{ intervention.catId }}</p>
      <p>状态：{{ getInterventionStatusLabel(intervention.status as any) }}</p>
      <p>创建时间：{{ intervention.createdAt }}</p>
      <div v-if="intervention.status !== 'DONE'" class="section">
        <el-input v-model="resultRemark" type="textarea" rows="2" placeholder="处理结果备注" />
        <el-button type="primary" @click="setDone">结案</el-button>
      </div>
    </template>
    <div v-else class="empty">未找到工单</div>
    <el-button @click="router.push('/admin/interventions')">返回列表</el-button>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
.section { margin: 16px 0; }
</style>
