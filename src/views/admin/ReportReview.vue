<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElMessage, ElInput } from 'element-plus'
import { getReportById, approveMatchExisting, approveNewCat, rejectReport } from '@/api/modules/report'
import { getCatList } from '@/api/modules/cat'
import type { ReportItem } from '@/api/modules/report'
import type { CatItem } from '@/api/modules/cat'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id as string)
const report = ref<ReportItem | null>(null)
const catOptions = ref<CatItem[]>([])
const selectedCatId = ref('')
const rejectReason = ref('')
const loading = ref(false)
const actionLoading = ref(false)

async function loadReport() {
  loading.value = true
  try {
    report.value = await getReportById(id.value) as ReportItem
  } catch {
    report.value = null
  } finally {
    loading.value = false
  }
}

async function loadCats() {
  try {
    const res = await getCatList({ pageSize: 200 })
    catOptions.value = (res as { list: CatItem[] }).list ?? []
  } catch {
    catOptions.value = []
  }
}

async function handleMatchExisting() {
  if (!selectedCatId.value) {
    ElMessage.warning('请选择要绑定的老猫')
    return
  }
  actionLoading.value = true
  try {
    await approveMatchExisting(id.value, selectedCatId.value)
    ElMessage.success('已绑定老猫')
    router.push('/admin/reports')
  } catch {
    ElMessage.error('操作失败')
  } finally {
    actionLoading.value = false
  }
}

async function handleNewCat() {
  actionLoading.value = true
  try {
    await approveNewCat(id.value)
    ElMessage.success('已建档新猫')
    router.push('/admin/reports')
  } catch {
    ElMessage.error('操作失败')
  } finally {
    actionLoading.value = false
  }
}

async function handleReject() {
  actionLoading.value = true
  try {
    await rejectReport(id.value, rejectReason.value)
    ElMessage.success('已驳回')
    router.push('/admin/reports')
  } catch {
    ElMessage.error('操作失败')
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  loadReport()
  loadCats()
})
</script>

<template>
  <div class="page">
    <h2>审核上报 · {{ id }}</h2>
    <div v-if="loading" class="loading">加载中...</div>
    <template v-else-if="report">
      <div class="section">
        <h3>上报信息</h3>
        <p>时间：{{ report.reportedAt }} 位置：{{ report.address || '-' }}</p>
        <p>AI 健康评分：{{ report.healthScore ?? '-' }} 风险：{{ report.riskLevel ?? '-' }}</p>
      </div>
      <div class="section">
        <h3>AI 相似猫 Top-K</h3>
        <div v-if="report.aiTopK?.length" class="topk">
          <div v-for="(c, i) in report.aiTopK" :key="c.catId" class="item">
          <router-link :to="{ name: 'CatDetail', params: { id: c.catId } }">候选{{ i + 1 }}：{{ c.catId }}</router-link>
          相似度 {{ c.similarity }}
        </div>
        </div>
        <p v-else>无候选</p>
      </div>
      <div class="section actions">
        <h3>审核结论</h3>
        <div class="row">
          <label>老猫绑定：</label>
          <select v-model="selectedCatId" class="select">
            <option value="">请选择</option>
            <option v-for="c in catOptions" :key="c.id" :value="c.id">{{ c.name || c.id }}</option>
          </select>
          <el-button type="primary" :loading="actionLoading" @click="handleMatchExisting">确认为老猫</el-button>
        </div>
        <div class="row">
          <el-button type="success" :loading="actionLoading" @click="handleNewCat">确认为新猫并建档</el-button>
        </div>
        <div class="row">
          <el-input v-model="rejectReason" placeholder="驳回原因（选填）" style="width: 200px; margin-right: 8px" />
          <el-button type="danger" :loading="actionLoading" @click="handleReject">驳回</el-button>
        </div>
      </div>
    </template>
    <div v-else class="empty">未找到该上报</div>
    <el-button @click="router.push('/admin/reports')">返回列表</el-button>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
.section { margin-bottom: 24px; }
.section h3 { margin: 0 0 8px 0; font-size: 14px; }
.topk { display: flex; flex-wrap: wrap; gap: 8px; }
.item { padding: 4px 8px; background: #f5f7fa; border-radius: 4px; font-size: 12px; }
.actions .row { margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.select { padding: 4px 8px; min-width: 120px; }
</style>
