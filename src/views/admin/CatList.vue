<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElTable, ElTableColumn, ElButton, ElTag, ElDrawer, ElCard, ElEmpty, ElMessage } from 'element-plus'
import { getCatList, getCatById, updateCat } from '@/api/modules/cat'
import { getObservations, createObservation, deleteObservation } from '@/api/modules/observation'
import { getCatStatusLabel } from '@/stores/dictionary'
import type { CatItem } from '@/api/modules/cat'
import type { ObservationItem } from '@/api/modules/observation'

const list = ref<CatItem[]>([])
const loading = ref(false)

// 抽屉相关
const drawerVisible = ref(false)
const currentCat = ref<CatItem | null>(null)
const catLoading = ref(false)
const editName = ref('')

// 观察记录
const observations = ref<ObservationItem[]>([])
const obsLoading = ref(false)
const showObsForm = ref(false)
const obsForm = reactive({
  content: '',
  type: 'general' as string,
  isImportant: false
})

const typeOptions = [
  { value: 'general', label: '日常' },
  { value: 'health', label: '健康' },
  { value: 'behavior', label: '行为' },
  { value: 'feeding', label: '喂食' },
  { value: 'incident', label: '事件' }
]

const statusOptions = [
  { value: 'HEALTHY', label: '健康' },
  { value: 'SICK', label: '生病' },
  { value: 'ADOPTABLE', label: '可领养' },
  { value: 'ADOPTED', label: '已领养' },
  { value: 'UNDER_TREATMENT', label: '治疗中' },
  { value: 'MISSING', label: '失踪' }
]

const editStatus = ref('')

function getTypeColor(type: string): 'info' | 'warning' | 'success' | 'danger' {
  const colors: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
    general: 'info', health: 'warning', behavior: 'success', feeding: 'info', incident: 'danger'
  }
  return colors[type] || 'info'
}

async function load() {
  loading.value = true
  try {
    const res = await getCatList({ pageSize: 100 })
    const resData = res as any
    list.value = resData?.data?.list ?? resData?.list ?? []
  } catch (e: any) {
    console.error('获取猫咪列表失败:', e)
    list.value = []
  } finally {
    loading.value = false
  }
}

async function openDetail(cat: CatItem) {
  currentCat.value = cat
  editName.value = cat.name ?? ''
  editStatus.value = cat.status ?? 'HEALTHY'
  drawerVisible.value = true
  await Promise.all([loadCatDetail(), loadObservations()])
}

async function loadCatDetail() {
  if (!currentCat.value) return
  catLoading.value = true
  try {
    const res = await getCatById(currentCat.value.id)
    currentCat.value = (res as { data: CatItem }).data
  } catch {
    // ignore
  } finally {
    catLoading.value = false
  }
}

async function loadObservations() {
  if (!currentCat.value) return
  obsLoading.value = true
  try {
    const res = await getObservations(currentCat.value.id, { pageSize: 50 })
    observations.value = (res as any).data ?? []
  } catch {
    observations.value = []
  } finally {
    obsLoading.value = false
  }
}

async function saveName() {
  if (!currentCat.value) return
  try {
    await updateCat(currentCat.value!.id, { name: editName.value })
    currentCat.value!.name = editName.value
    const cid = currentCat.value!.id
    const idx = list.value.findIndex(c => c.id === cid || (c as any)._id === cid)
    if (idx >= 0) list.value[idx].name = editName.value
    ElMessage.success('已保存')
  } catch {
    ElMessage.error('保存失败')
  }
}

async function saveStatus() {
  if (!currentCat.value) return
  try {
    await updateCat(currentCat.value!.id, { status: editStatus.value })
    currentCat.value!.status = editStatus.value
    const cid = currentCat.value!.id
    const idx = list.value.findIndex(c => c.id === cid || (c as any)._id === cid)
    if (idx >= 0) list.value[idx].status = editStatus.value
    ElMessage.success('状态已更新')
  } catch {
    ElMessage.error('保存失败')
  }
}

