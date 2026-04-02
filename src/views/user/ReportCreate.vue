<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElForm, ElFormItem, ElInput, ElButton, ElMessage } from 'element-plus'
import type { UploadFile, UploadFiles } from 'element-plus'
import { createReport, uploadReportMedia } from '@/api/modules/report'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const userRole = ref('user')

const loading = ref(false)
const uploadFiles = ref<UploadFile[]>([])
const locating = ref(false)
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
    ElMessage.error(error.message || '申请失败，请稍后重试')
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
  if (!uploadFiles.value.length) {
    ElMessage.warning('请至少上传一张照片')
    return
  }
  if (!form.address.trim()) {
    ElMessage.warning('请填写确切地址')
    return
  }
  if (!form.reportedAt) {
    ElMessage.warning('请选择发现时间')
    return
  }
  loading.value = true
  try {
    const rawFiles = uploadFiles.value
      .map((f) => f.raw as File | undefined)
      .filter((f): f is File => !!f)
    const uploadRes = await uploadReportMedia(rawFiles)
    const mediaUrls = (uploadRes as any)?.data?.urls ?? []

    await createReport({
      mediaUrls,
      lat: form.lat,
      lng: form.lng,
      address: form.address.trim(),
      reportedAt: form.reportedAt,
      remark: form.remark || undefined,
    })
    ElMessage.success('上报成功，等待审核')
    form.mediaUrls = []
    form.lat = undefined
    form.lng = undefined
    form.address = ''
    form.remark = ''
    uploadFiles.value = []
  } catch (e) {
    ElMessage.error('上报失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

function handleUploadChange(_file: UploadFile, files: UploadFiles) {
  uploadFiles.value = files
}

function detectLocation() {
  if (!navigator.geolocation) {
    ElMessage.warning('当前浏览器不支持定位')
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.lat = Number(position.coords.latitude.toFixed(6))
      form.lng = Number(position.coords.longitude.toFixed(6))
      if (!form.address.trim()) {
        form.address = `${form.lat}, ${form.lng}`
      }
      locating.value = false
      ElMessage.success('已获取经纬度，请确认地址')
    },
    () => {
      locating.value = false
      ElMessage.error('定位失败，请手动填写地址')
    },
    { enableHighAccuracy: true, timeout: 8000 }
  )
}

onMounted(() => {
  userRole.value = auth.role
})
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2 class="tech-title">上报流浪猫</h2>
      <el-button 
        v-if="userRole === 'user'" 
        type="primary" 
        size="small" 
        class="admin-apply-btn"
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
    
    <el-form :model="form" label-width="92px" class="report-form">
      <div class="field-grid">
        <div class="field-card media-card">
          <el-form-item label="照片/视频" class="field-item">
            <div class="media-upload">
              <el-upload
                :auto-upload="false"
                :limit="6"
                accept="image/*"
                list-type="picture-card"
                :on-change="handleUploadChange"
              >
                <el-button class="field-action-btn" size="small">+ 选择图片</el-button>
              </el-upload>
              <span v-if="uploadFiles.length" class="tip">已选 {{ uploadFiles.length }} 个</span>
            </div>
          </el-form-item>
        </div>

        <div class="field-card location-card">
          <el-form-item label="位置" class="field-item">
            <div class="location-box">
              <el-input v-model="form.address" placeholder="请填写确切地址（例如：XX小区X栋门口）" />
              <el-button size="small" :loading="locating" @click="detectLocation">自动定位</el-button>
            </div>
            <div v-if="form.lat !== undefined && form.lng !== undefined" class="tip">经纬度：{{ form.lat }}, {{ form.lng }}</div>
          </el-form-item>
        </div>

        <div class="field-card time-card">
          <el-form-item label="发现时间" class="field-item">
            <el-input v-model="form.reportedAt" type="datetime-local" />
          </el-form-item>
        </div>

        <div class="field-card remark-card">
          <el-form-item label="备注" class="field-item">
            <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="选填" />
          </el-form-item>
        </div>
      </div>

      <div class="submit-wrap">
        <el-button class="submit-btn" type="primary" :loading="loading" @click="submit">提交上报</el-button>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.page { 
  background: linear-gradient(165deg, #fffaf3, #f7efe3);
  border: 1px solid #e3d4c2;
  box-shadow: 0 18px 38px rgba(112, 89, 60, 0.1);
  padding: 28px;
  border-radius: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.tech-title {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #5a4736;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}

.admin-apply-btn {
  border-radius: 10px;
  background: linear-gradient(145deg, #53738f, #4c6881);
  border-color: #48647e;
}

.report-form {
  max-width: 920px;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(240px, 1fr));
  gap: 14px;
}

.field-card {
  background: linear-gradient(150deg, #fffdfa, #f6efe5);
  border: 1px solid #dfd2c2;
  border-radius: 14px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6), 0 8px 22px rgba(121, 94, 61, 0.1);
  padding: 14px 12px;
}

.media-card {
  border-left: 4px solid #7a94ae;
}

.location-card {
  border-left: 4px solid #82a188;
}

.time-card {
  border-left: 4px solid #95a6ba;
}

.remark-card {
  border-left: 4px solid #be9878;
}

.field-item {
  margin-bottom: 0;
}

.media-upload { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
}

.location-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-action-btn {
  border-radius: 10px;
  border-color: #c9b8a4;
  background: linear-gradient(140deg, #fdf7ef, #f1e5d8);
  color: #5a4b3d;
}

.tip { 
  color: #7a6a59;
  font-size: 12px; 
}

.submit-wrap {
  margin-top: 18px;
}

.submit-btn {
  min-width: 140px;
  border-radius: 12px;
  background: linear-gradient(150deg, #5d7a96, #6c8aa6);
  border-color: #56728e;
}

@media (max-width: 768px) {
  .page {
    padding: 18px;
  }

  .tech-title {
    font-size: 24px;
  }

  .field-grid {
    grid-template-columns: 1fr;
  }
}
</style>