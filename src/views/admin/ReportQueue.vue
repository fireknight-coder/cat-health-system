<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElTable, ElTableColumn, ElButton, ElTag } from 'element-plus'
import { getReportList } from '@/api/modules/report'
import { getReportStatusLabel } from '@/stores/dictionary'
import type { ReportItem } from '@/api/modules/report'

const router = useRouter()
const list = ref<ReportItem[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await getReportList({ status: 'PENDING_REVIEW', pageSize: 50 })
    list.value = (res as { list: ReportItem[] }).list ?? []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function goReview(id: string) {
  router.push({ name: 'ReportReview', params: { id } })
}

onMounted(load)
</script>

<template>
  <div class="page">
    <h2>上报审核队列</h2>
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="reportedAt" label="上报时间" width="160" />
      <el-table-column prop="address" label="位置" />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag>{{ getReportStatusLabel(row.status as any) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button type="primary" link @click="goReview(row.id)">审核</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
</style>
