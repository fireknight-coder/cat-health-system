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

// 格式化日期
// @ts-ignore - 在模板中使用
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('zh-CN')
}

onMounted(async () => {
  try {
    const res = await getDashboardStats()
    // 修复类型转换错误：Axios响应对象包含data属性
    stats.value = res.data as DashboardStats
    
    // 如果是管理员，获取待审核申请
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