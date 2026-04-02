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
    console.log('正在获取待审核上报列表...')
    const res = await getReportList({ status: 'PENDING_REVIEW', pageSize: 50 })
    console.log('API响应:', res)
    const resData = res as any
    list.value = resData?.data?.list ?? resData?.list ?? []
    console.log('列表数据:', list.value)
  } catch (e: any) {
    console.error('获取列表失败:', e)
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
      <el-table-column label="用户名称" width="120">
        <template #default="{ row }">
          {{ row.reporterId?.username || row.reporterId || '-' }}
        </template>
      </el-table-column>
      
      <el-table-column prop="reportedAt" label="上报时间" width="160" />
      <el-table-column prop="address" label="位置" />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag class="state">{{ getReportStatusLabel(row.status as any) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button type="primary" link @click="goReview(row.id)" class="review-btn">审核</el-button>
        </template>
      </el-table-column>
    </el-table>
    
  </div>
</template>

<style scoped>
.page { 
  background: #fff; 
  padding: 24px; 
  border-radius: 8px; }
.state{
  color: #fff;
  background-color: #e6a23c;
  border-color: #a77d3d;
}
.review-btn{
  background-color: #e6a23c !important;
  border-color: #a77d3d !important;
  color: #fff !important;
  font-size: 15px;
}

/* 鼠标悬停时的颜色 */
.review-btn:hover {
  background-color: #a85700 !important;
  border-color: #8e6b2e !important;
}

/* 点击时的颜色 */
.review-btn:active {
  background-color: #ffecd7 !important;
  border-color: #745826 !important;
}

/* 获得焦点时的颜色 */
.review-btn:focus {
  background-color: #d48835 !important;
  border-color: #8e6b2e !important;
  box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.2) !important;
}
</style>