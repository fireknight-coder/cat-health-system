<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElTable, ElTableColumn, ElButton, ElTag } from 'element-plus'
import { getAdoptionRequestList, approveAdoption, rejectAdoption } from '@/api/modules/adoption'
import { ElMessage } from 'element-plus'
import { getAdoptionRequestStatusLabel } from '@/stores/dictionary'
import type { AdoptionRequestItem } from '@/api/modules/adoption'

const router = useRouter()
const list = ref<AdoptionRequestItem[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    console.log('正在加载领养申请列表...')
    const res = await getAdoptionRequestList({ pageSize: 50 })
    console.log('API返回:', res)
    list.value = (res as any).data?.list ?? []
    console.log('列表数据:', list.value)
  } catch (e) {
    console.error('加载失败:', e)
    list.value = []
  } finally {
    loading.value = false
  }
}

async function handleApprove(id: string) {
  try {
    await approveAdoption(id)
    ElMessage.success('已批准')
    load()
  } catch {
    ElMessage.error('操作失败')
  }
}

onMounted(load)

async function handleReject(id: string) {
  try {
    await rejectAdoption(id)
    ElMessage.success('已拒绝')
    load()
  } catch {
    ElMessage.error('操作失败')
  }
}
</script>

<template>
  <div class="page">
    <h2>领养申请管理</h2>
    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="catId" label="猫咪" min-width="120">
        <template #default="{ row }">
          {{ row.catId?.name || row.catId || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="userId" label="申请人" min-width="100">
        <template #default="{ row }">
          {{ row.userId?.username || row.userId || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="联系电话" min-width="120" />
      <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'PENDING' ? 'warning' : row.status === 'APPROVED' ? 'success' : 'danger'">
            {{ getAdoptionRequestStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="success" @click="handleApprove(row._id)" v-if="row.status === 'PENDING'">
            批准
          </el-button>
          <el-button size="small" type="danger" @click="handleReject(row._id)" v-if="row.status === 'PENDING'">
            拒绝
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
    const res = await getAdoptionRequestList({ pageSize: 50 })
    console.log('领养申请返回:', res)