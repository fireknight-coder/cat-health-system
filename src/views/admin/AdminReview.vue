<!-- src/views/admin/AdminReview.vue -->
<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import request from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

// 定义申请数据类型
interface Application {
  id: string
  username: string
  email: string
  avatar?: string
  reason: string
  createdAt: string
  updatedAt: string
  status?: string
  isActive?: boolean
}

const auth = useAuthStore()
const isSuperAdmin = computed(() => auth.role === 'superadmin')

// 数据状态
const activeTab = ref('pending')
const showDetailDialog = ref(false)
const currentApplication = ref<Application | null>(null)

// 统计数据
const stats = reactive({
  pending: 0,
  approved: 0,
  rejected: 0,
  totalAdmins: 0,
  activeAdmins: 0,
  pendingChange: 0,
  approvalRate: 0,
  rejectionRate: 0
})

// 申请列表
const pendingApplications = ref<Application[]>([])
const approvedApplications = ref<Application[]>([])
const rejectedApplications = ref<Application[]>([])

// 导出数据方法
const exportData = () => {
  ElMessage.info('导出功能开发中...')
}

// 格式化日期方法
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 查看详情方法
const viewDetails = (application: any) => {
  currentApplication.value = application
  showDetailDialog.value = true
}

// 审核操作
const approveApplication = async (applicantId: string) => {
  try {
    const { value: comment } = await ElMessageBox.prompt('请输入批准意见', '批准申请', {
      confirmButtonText: '确认批准',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入批准意见（可选）...'
    })

    const result = await request.post('/auth/review-admin', {
      applicantId,
      action: 'approve',
      comment: comment || '申请已批准'
    })

    if (result.success) {
      ElMessage.success('申请已批准')
      await refreshData()
    } else {
      ElMessage.error(result.error || '批准失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批准失败')
    }
  }
}

const rejectApplication = async (applicantId: string) => {
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

    const response = await fetch(`http://localhost:3002/api/auth/review-admin`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      },
      body: JSON.stringify({
        action: 'reject',
        comment: comment.trim()
      })
    })

    const result = await response.json()
    
    if (result.success) {
      ElMessage.success('申请已拒绝')
      await refreshData()
    } else {
      ElMessage.error(result.error || '拒绝失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('拒绝失败')
    }
  }
}

// 数据操作
const refreshData = async () => {
  if (!isSuperAdmin.value) return

  try {
    // 获取待审核申请
    const pendingResponse = await fetch('http://localhost:3002/api/auth/pending-admins', {
      headers: { 'Authorization': `Bearer ${auth.token}` }
    })
    
    if (!pendingResponse.ok) {
      throw new Error(`HTTP error! status: ${pendingResponse.status}`)
    }
    
    const pendingResult = await pendingResponse.json()
    
    if (pendingResult.success) {
      pendingApplications.value = pendingResult.data.applicants || []
      stats.pending = pendingResult.data.count || 0
      
      // 更新统计数据
      stats.approved = 0 // 这里需要从后端获取已批准的数量
      stats.rejected = 0 // 这里需要从后端获取已拒绝的数量
      stats.totalAdmins = 0 // 这里需要从后端获取总管理员数量
      stats.pendingChange = 0
      stats.approvalRate = 0
      stats.rejectionRate = 0
      stats.activeAdmins = 0
      
      console.log('🔍 获取到的待审核申请:', pendingResult.data)
    } else {
      console.error('获取待审核申请失败:', pendingResult.error)
      ElMessage.error('获取申请列表失败')
    }

  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('获取数据失败，请检查网络连接')
  }
}

// 获取审核人姓名
const getReviewerName = (reviewerId: string) => {
  // 这里需要根据reviewerId获取审核人姓名
  return '系统管理员'
}

onMounted(() => {
  if (isSuperAdmin.value) {
    refreshData()
  }
})
</script>

