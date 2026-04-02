<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElTable, ElTableColumn, ElButton, ElTag, ElEmpty } from 'element-plus'
import { getInterventionList } from '@/api/modules/intervention'
import { getInterventionStatusLabel } from '@/stores/dictionary'

const router = useRouter()
const list = ref<any[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await getInterventionList({ pageSize: 50 })
    list.value = (res as any).data?.list ?? []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function goDetail(id: string) {
  router.push(`/user/interventions/${id}`)
}

onMounted(load)
</script>

<template>
  <div class="page">
    <h2>我的干预请求</h2>
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column prop="catId" label="猫咪" width="120">
        <template #default="{ row }">
          {{ (row as any).catId?.name || row.catId }}
        </template>
      </el-table-column>
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag>{{ getInterventionStatusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="createdAt" label="创建时间" width="180" />
      <el-table-column label="操作" width="80">
        <template #default="{ row }">
          <el-button type="primary" link @click="goDetail((row as any)._id || row.id)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && !list.length" description="暂无干预请求" />
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
</style>