async function submitObservation() {
  if (!obsForm.content.trim() || !currentCat.value) return
  try {
    await createObservation({
      catId: currentCat.value.id,
      content: obsForm.content,
      type: obsForm.type,
      isImportant: obsForm.isImportant
    })
    showObsForm.value = false
    obsForm.content = ''
    obsForm.type = 'general'
    obsForm.isImportant = false
    loadObservations()
  } catch {
    console.error('添加失败')
  }
}

async function removeObservation(obsId: string) {
  try {
    await deleteObservation(obsId)
    loadObservations()
  } catch {
    console.error('删除失败')
  }
}

// 照片上传
const showPhotoForm = ref(false)
const newPhotos = ref<string[]>([])
const photoFileList = ref<any[]>([])

function handlePhotoChange(_file: any, files: any[]) {
  photoFileList.value = files
  newPhotos.value = []
  files.forEach(f => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        newPhotos.value.push(e.target.result as string)
      }
    }
    reader.readAsDataURL(f.raw)
  })
}

async function savePhotos() {
  if (!currentCat.value || newPhotos.value.length === 0) return
  try {
    const currentImages = currentCat.value.images || []
    await updateCat(currentCat.value.id, {
      images: [...currentImages, ...newPhotos.value],
      avatar: currentImages.length === 0 ? newPhotos.value[0] : currentCat.value.avatar
    })
    currentCat.value.images = [...currentImages, ...newPhotos.value]
    if (!currentCat.value.avatar) currentCat.value.avatar = newPhotos.value[0]
    newPhotos.value = []
    photoFileList.value = []
    showPhotoForm.value = false
    ElMessage.success('照片已保存')
  } catch {
    ElMessage.error('保存失败')
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <h2>🐱 猫档案列表</h2>
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column prop="catId" label="ID卡号" min-width="100">
        <template #default="{ row }">
          <span class="cat-id">{{ (row as any).catId || row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="名字" min-width="100">
        <template #default="{ row }">
          <span class="cat-name">{{ row.name || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" min-width="80">
        <template #default="{ row }">
          <el-tag size="small">{{ getCatStatusLabel(row.status as any) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="healthScore" label="健康分" min-width="70">
        <template #default="{ row }">
          <span :class="{ 'high-score': (row.healthScore ?? 0) >= 80 }">{{ row.healthScore ?? '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="sightingCount" label="发现次数" min-width="80">
        <template #default="{ row }">{{ row.sightingCount ?? 0 }}次</template>
      </el-table-column>
      <el-table-column label="操作" min-width="70">
        <template #default="{ row }">
          <el-button type="primary" link @click="openDetail(row)">📋 详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="猫档案详情" size="500px" :direction="'rtl'">
      <div v-if="currentCat" v-loading="catLoading">
        <!-- 基本信息 -->
        <el-card class="info-card">
          <template #header><span>📋 基本信息</span></template>
          <div class="info-row">
            <span class="label">ID卡号：</span>
            <span class="cat-id">{{ currentCat ? ((currentCat as any).catId || currentCat.id) : '-' }}</span>
          </div><!-- 照片区域 -->
          <div class="photo-section">
            <div class="photo-header">
              <span class="label">📷 照片：</span>
              <el-button size="small" @click="showPhotoForm = !showPhotoForm">{{ showPhotoForm ? '取消' : '+ 添加' }}</el-button>
            </div>
            <div v-if="currentCat.images?.length" class="photo-grid">
              <div v-for="(img, i) in currentCat.images" :key="'img'+i" class="photo-item">
                <img :src="img" />
              </div>
            </div>
            <el-empty v-else description="暂无照片" :image-size="60" />
            
            <div v-if="showPhotoForm" class="photo-upload">
              <el-upload
                :auto-upload="false"
                :on-change="handlePhotoChange"
                :limit="5"
                list-type="picture-card"
                accept="image/*"
              >
                <el-button size="small">+ 选择</el-button>
              </el-upload>
              <div v-if="newPhotos.length" class="upload-actions">
                <span>已选 {{ newPhotos.length }} 张</span>
                <el-button size="small" @click="{ newPhotos = []; photoFileList = [] }">清空</el-button>
                <el-button type="primary" size="small" @click="savePhotos">保存</el-button>
              </div>
            </div>
          <div class="info-row">
            <span class="label">名字：</span>
            <el-input v-model="editName" size="small" style="width: 120px" />
            <el-button size="small" @click="saveName">保存</el-button>
          </div>
          <div class="info-row">
            <span class="label">状态：</span>
            <el-select v-model="editStatus" size="small" style="width: 100px" @change="saveStatus">
              <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </div>
          <div class="info-row">
            <span class="label">健康评分：</span>
            <span>{{ currentCat.healthScore ?? '-' }} 分</span>
          </div>
          <div class="info-row">
            <span class="label">风险等级：</span>
            <el-tag :type="currentCat.riskLevel === 'high' ? 'danger' : currentCat.riskLevel === 'medium' ? 'warning' : 'success'" size="small">
              {{ currentCat.riskLevel ?? 'low' }}
            </el-tag>
          </div>
          <div class="info-row">
            <span class="label">发现次数：</span>
            <span>{{ currentCat.sightingCount ?? 0 }} 次</span>
          </div>
          <div class="info-row">
            <span class="label">最后发现：</span>
            <span>{{ currentCat.lastSeenAt || '-' }}</span>
          </div>
          
          
          </div>
        </el-card>

        <!-- 观察记录 -->
        <el-card class="obs-card">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>📝 观察记录（字条）</span>
              <el-button size="small" @click="showObsForm = !showObsForm">{{ showObsForm ? '取消' : '+ 添加' }}</el-button>
            </div>
          </template>
          
          <!-- 添加表单 -->
          <div v-if="showObsForm" class="obs-form">
            <el-input v-model="obsForm.content" type="textarea" :rows="2" placeholder="写下观察记录..." />
            <div class="obs-form-tools">
              <el-select v-model="obsForm.type" size="small" style="width: 80px">
                <el-option v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
              <el-checkbox v-model="obsForm.isImportant" size="small">重要</el-checkbox>
              <el-button type="primary" size="small" @click="submitObservation">提交</el-button>
            </div>
          </div>
          
          <!-- 记录列表 -->
          <div v-if="obsLoading" class="loading">加载中...</div>
          <el-empty v-else-if="observations.length === 0" description="暂无记录" :image-size="40" />
          <div v-else class="obs-list">
            <div v-for="obs in observations" :key="obs._id" class="obs-item" :class="{ important: obs.isImportant }">
              <div class="obs-header">
                <el-tag :type="(obs as any).isUserRecord ? 'warning' : 'success'" size="small">
                  {{ (obs as any).isUserRecord ? '用户提交' : '管理员记录' }}
                </el-tag>
                <el-tag :type="getTypeColor(obs.type)" size="small">{{ typeOptions.find(t => t.value === obs.type)?.label || obs.type }}</el-tag>
                <span class="obs-time">{{ obs.observedAt }}</span>
                <el-button type="danger" link size="small" @click="removeObservation(obs._id)">删除</el-button>
              </div>
              <div class="obs-content">{{ obs.content }}</div>
            </div>
          </div>
        </el-card>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
.cat-id { color: #409eff; font-weight: bold; font-family: monospace; }
.cat-name { display: inline-block; font-weight: 500; }
.high-score { color: #67c23a; }

.info-card, .obs-card { margin-bottom: 16px; }
.info-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.info-row .label { color: #909399; width: 70px; flex-shrink: 0; }

.photo-section { margin-top: 16px; }
.photo-header { display: flex; align-items: center; gap: 8px; }
.photo-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.photo-item { width: 70px; height: 70px; border-radius: 6px; overflow: hidden; }
.photo-item img { width: 100%; height: 100%; object-fit: cover; }
.photo-upload { margin-top: 12px; }
.upload-actions { display: flex; align-items: center; gap: 12px; margin-top: 8px; }

.obs-form { background: #f5f7fa; padding: 12px; border-radius: 8px; margin-bottom: 12px; }
.obs-form-tools { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.obs-list { display: flex; flex-direction: column; gap: 8px; }
.obs-item { background: #fafafa; border-radius: 6px; padding: 10px; }
.obs-item.important { background: #fef0f0; border: 1px solid #fde2e2; }
.obs-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.obs-time { color: #909399; font-size: 12px; flex: 1; }
.obs-content { color: #606266; line-height: 1.5; white-space: pre-wrap; }
.loading { text-align: center; padding: 20px; color: #909399; }
</style>