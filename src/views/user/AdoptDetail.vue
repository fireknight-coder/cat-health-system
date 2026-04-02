<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElMessage, ElTag, ElCard } from 'element-plus'
import { getCatById } from '@/api/modules/cat'
import { createAdoptionRequest } from '@/api/modules/adoption'
import { getCatStatusLabel, type CatStatus } from '@/stores/dictionary'
import type { CatItem } from '@/api/modules/cat'

const route = useRoute()
const router = useRouter()
const catId = route.params.catId as string

const cat = ref<CatItem | null>(null)
const loading = ref(false)
const submitting = ref(false)

const form = ref({ phone: '', remark: '' })

async function loadCat() {
  loading.value = true
  try {
    const res = await getCatById(catId)
    cat.value = (res as any)?.data || res
  } catch {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function submitApply() {
  if (!form.value.phone.trim()) {
    ElMessage.warning('请填写联系电话')
    return
  }
  console.log('提交领养申请:', { catId, phone: form.value.phone, remark: form.value.remark })
  submitting.value = true
  try {
    const res = await createAdoptionRequest(catId, { phone: form.value.phone, remark: form.value.remark })
    console.log('提交成功:', res)
    ElMessage.success('申请已提交，管理员将电话联系您')
    router.push('/adopt')
  } catch (err: any) {
    console.error('提交失败:', err)
    ElMessage.error(err.response?.data?.message || err.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push('/adopt')
}

onMounted(loadCat)
</script>

<template>
  <div class="page">
    <el-button @click="goBack" class="back-btn">← 返回</el-button>
    
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!cat" class="empty">未找到猫咪</div>
    <div v-else class="detail-content">
      <div class="cat-header">
        <div class="cat-img">
          <img v-if="cat.images?.length || cat.avatar" :src="cat.avatar || cat.images?.[0]" />
          <div v-else class="img-placeholder">🐱</div>
        </div>
        <div class="cat-info">
          <h2>{{ cat.name || '未命名' }}</h2>
          <el-tag :type="(cat.status as CatStatus) === 'ADOPTABLE' ? 'success' : 'info'">
            {{ getCatStatusLabel(cat.status as CatStatus) }}
          </el-tag>
          <el-tag v-if="cat.pendingAdoptionCount" type="warning" style="margin-left: 8px">
            待审批申请：{{ cat.pendingAdoptionCount }}人
          </el-tag>
          <div class="info-row" v-if="cat.age">年龄：{{ cat.age }}岁</div>
          <div class="info-row" v-if="cat.gender">性别：{{ cat.gender === 'male' ? '公' : '母' }}</div>
          <div class="info-row" v-if="cat.color">毛色：{{ cat.color }}</div>
          <div class="info-row" v-if="cat.breed">品种：{{ cat.breed }}</div>
          <div class="info-row" v-if="cat.healthScore">健康评分：{{ cat.healthScore }}分</div>
        </div>
      </div>
      
      <el-card class="desc-card" v-if="cat.description">
        <template #header>猫咪描述</template>
        <p>{{ cat.description }}</p>
      </el-card>
      
      <el-card class="apply-card">
        <template #header>申请领养</template>
        <div class="form-item">
          <label>联系电话 *</label>
          <el-input v-model="form.phone" placeholder="用于线下联系" />
        </div>
        <div class="form-item">
          <label>申请备注</label>
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请介绍您的养猫经验、家庭环境等" />
        </div>
        <el-button type="primary" size="large" :loading="submitting" @click="submitApply" class="submit-btn">
          提交领养申请
        </el-button>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.page { background: #f5f7fa; padding: 20px; min-height: 100vh; }
.back-btn { margin-bottom: 16px; }
.loading, .empty { padding: 40px; text-align: center; }
.detail-content { max-width: 800px; margin: 0 auto; }
.cat-header { display: flex; gap: 24px; background: #fff; padding: 24px; border-radius: 12px; margin-bottom: 16px; }
.cat-img { width: 280px; height: 280px; border-radius: 12px; overflow: hidden; background: #f5f7fa; flex-shrink: 0; }
.cat-img img { width: 100%; height: 100%; object-fit: cover; }
.img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 80px; }
.cat-info { flex: 1; }
.cat-info h2 { margin: 0 0 12px 0; font-size: 28px; }
.info-row { margin-top: 8px; color: #666; }
.desc-card, .apply-card { margin-bottom: 16px; }
.form-item { margin-bottom: 16px; }
.form-item label { display: block; margin-bottom: 8px; font-weight: 500; }
.submit-btn { width: 100%; margin-top: 8px; }
</style>