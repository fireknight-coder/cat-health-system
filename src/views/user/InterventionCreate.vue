<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElForm, ElFormItem, ElInput, ElButton, ElSelect, ElOption, ElMessage } from 'element-plus'
import { createIntervention } from '@/api/modules/intervention'
import { getCatById } from '@/api/modules/cat'

const route = useRoute()
const router = useRouter()
const catId = route.query.catId as string

const form = ref({ type: 'feeding', description: '', priority: 'medium' })
const cat = ref<any>(null)
const submitting = ref(false)

async function loadCat() {
  if (!catId) return
  try {
    const res = await getCatById(catId)
    cat.value = (res as any).data
  } catch {}
}

async function submit() {
  if (!form.value.description.trim()) {
    ElMessage.warning('请输入描述')
    return
  }
  submitting.value = true
  try {
    await createIntervention({ catId, ...form.value })
    ElMessage.success('请求已提交，管理员将尽快处理')
    router.push('/pets')
  } catch {
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(loadCat)
</script>

<template>
  <div class="page">
    <h2>请求干预</h2>
    <el-form :model="form" label-width="80px" style="max-width: 500px">
      <el-form-item label="猫咪" v-if="cat">
        {{ cat.name }}
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="form.type">
          <el-option label="医疗" value="medical" />
          <el-option label="救助" value="rescue" />
          <el-option label="喂养" value="feeding" />
          <el-option label="绝育" value="sterilization" />
        </el-select>
      </el-form-item>
      <el-form-item label="优先级">
        <el-select v-model="form.priority">
          <el-option label="低" value="low" />
          <el-option label="中" value="medium" />
          <el-option label="高" value="high" />
          <el-option label="紧急" value="urgent" />
        </el-select>
      </el-form-item>
      <el-form-item label="描述" required>
        <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请描述需要干预的情况" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="submitting" @click="submit">提交</el-button>
        <el-button @click="router.push('/pets')">返回</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
</style>