<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElForm, ElFormItem, ElInput, ElButton, ElMessage } from 'element-plus'
import { createReport } from '@/api/modules/report'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const userRole = ref('user')

const loading = ref(false)
const form = reactive({
  mediaUrls: [] as string[],
  lat: undefined as number | undefined,
  lng: undefined as number | undefined,
  address: '',
  reportedAt: new Date().toISOString().slice(0, 19),
  remark: '',
})

// 管理员申请相关变量
const showAdminApplication = ref(false)
const submittingApplication = ref(false)
const adminApplicationForm = reactive({
  reason: ''
})

// 提交管理员申请
async function submitAdminApplication() {
  if (!adminApplicationForm.reason.trim()) {
    ElMessage.error('请填写申请理由')
    return
  }

  submittingApplication.value = true
  try {
    const response = await fetch('http://localhost:3002/api/auth/apply-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      },
      body: JSON.stringify({
        userId: auth.userId,
        reason: adminApplicationForm.reason
      })
    })

    const result = await response.json()
    
    if (result.success) {
      ElMessage.success('申请已提交，请等待1-2个工作日审核')
      showAdminApplication.value = false
      adminApplicationForm.reason = ''
      // 更新用户角色状态
      userRole.value = 'pending_admin'
    } else {
      throw new Error(result.error || '申请失败')
    }
  } catch (error: any) {
    console.error('申请管理员错误:', error)
    ElMessage.error(error.message || result?.error || '申请失败，请稍后重试')
  } finally {
    submittingApplication.value = false
  }
}

function handleCloseAdminApplication() {
  if (adminApplicationForm.reason.trim()) {
    ElMessage.warning('申请内容未保存，确定要取消吗？')
  }
  showAdminApplication.value = false
}

async function submit() {
  if (!form.reportedAt) {
    ElMessage.warning('请选择发现时间')
    return
  }
  loading.value = true
  try {
    await createReport({
      mediaUrls: form.mediaUrls.length ? form.mediaUrls : ['/mock/upload-placeholder.jpg'],
      lat: form.lat,
      lng: form.lng,
      address: form.address || undefined,
      reportedAt: form.reportedAt,
      remark: form.remark || undefined,
    })
    ElMessage.success('上报成功，等待审核')
    form.mediaUrls = []
    form.remark = ''
  } catch (e) {
    ElMessage.error('上报失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

function addMockMedia() {
  form.mediaUrls.push(`/mock/photo-${form.mediaUrls.length + 1}.jpg`)
}

onMounted(() => {
  userRole.value = auth.role
})
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>上报流浪猫</h2>
      <el-button 
        v-if="userRole === 'user'" 
        type="primary" 
        size="small" 
        @click="showAdminApplication = true"
      >
        申请成为管理员
      </el-button>
    </div>
    
    <!-- 管理员申请弹窗 -->
    <el-dialog 
      v-model="showAdminApplication" 
      title="申请成为管理员" 
      width="500px"
      :before-close="handleCloseAdminApplication"
    >
      <el-form :model="adminApplicationForm" label-width="80px">
        <el-form-item label="申请理由">
          <el-input 
            v-model="adminApplicationForm.reason" 
            type="textarea" 
            :rows="4" 
            placeholder="请说明您为什么想成为管理员，以及您能为社区猫咪管理做些什么..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdminApplication = false">取消</el-button>
        <el-button 
          type="primary" 
          :loading="submittingApplication" 
          @click="submitAdminApplication"
        >
          提交申请
        </el-button>
      </template>
    </el-dialog>
    
    <el-form :model="form" label-width="100px" style="max-width: 560px">
      <el-form-item label="照片/视频">
        <div class="media-upload">
          <el-button size="small" @click="addMockMedia">+ 添加素材（演示）</el-button>
          <span v-if="form.mediaUrls.length" class="tip">已选 {{ form.mediaUrls.length }} 个</span>
        </div>
      </el-form-item>
      <el-form-item label="位置">
        <el-input v-model="form.address" placeholder="自动获取或手动填写" />
      </el-form-item>
      <el-form-item label="发现时间">
        <el-input v-model="form.reportedAt" type="datetime-local" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="选填" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="submit">提交上报</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.page { 
  background: #fff; 
  padding: 24px; 
  border-radius: 8px; 
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.media-upload { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
}

.tip { 
  color: #909399; 
  font-size: 12px; 
}
</style>