<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElTable, ElTableColumn, ElButton, ElTag } from 'element-plus'
import { getAdoptionRequestList } from '@/api/modules/adoption'
import { getAdoptionRequestStatusLabel } from '@/stores/dictionary'
import type { AdoptionRequestItem } from '@/api/modules/adoption'

const router = useRouter()
const list = ref<AdoptionRequestItem[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await getAdoptionRequestList({ pageSize: 50 })
    list.value = (res as { list: AdoptionRequestItem[] }).list ?? []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <h2>领养申请管理</h2>
    <p class="tip">管理员电话联系用户，在系统中记录联系日志与审批/回访</p>
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column prop="id" label="申请ID" width="120" />
      <el-table-column prop="catId" label="猫ID" width="100" />
      <el-table-column prop="phone" label="联系电话" width="120" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag>{{ getAdoptionRequestStatusLabel(row.status as any) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="提交时间" />
    </el-table>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
.tip { color: #909399; font-size: 12px; margin-bottom: 16px; }
</style>
