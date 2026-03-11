<script setup lang="ts">
// @ts-nocheck
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
    list.value = (res as any).list ?? []
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
    <!-- 模板内容 -->
  </div>
</template>