<template>
  <div class="admin-review-page">
    <div class="page-header">
      <h2>🛡️ 超级管理员审核中心</h2>
      <div class="header-actions">
        <el-button type="primary" @click="refreshData">🔄 刷新数据</el-button>
        <el-button type="info" @click="exportData">📊 导出数据</el-button>
      </div>
    </div>

    <!-- 统计面板 -->
    <el-row :gutter="16" class="stats-panel">
      <el-col :span="6">
        <el-card class="stat-card primary">
          <div class="stat-content">
            <span class="stat-number">{{ stats.pending }}</span>
            <span class="stat-label">待审核申请</span>
          </div>
          <div class="stat-trend">📈 较昨日: +{{ stats.pendingChange }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card success">
          <div class="stat-content">
            <span class="stat-number">{{ stats.approved }}</span>
            <span class="stat-label">已批准</span>
          </div>
          <div class="stat-trend">✅ 通过率: {{ stats.approvalRate }}%</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card warning">
          <div class="stat-content">
            <span class="stat-number">{{ stats.rejected }}</span>
            <span class="stat-label">已拒绝</span>
          </div>
          <div class="stat-trend">📉 拒绝率: {{ stats.rejectionRate }}%</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card info">
          <div class="stat-content">
            <span class="stat-number">{{ stats.totalAdmins }}</span>
            <span class="stat-label">总管理员</span>
          </div>
          <div class="stat-trend">👥 活跃: {{ stats.activeAdmins }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 审核操作面板 -->
    <el-card class="review-panel">
      <template #header>
        <div class="panel-header">
          <span>📋 申请审核列表</span>
          <el-button-group>
            <el-button 
              :type="activeTab === 'pending' ? 'primary' : ''"
              @click="activeTab = 'pending'"
            >
              待审核 ({{ pendingApplications.length }})
            </el-button>
            <el-button 
              :type="activeTab === 'approved' ? 'success' : ''"
              @click="activeTab = 'approved'"
            >
              已批准 ({{ approvedApplications.length }})
            </el-button>
            <el-button 
              :type="activeTab === 'rejected' ? 'warning' : ''"
              @click="activeTab = 'rejected'"
            >
              已拒绝 ({{ rejectedApplications.length }})
            </el-button>
          </el-button-group>
        </div>
      </template>

      <!-- 申请列表 -->
      <div v-if="activeTab === 'pending' && pendingApplications.length === 0" class="empty-state">
        <el-empty description="暂无待审核申请" />
      </div>

      <div v-else-if="activeTab === 'pending'" class="applications-list">
        <div v-for="app in pendingApplications" :key="app._id" class="application-item">
          <div class="applicant-info">
            <div class="applicant-header">
              <el-avatar :size="40" :src="app.avatar || '/default-avatar.png'"></el-avatar>
              <div class="applicant-details">
                <h4>{{ app.username }}</h4>
                <p class="applicant-meta">
                  📧 {{ app.email }} • 📅 {{ formatDate(app.createdAt) }}
                </p>
              </div>
            </div>
            <div class="application-reason">
              <strong>申请理由:</strong>
              <p>{{ app.reason }}</p>
            </div>
          </div>
          
          <div class="review-actions">
            <el-button type="success" @click="approveApplication(app._id)" size="small">
              ✅ 批准
            </el-button>
            <el-button type="danger" @click="rejectApplication(app._id)" size="small">
              ❌ 拒绝
            </el-button>
            <el-button type="info" @click="viewDetails(app)" size="small">
              🔍 详情
            </el-button>
          </div>
        </div>
      </div>

      <!-- 审核历史 -->
      <div v-else class="history-list">
        <el-timeline>
          <el-timeline-item 
            v-for="item in (activeTab === 'approved' ? approvedApplications : rejectedApplications)"
            :key="item.id"
            :timestamp="formatDate(item.updatedAt)"
            :type="activeTab === 'approved' ? 'success' : 'danger'"
          >
            <el-card>
              <p><strong>{{ item.username }}</strong> ({{ item.email }})</p>
              <p>申请理由: {{ item.reason }}</p>
              <p>审核时间: {{ formatDate(item.updatedAt) }}</p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-card>

    <!-- 申请详情弹窗 -->
    <el-dialog v-model="showDetailDialog" title="申请详情" width="600px">
      <div v-if="currentApplication" class="application-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户名">{{ currentApplication.username }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ currentApplication.email }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ formatDate(currentApplication.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="申请理由">
            <p style="white-space: pre-wrap;">{{ currentApplication.reason }}</p>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.admin-review-page {
  min-height: 100vh;
  background: #f0f2f5;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-header h2 {
  margin: 0;
  color: #1f2d3d;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 统计面板样式 */
.stats-panel {
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-card.primary {
  border-left: 4px solid #409eff;
}

.stat-card.success {
  border-left: 4px solid #67c23a;
}

.stat-card.warning {
  border-left: 4px solid #e6a23c;
}

.stat-card.info {
  border-left: 4px solid #909399;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #1f2d3d;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.stat-trend {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

/* 审核面板样式 */
.review-panel {
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}

/* 申请列表样式 */
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #909399;
}

.applications-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.application-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.application-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.applicant-info {
  flex: 1;
}

.applicant-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.applicant-details h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #1f2d3d;
}

.applicant-meta {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.application-reason {
  margin-top: 12px;
}

.application-reason strong {
  color: #606266;
  font-size: 14px;
}

.application-reason p {
  margin: 8px 0 0 0;
  color: #1f2d3d;
  line-height: 1.5;
  background: #fff;
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.review-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 审核历史样式 */
.history-list {
  padding: 20px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-review-page {
    padding: 12px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .application-item {
    flex-direction: column;
    gap: 16px;
  }
  
  .review-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 0;
  color: #909399;
}

/* 错误状态 */
.error-state {
  text-align: center;
  padding: 60px 0;
  color: #f56c6c;
}

.error-state .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
</style>