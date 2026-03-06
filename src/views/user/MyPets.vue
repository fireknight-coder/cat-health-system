<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElEmpty } from 'element-plus'

const router = useRouter()
const pets = ref<{ id: string; name: string }[]>([])

function goBind() {
  router.push({ name: 'DeviceBind' })
}
function goLocation(petId: string) {
  router.push({ name: 'PetLocation', params: { petId } })
}
</script>

<template>
  <div class="page">
    <h2>我的宠物</h2>
    <el-button type="primary" @click="goBind">绑定项圈</el-button>
    <div v-if="!pets.length" class="empty">
      <el-empty description="暂无已绑定宠物，领养后可在此绑定项圈" />
    </div>
    <div v-else class="list">
      <div v-for="p in pets" :key="p.id" class="item">
        <span>{{ p.name }}</span>
        <el-button size="small" @click="goLocation(p.id)">查看位置</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
.empty { margin-top: 24px; }
.list { margin-top: 16px; }
.item { display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1px solid #ebeef5; border-radius: 8px; margin-bottom: 8px; }
</style>
