<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getDashboardStats } from '@/api/modules/dashboard'
import type { DashboardStats } from '@/api/modules/dashboard'

const stats = ref<DashboardStats | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await getDashboardStats()
    stats.value = res as DashboardStats
  } catch {
    stats.value = null
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">
    <h2>数据仪表盘</h2>
    <div v-if="loading" class="loading">加载中...</div>
    <template v-else-if="stats">
      <div class="blocks">
        <div class="block">
          <h3>规模与变化</h3>
          <p>在库数量：{{ stats.scale?.totalCats ?? '-' }}</p>
          <p>近7天新增：{{ stats.scale?.newLast7d ?? '-' }}</p>
          <p>近7天消失/迁移：{{ stats.scale?.goneLast7d ?? '-' }}</p>
        </div>
        <div class="block">
          <h3>健康与风险</h3>
          <p>高风险数：{{ stats.health?.highRiskCount ?? '-' }}</p>
          <p>疑似传染风险数：{{ stats.health?.contagiousRiskCount ?? '-' }}</p>
        </div>
        <div class="block">
          <h3>闭环效率</h3>
          <p>干预：待处理 {{ stats.efficiency?.interventions?.open ?? '-' }} / 处理中 {{ stats.efficiency?.interventions?.inProgress ?? '-' }} / 已结案 {{ stats.efficiency?.interventions?.done ?? '-' }}</p>
          <p>领养漏斗：提交 {{ stats.efficiency?.adoptionFunnel?.submitted ?? '-' }} → 通过 {{ stats.efficiency?.adoptionFunnel?.approved ?? '-' }} → 回访完成 {{ stats.efficiency?.adoptionFunnel?.followUpDone ?? '-' }}（回访率 {{ stats.efficiency?.adoptionFunnel?.followUpRate ?? '-' }}）</p>
        </div>
        <div class="block">
          <h3>时空分布</h3>
          <p>热区与重点区域（需地图与后端数据）</p>
        </div>
      </div>
    </template>
    <div v-else class="empty">暂无数据</div>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
.loading, .empty { padding: 24px; }
.blocks { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 16px; }
.block { border: 1px solid #ebeef5; border-radius: 8px; padding: 16px; }
.block h3 { margin: 0 0 12px 0; font-size: 14px; }
.block p { margin: 4px 0; font-size: 13px; }
</style>
