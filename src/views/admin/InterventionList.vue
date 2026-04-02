<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElTable, ElTableColumn, ElButton, ElTag } from 'element-plus'
import { getInterventionList } from '@/api/modules/intervention'
import { getInterventionStatusLabel } from '@/stores/dictionary'
import type { InterventionItem } from '@/api/modules/intervention'

const router = useRouter()
const list = ref<InterventionItem[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await getInterventionList({ pageSize: 50 })
    list.value = (res as any).data?.list ?? (res as any).list ?? []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function goDetail(id: string) {
  router.push(`/admin/interventions/${id}`)
}

onMounted(load)
</script>

<template>
  <div class="page">
    <h2>干预工单</h2>
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column prop="id" label="工单ID" width="120" />
      <el-table-column label="猫咪" width="150">
        <template #default="{ row }">
          {{ row.catId?.name || row.catId || '未命名' }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag>{{ getInterventionStatusLabel(row.status as any) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" />
      <el-table-column label="操作" width="80">
        <template #default="{ row }">
          <el-button type="primary" link @click="goDetail((row as any)._id || row.id)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
    
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
</style>