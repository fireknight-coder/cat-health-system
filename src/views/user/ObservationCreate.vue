<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElForm, ElFormItem, ElInput, ElButton, ElSelect, ElOption, ElMessage } from 'element-plus'
import { createObservation, getObservations } from '@/api/modules/observation'
import { getCatById } from '@/api/modules/cat'

const route = useRoute()
const router = useRouter()
const catId = route.query.catId as string

const form = ref({ content: '', type: 'general', isImportant: false })
const cat = ref<any>(null)
const loading = ref(false)
const submitting = ref(false)

async function loadCat() {
  if (!catId) return
  try {
    const res = await getCatById(catId)
    cat.value = (res as any).data
  } catch {}
}

async function submit() {
  if (!form.value.content.trim()) {
    ElMessage.warning('请输入观察内容')
    return
  }
  submitting.value = true
  try {
    await createObservation({ catId, ...form.value })
    ElMessage.success('提交成功')
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
    <h2>提交观察报告</h2>
    <el-form :model="form" label-width="80px" style="max-width: 500px">
      <el-form-item label="猫咪" v-if="cat">
        {{ cat.name }}
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="form.type">
          <el-option label="一般" value="general" />
          <el-option label="健康" value="health" />
          <el-option label="行为" value="behavior" />
          <el-option label="喂养" value="feeding" />
          <el-option label="事件" value="incident" />
        </el-select>
      </el-form-item>
      <el-form-item label="内容" required>
        <el-input v-model="form.content" type="textarea" :rows="4" placeholder="请描述观察情况" />
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