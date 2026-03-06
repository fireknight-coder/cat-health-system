<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElTable, ElTableColumn, ElButton, ElTag } from 'element-plus'
import { getCatList } from '@/api/modules/cat'
import { getCatStatusLabel } from '@/stores/dictionary'
import type { CatItem } from '@/api/modules/cat'

const router = useRouter()
const list = ref<CatItem[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await getCatList({ pageSize: 100 })
    list.value = (res as { list: CatItem[] }).list ?? []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function goDetail(id: string) {
  router.push({ name: 'CatDetail', params: { id } })
}

onMounted(load)
</script>

<template>
  <div class="page">
    <h2>猫档案列表</h2>
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="name" label="名字" width="120" />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag>{{ getCatStatusLabel(row.status as any) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="healthScore" label="健康分" width="80" />
      <el-table-column label="操作" width="80">
        <template #default="{ row }">
          <el-button type="primary" link @click="goDetail(row.id)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
</style>
