<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElCard, ElButton, ElTable, ElTableColumn, ElTag, ElMessage } from 'element-plus'

const loading = ref(false)
const feedingData = ref<any[]>([])

async function loadFeedingData() {
  loading.value = true
  try {
    // 这里可以调用后端接口获取投喂数据
    feedingData.value = [
      {
        id: '1',
        location: 'A区投喂点',
        catCount: 3,
        feedingTime: '2026-03-23 08:30',
        status: '正常'
      },
      {
        id: '2',
        location: 'B区投喂点',
        catCount: 0,
        feedingTime: '2026-03-23 08:45',
        status: '异常'
      }
    ]
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadFeedingData()
})
</script>

<template>
  <div class="page">
    <h2>🐟 定点投喂检测</h2>
    
    <el-card class="info-card">
      <template #header>
        <span>投喂点统计</span>
        <el-button type="primary" size="small" style="float: right" class="refreshdata">刷新数据</el-button>
      </template>
      
      <el-table v-loading="loading" :data="feedingData" stripe>
        <el-table-column prop="location" label="投喂点" min-width="120" />
        <el-table-column prop="catCount" label="猫咪数量" min-width="100">
          <template #default="{ row }">
            <span :class="{ 'warning': row.catCount === 0 }">{{ row.catCount }}只</span>
          </template>
        </el-table-column>
        <el-table-column prop="feedingTime" label="投喂时间" min-width="140" />
        <el-table-column prop="status" label="状态" min-width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === '正常' ? 'success' : 'danger'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="100">
          <template #default>
            <el-button type="primary" link class="details">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <div class="placeholder-section">
      <p>这里可以添加摄像头监控、投喂记录、异常报警等功能</p>
    </div>
  </div>
</template>

<style scoped>
.page { 
    background: #fff; 
    padding: 24px; 
    border-radius: 8px; }
.info-card { 
    margin-bottom: 16px; 
}
.warning { 
    color: #e6a23c; 
    font-weight: bold; 
}
.placeholder-section { 
  text-align: center; 
  padding: 40px; 
  color: #909399; 
  background: #f5f7fa;
  border-radius: 8px;
}
.details { 
  font-size: 14px; 
  color: #e6a23c;
}
.refreshdata { 
  font-size: 14px; 
  background-color: #e6a23c;
  border-color: #e6a23c;
  color: #fff;

}
</style>