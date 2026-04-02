<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElForm, ElFormItem, ElInput, ElButton, ElMessage } from 'element-plus'
import { createAdoptionRequest } from '@/api/modules/adoption'

const route = useRoute()
const router = useRouter()
const catId = computed(() => route.params.catId as string)
const loading = ref(false)
const form = reactive({ phone: '', remark: '' })

async function submit() {
  if (!form.phone.trim()) {
    ElMessage.warning('请填写联系电话')
    return
  }
  loading.value = true
  try {
    await createAdoptionRequest(catId.value, { phone: form.phone, remark: form.remark })
    ElMessage.success('申请已提交，管理员将电话联系您')
    router.push('/adopt')
  } catch {
    ElMessage.error('提交失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <h2>申请领养 · {{ catId }}</h2>
    <el-form :model="form" label-width="80px" style="max-width: 400px">
      <el-form-item label="电话" required>
        <el-input v-model="form.phone" placeholder="用于线下联系" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="submit">提交申请</el-button>
        <el-button @click="router.push('/adopt')">返回</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
</style>