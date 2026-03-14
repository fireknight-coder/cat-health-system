<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getDashboardStats } from '@/api/modules/dashboard'
import type { DashboardStats } from '@/api/modules/dashboard'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'

const auth = useAuthStore()
const isAdmin = computed(() => auth.role === 'admin')

const stats = ref<DashboardStats | null>(null)
const loading = ref(true)

// 管理员审核相关变量
// @ts-ignore - 在模板中使用
const showAdminReview = ref(false)
const pendingAdmins = ref<any[]>([])
// @ts-ignore - 在模板中使用
const pendingAdminsCount = computed(() => pendingAdmins.value.length)

// 获取待审核的管理员申请
async function fetchPendingAdmins() {
  if (!isAdmin.value) return
  
  try {
    const response = await fetch('http://localhost:3002/api/auth/pending-admins', {
      headers: {
        'Authorization': `Bearer ${auth.token}`
      }
    })
    const result = await response.json()
    
    if (result.success) {
      pendingAdmins.value = result.data.applicants
    }
  } catch (error) {
    console.error('获取待审核申请失败:', error)
  }
}

// 批准管理员申请
// @ts-ignore - 在模板中使用
async function approveAdmin(applicantId: string) {
  try {
    await ElMessageBox.confirm('确定要批准此管理员申请吗？', '确认批准')
    
    const response = await fetch('http://localhost:3002/api/auth/review-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      },
      body: JSON.stringify({
        applicantId,
        action: 'approve',
        comment: '申请已批准'
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      ElMessage.success('申请已批准')
      await fetchPendingAdmins() // 刷新列表
    } else {
      throw new Error(result.error)
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批准失败')
    }
  }
}

// 拒绝管理员申请
// @ts-ignore - 在模板中使用
async function rejectAdmin(applicantId: string) {
  try {
    const { value: comment } = await ElMessageBox.prompt('请输入拒绝理由', '拒绝申请', {
      confirmButtonText: '确认拒绝',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入拒绝理由...',
      inputValidator: (value) => {
        if (!value || value.trim().length === 0) {
          return '拒绝理由不能为空'
        }
        return true
      }
    })
    
    const response = await fetch('http://localhost:3002/api/auth/review-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      },
      body: JSON.stringify({
        applicantId,
        action: 'reject',
        comment: comment.trim()
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      ElMessage.success('申请已拒绝')
      await fetchPendingAdmins() // 刷新列表
    } else {
      throw new Error(result.error)
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '拒绝失败')
    }
  }
}

onMounted(async () => {
  try {
    const res = await getDashboardStats()
    const resData = res as any
    if (resData && resData.data) {
      stats.value = resData.data as DashboardStats
    }
    
    if (isAdmin.value) {
      await fetchPendingAdmins()
    }
  } catch {
    stats.value = null
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="dashboard-container">
    <h2>数据仪表盘</h2>
    
    <div v-if="loading" class="loading">
      数据加载中...
    </div>
    
    <div v-else-if="stats" class="stats-container">
      <div class="stat-card">
        <h3>猫咪统计</h3>
        <p>总猫咪数: {{ stats.totalCats || 0 }}</p>
        <p>健康猫咪: {{ stats.healthyCats || 0 }}</p>
        <p>可领养: {{ stats.adoptableCats || 0 }}</p>
      </div>
      
      <div class="stat-card">
        <h3>上报统计</h3>
        <p>总上报数: {{ stats.totalReports || 0 }}</p>
        <p>待审核: {{ stats.pendingReports || 0 }}</p>
      </div>
      
      <div class="stat-card">
        <h3>干预统计</h3>
        <p>总干预数: {{ stats.totalInterventions || 0 }}</p>
        <p>进行中: {{ stats.activeInterventions || 0 }}</p>
      </div>
      
      <div class="stat-card">
        <h3>领养统计</h3>
        <p>总申请数: {{ stats.totalAdoptions || 0 }}</p>
        <p>待审核: {{ stats.pendingAdoptions || 0 }}</p>
      </div>
    </div>
    
    <div v-else class="no-data">
      暂无数据
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  padding: 20px;
}
.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}
.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.stat-card h3 {
  margin-bottom: 15px;
  color: #333;
}
.stat-card p {
  margin: 8px 0;
  color: #666;
}
.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>