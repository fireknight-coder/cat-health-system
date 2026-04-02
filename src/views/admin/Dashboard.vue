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
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">ADMIN OVERVIEW</p>
        <h2>管理员工作统计</h2>
        <p class="hero-sub">把分散的巡检、审核和领养数据聚合成今天的行动重点。</p>
      </div>
      <div v-if="stats" class="hero-brief">
        <div class="brief-item">
          <span>待审核上报</span>
          <strong>{{ stats.pendingReports || 0 }}</strong>
        </div>
        <div class="brief-item">
          <span>进行中干预</span>
          <strong>{{ stats.activeInterventions || 0 }}</strong>
        </div>
        <div class="brief-item">
          <span>管理员申请</span>
          <strong>{{ pendingAdminsCount }}</strong>
        </div>
      </div>
    </section>
    
    <div v-if="loading" class="loading">
      数据加载中...
    </div>
    
    <div v-else-if="stats" class="stats-container">
      <article class="stat-card tone-cat">
        <div class="card-head">
          <h3>猫咪档案</h3>
          <span class="chip">实时</span>
        </div>
        <div class="metric-list">
          <div class="metric-row"><span>总猫咪数</span><strong>{{ stats.totalCats || 0 }}</strong></div>
          <div class="metric-row"><span>健康猫咪</span><strong>{{ stats.healthyCats || 0 }}</strong></div>
          <div class="metric-row"><span>可领养</span><strong>{{ stats.adoptableCats || 0 }}</strong></div>
        </div>
      </article>

      <article class="stat-card tone-report">
        <div class="card-head">
          <h3>上报审核</h3>
          <span class="chip">关键</span>
        </div>
        <div class="metric-list">
          <div class="metric-row"><span>总上报数</span><strong>{{ stats.totalReports || 0 }}</strong></div>
          <div class="metric-row"><span>待审核</span><strong>{{ stats.pendingReports || 0 }}</strong></div>
        </div>
      </article>

      <article class="stat-card tone-intervention">
        <div class="card-head">
          <h3>干预工单</h3>
          <span class="chip">追踪</span>
        </div>
        <div class="metric-list">
          <div class="metric-row"><span>总干预数</span><strong>{{ stats.totalInterventions || 0 }}</strong></div>
          <div class="metric-row"><span>进行中</span><strong>{{ stats.activeInterventions || 0 }}</strong></div>
        </div>
      </article>

      <article class="stat-card tone-adoption">
        <div class="card-head">
          <h3>领养申请</h3>
          <span class="chip">关注</span>
        </div>
        <div class="metric-list">
          <div class="metric-row"><span>总申请数</span><strong>{{ stats.totalAdoptions || 0 }}</strong></div>
          <div class="metric-row"><span>待审核</span><strong>{{ stats.pendingAdoptions || 0 }}</strong></div>
        </div>
      </article>
    </div>
    
    <div v-else class="no-data">
      暂无数据
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  padding: 8px;
  display: grid;
  gap: 16px;
}

.hero {
  border-radius: 20px;
  border: 1px solid #ead9c5;
  background:
    radial-gradient(circle at 85% 16%, rgba(255, 227, 188, 0.55), transparent 35%),
    linear-gradient(140deg, #fffaf2 0%, #f6ebdd 55%, #f1dfcb 100%);
  box-shadow: 0 14px 30px rgba(120, 84, 51, 0.13);
  padding: 20px;
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
}

.hero-copy {
  min-width: 0;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #9b7759;
  font-weight: 700;
}

.hero h2 {
  margin: 0;
  color: #4f3725;
  font-size: 30px;
}

.hero-sub {
  margin: 10px 0 0;
  color: #7a5f47;
  line-height: 1.7;
}

.hero-brief {
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid #e8d8c4;
  padding: 10px;
  display: grid;
  gap: 8px;
}

.brief-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 10px;
  border: 1px solid #f0e4d6;
  background: #fffaf3;
  padding: 8px 10px;
  color: #715740;
}

.brief-item strong {
  font-size: 20px;
  color: #523a28;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}

.stat-card {
  border-radius: 16px;
  border: 1px solid #ecdcc7;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 10px 24px rgba(117, 82, 50, 0.12);
  padding: 14px;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(117, 82, 50, 0.18);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.card-head h3 {
  margin: 0;
  color: #553d2c;
  font-size: 20px;
}

.chip {
  border-radius: 999px;
  border: 1px solid #e7ccad;
  background: #ffefd8;
  color: #8e633f;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
}

.metric-list {
  display: grid;
  gap: 8px;
}

.metric-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 10px;
  background: #fffaf2;
  border: 1px solid #f0e4d5;
  padding: 8px 10px;
  color: #6b513a;
}

.metric-row strong {
  font-size: 20px;
  color: #503726;
}

.tone-cat {
  background:
    radial-gradient(circle at 90% 8%, rgba(255, 232, 203, 0.65), transparent 36%),
    rgba(255, 255, 255, 0.86);
}

.tone-report {
  background:
    radial-gradient(circle at 90% 10%, rgba(251, 217, 188, 0.58), transparent 34%),
    rgba(255, 255, 255, 0.86);
}

.tone-intervention {
  background:
    radial-gradient(circle at 88% 8%, rgba(232, 231, 205, 0.58), transparent 36%),
    rgba(255, 255, 255, 0.86);
}

.tone-adoption {
  background:
    radial-gradient(circle at 90% 10%, rgba(244, 220, 199, 0.62), transparent 38%),
    rgba(255, 255, 255, 0.86);
}

.loading, .no-data {
  text-align: center;
  padding: 56px 12px;
  color: #8e7257;
  border-radius: 16px;
  border: 1px dashed #e7d5bf;
  background: rgba(255, 250, 242, 0.74);
}

@media (max-width: 960px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .hero h2 {
    font-size: 25px;
  }
}

@media (max-width: 640px) {
  .dashboard-container {
    padding: 4px;
  }

  .hero {
    padding: 14px;
  }

  .metric-row strong,
  .brief-item strong {
    font-size: 18px;
  }
}
</style>