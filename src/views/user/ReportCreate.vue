<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElForm, ElFormItem, ElInput, ElButton, ElMessage } from 'element-plus'
import { createReport } from '@/api/modules/report'

const loading = ref(false)
const form = reactive({
  mediaUrls: [] as string[],
  lat: undefined as number | undefined,
  lng: undefined as number | undefined,
  address: '',
  reportedAt: new Date().toISOString().slice(0, 19),
  remark: '',
})

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
</script>

<template>
  <div class="page">
    <h2>上报流浪猫</h2>
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
        <el-input v-model="form.remark" type="textarea" rows="2" placeholder="选填" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="submit">提交上报</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
.media-upload { display: flex; align-items: center; gap: 8px; }
.tip { color: #909399; font-size: 12px; }
</style>
