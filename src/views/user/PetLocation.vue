<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getLocationHistory } from '@/api/modules/device'
import { getAlerts } from '@/api/modules/device'

const route = useRoute()
const petId = computed(() => route.params.petId as string)
const points = ref<{ time: string; lat: number; lng: number }[]>([])
const alerts = ref<{ id: string; type: string; time: string; message: string }[]>([])

async function load() {
  try {
    const [loc, alt] = await Promise.all([
      getLocationHistory(petId.value),
      getAlerts(petId.value),
    ])
    points.value = (loc as { points: typeof points.value }).points ?? []
    alerts.value = (alt as { list: typeof alerts.value }).list ?? []
  } catch {
    points.value = []
    alerts.value = []
  }
}
load()
</script>

<template>
  <div class="page">
    <h2>位置与轨迹 · {{ petId }}</h2>
    <p class="tip">实时位置：最后一个上报点；历史轨迹：点序列（需后端接口）</p>
    <div v-if="points.length" class="points">
      <div v-for="(p, i) in points.slice(-5)" :key="i">{{ p.time }} ({{ p.lat }}, {{ p.lng }})</div>
    </div>
    <div v-else class="empty">暂无轨迹数据</div>
    <h3>异常告警</h3>
    <div v-if="alerts.length" class="alerts">
      <div v-for="a in alerts" :key="a.id">{{ a.time }} {{ a.message }}</div>
    </div>
    <div v-else>暂无告警</div>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
.tip { color: #909399; font-size: 12px; margin-bottom: 16px; }
.points, .alerts { font-size: 12px; }
.empty { color: #909399; }
</style>
