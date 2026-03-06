<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElForm, ElFormItem, ElInput, ElButton, ElMessage } from 'element-plus'
import { bindDevice } from '@/api/modules/device'

const router = useRouter()
const petId = ref('')
const deviceId = ref('')
const loading = ref(false)

async function submit() {
  if (!petId.value || !deviceId.value) {
    ElMessage.warning('请填写宠物ID与设备ID')
    return
  }
  loading.value = true
  try {
    await bindDevice(petId.value, deviceId.value)
    ElMessage.success('绑定成功')
    router.push('/pets')
  } catch {
    ElMessage.error('绑定失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <h2>绑定项圈</h2>
    <el-form label-width="80px" style="max-width: 400px">
      <el-form-item label="宠物ID">
        <el-input v-model="petId" placeholder="领养后的宠物ID" />
      </el-form-item>
      <el-form-item label="设备ID">
        <el-input v-model="deviceId" placeholder="项圈 deviceId" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="submit">确认绑定</el-button>
        <el-button @click="router.push('/pets')">返回</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
</style>
