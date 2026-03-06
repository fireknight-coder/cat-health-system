<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElInput, ElMessage } from 'element-plus'
import { getCatById, updateCat } from '@/api/modules/cat'
import { createIntervention } from '@/api/modules/intervention'
import { getCatStatusLabel, isCatLocked } from '@/stores/dictionary'
import type { CatItem } from '@/api/modules/cat'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id as string)
const cat = ref<CatItem | null>(null)
const loading = ref(false)
const editName = ref('')
const locked = computed(() => cat.value && isCatLocked(cat.value.status as any))

async function load() {
  loading.value = true
  try {
    cat.value = await getCatById(id.value) as CatItem
    editName.value = cat.value.name ?? ''
  } catch {
    cat.value = null
  } finally {
    loading.value = false
  }
}

async function saveName() {
  if (!cat.value) return
  try {
    await updateCat(cat.value.id, { name: editName.value })
    cat.value = { ...cat.value, name: editName.value }
    ElMessage.success('已保存')
  } catch {
    ElMessage.error('保存失败')
  }
}

async function startIntervention() {
  if (!cat.value) return
  try {
    await createIntervention(cat.value.id)
    ElMessage.success('已发起干预工单')
    router.push('/admin/interventions')
  } catch {
    ElMessage.error('发起失败')
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <h2>猫档案 · {{ id }}</h2>
    <div v-if="loading" class="loading">加载中...</div>
    <template v-else-if="cat">
      <div v-if="locked" class="lock-banner">正在处理中：关键字段不可编辑，不可领养</div>
      <div class="section">
        <label>名字</label>
        <el-input v-model="editName" :disabled="locked" style="width: 200px" />
        <el-button v-if="!locked" type="primary" size="small" @click="saveName">保存</el-button>
      </div>
      <div class="section">
        <span>状态：</span>
        <strong>{{ getCatStatusLabel(cat.status as any) }}</strong>
      </div>
      <div class="section">
        <span>健康评分：{{ cat.healthScore ?? '-' }} 风险：{{ cat.riskLevel ?? '-' }}</span>
      </div>
      <div class="section" v-if="!locked">
        <el-button type="warning" @click="startIntervention">发起干预/抓捕/送医</el-button>
      </div>
      <el-button @click="router.push('/admin/cats')">返回列表</el-button>
    </template>
    <div v-else class="empty">未找到档案</div>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
.lock-banner { background: #fdf6ec; color: #e6a23c; padding: 8px 12px; border-radius: 4px; margin-bottom: 16px; }
.section { margin-bottom: 16px; }
.section label { margin-right: 8px; }
</style>
