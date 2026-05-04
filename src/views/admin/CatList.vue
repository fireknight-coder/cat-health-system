<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { ElTable, ElTableColumn, ElButton, ElTag, ElDrawer, ElCard, ElEmpty, ElMessage, ElMessageBox } from 'element-plus'
import { getCatList, getCatById, updateCat, uploadCatImages } from '@/api/modules/cat'
import { getObservations, createObservation, deleteObservation } from '@/api/modules/observation'
import { getCatStatusLabel } from '@/stores/dictionary'
import type { CatItem } from '@/api/modules/cat'
import type { ObservationItem } from '@/api/modules/observation'

const list = ref<CatItem[]>([])
const loading = ref(false)
const avatarWidth = ref(40)
const avatarHeight = ref(40)

// 抽屉相关
const drawerVisible = ref(false)
const currentCat = ref<CatItem | null>(null)
const catLoading = ref(false)
const editName = ref('')
const editHealthScore = ref<number>(80)
const editRiskLevel = ref<'low' | 'medium' | 'high'>('low')
const editSightingCount = ref<number>(0)
const editLastSeenAt = ref('')
const editDescription = ref('')
const failedDrawerImages = ref<string[]>([])

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

const riskOptions = [
  { value: 'low', label: '低风险' },
  { value: 'medium', label: '中风险' },
  { value: 'high', label: '高风险' }
]

function normalizeImageUrl(raw?: string) {
  if (typeof raw !== 'string') return ''
  const url = raw.trim()
  if (!url) return ''
  const lower = url.toLowerCase()
  if (lower === 'null' || lower === 'undefined' || lower === 'nan') return ''
  if (lower.includes('placeholder')) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/uploads/')) return url
  if (url.startsWith('data:image/')) return url
  return ''
}

const validDrawerImages = computed(() => {
  const source = currentCat.value?.images || []
  const unique = new Set<string>()
  const output: string[] = []

  for (const item of source) {
    const cleaned = normalizeImageUrl(item)
    if (!cleaned) continue
    if (failedDrawerImages.value.includes(cleaned)) continue
    if (unique.has(cleaned)) continue
    unique.add(cleaned)
    output.push(cleaned)
  }
  return output
})

function handleDrawerImageError(url?: string) {
  if (!url) return
  if (!failedDrawerImages.value.includes(url)) {
    failedDrawerImages.value = failedDrawerImages.value.concat(url)
  }
}

function calcRiskLevelByScore(score: number): 'low' | 'medium' | 'high' {
  if (score < 60) return 'high'
  if (score < 80) return 'medium'
  return 'low'
}

function toDateTimeLocal(raw?: string) {
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

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
    console.log('返回数据:', res)
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
  editHealthScore.value = Number(cat.healthScore ?? 80)
  editRiskLevel.value = (cat.riskLevel as 'low' | 'medium' | 'high') || 'low'
  editSightingCount.value = Number(cat.sightingCount ?? 0)
  editLastSeenAt.value = toDateTimeLocal(cat.lastSeenAt)
  editDescription.value = cat.description || ''
  failedDrawerImages.value = []
  drawerVisible.value = true
  await Promise.all([loadCatDetail(), loadObservations()])
}

async function loadCatDetail() {
  if (!currentCat.value) return
  catLoading.value = true
  try {
    const res = await getCatById(currentCat.value.id)
    currentCat.value = (res as { data: CatItem }).data
    failedDrawerImages.value = []
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
    if (idx >= 0 && list.value[idx]) list.value[idx].name = editName.value
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
    if (idx >= 0 && list.value[idx]) list.value[idx].status = editStatus.value
    ElMessage.success('状态已更新')
  } catch {
    ElMessage.error('保存失败')
  }
}

async function saveProfileFields() {
  if (!currentCat.value) return

  const normalizedScore = Math.max(0, Math.min(100, Number(editHealthScore.value || 0)))
  const expectedRisk = calcRiskLevelByScore(normalizedScore)
  if (editRiskLevel.value !== expectedRisk) {
    try {
      await ElMessageBox.confirm(
        `健康评分 ${normalizedScore} 分建议风险等级为 ${expectedRisk}。是否自动修正并保存？`,
        '风险一致性校验',
        { confirmButtonText: '修正并保存', cancelButtonText: '取消', type: 'warning' }
      )
      editRiskLevel.value = expectedRisk
    } catch {
      return
    }
  }

  try {
    await updateCat(currentCat.value.id, {
      healthScore: normalizedScore,
      riskLevel: editRiskLevel.value,
      sightingCount: Math.max(0, Number(editSightingCount.value || 0)),
      lastSeenAt: editLastSeenAt.value ? new Date(editLastSeenAt.value).toISOString() : undefined,
      description: editDescription.value.trim() || ''
    })

    currentCat.value.healthScore = normalizedScore
    currentCat.value.riskLevel = editRiskLevel.value
    currentCat.value.sightingCount = Math.max(0, Number(editSightingCount.value || 0))
    currentCat.value.lastSeenAt = editLastSeenAt.value ? new Date(editLastSeenAt.value).toISOString() : undefined
    currentCat.value.description = editDescription.value.trim()
    const idx = list.value.findIndex(c => c.id === currentCat.value!.id || (c as any)._id === currentCat.value!.id)
    if (idx >= 0 && list.value[idx]) {
      list.value[idx].healthScore = currentCat.value.healthScore
      list.value[idx].riskLevel = currentCat.value.riskLevel
      list.value[idx].sightingCount = currentCat.value.sightingCount
      list.value[idx].lastSeenAt = currentCat.value.lastSeenAt
      list.value[idx].description = currentCat.value.description
    }
    ElMessage.success('档案信息已更新')
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
const photoFileList = ref<any[]>([])

function handlePhotoChange(_file: any, files: any[]) {
  photoFileList.value = files
}

function clearPhotoSelection() {
  photoFileList.value = []
}

async function savePhotos() {
  if (!currentCat.value || photoFileList.value.length === 0) return
  try {
    const rawFiles = photoFileList.value
      .map((f) => f.raw as File | undefined)
      .filter((f): f is File => !!f)
    const uploadRes = await uploadCatImages(rawFiles)
    const uploadedUrls = (uploadRes as any)?.data?.urls ?? []
    if (!uploadedUrls.length) {
      ElMessage.error('上传失败，请重试')
      return
    }

    const currentImages = currentCat.value.images || []
    const newImages = [...uploadedUrls, ...currentImages]
    
    console.log('保存前的images:', uploadedUrls)
    console.log('合并后的images:', newImages)
    
    await updateCat(currentCat.value.id, {
      images: newImages,
      avatar: uploadedUrls[0]
    })
    
    currentCat.value.images = newImages
    currentCat.value.avatar = uploadedUrls[0]
    
    console.log('保存后的currentCat.images:', currentCat.value.images)
    
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
  <div class="page mobile-hide-table">
    <h2>🐱 猫档案列表</h2>

    <!-- 桌面端表格 -->
    <el-table v-loading="loading" :data="list" stripe>

      <el-table-column label="照片" width="70">
        <template #default="{ row }">
          <img
            v-if="row.avatar"
            :src="row.avatar"
            class="table-avatar"
            :style="{ width: avatarWidth + 'px', height: avatarHeight + 'px' }"
          />
          <span v-else class="no-avatar">🐱</span>
        </template>
      </el-table-column>

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
      <el-table-column prop="adopterName" label="领养人" min-width="100">
        <template #default="{ row }">
          {{ row.adopterName || '-' }}
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

    <!-- 移动端卡片列表 -->
    <div class="mobile-card-list" v-loading="loading">
      <el-card v-for="cat in list" :key="cat.id" @click="openDetail(cat)">
        <div class="card-header">
          <img v-if="cat.avatar" :src="cat.avatar" class="card-avatar" />
          <div v-else class="card-avatar no-avatar-card">🐱</div>
          <div class="card-title-wrap">
            <div class="card-title">{{ cat.name || '未命名' }}</div>
            <div class="card-subtitle">ID: {{ (cat as any).catId || cat.id }}</div>
          </div>
          <el-button type="primary" link size="small" @click.stop="openDetail(cat)">详情</el-button>
        </div>
        <div class="card-body">
          <div class="card-row">
            <span class="card-label">状态</span>
            <el-tag size="small">{{ getCatStatusLabel(cat.status as any) }}</el-tag>
          </div>
          <div class="card-row">
            <span class="card-label">健康分</span>
            <span :class="{ 'high-score': (cat.healthScore ?? 0) >= 80 }">{{ cat.healthScore ?? '-' }}</span>
          </div>
          <div class="card-row">
            <span class="card-label">发现次数</span>
            <span>{{ cat.sightingCount ?? 0 }}次</span>
          </div>
          <div class="card-row" v-if="cat.adopterName">
            <span class="card-label">领养人</span>
            <span>{{ cat.adopterName }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="猫档案详情" size="500px" :direction="'rtl'">
      <div v-if="currentCat" v-loading="catLoading">
        <!-- 基本信息 -->
        <el-card class="info-card">
          <template #header><span>📋 基本信息</span></template>
          <div class="info-row">
            <span class="label">ID卡号：</span>
            <span class="cat-id">{{ currentCat ? ((currentCat as any).catId || currentCat.id) : '-' }}</span>
          </div>
          <!-- 照片区域 -->
          <div class="photo-section">
            <div class="photo-header">
              <span class="label">📷 照片：</span>
              <el-button size="small" @click="showPhotoForm = !showPhotoForm">{{ showPhotoForm ? '取消' : '+ 添加' }}</el-button>
            </div>
            <div v-if="validDrawerImages.length" class="photo-display">
              <div class="main-photo">
                <img :src="validDrawerImages[0]" @error="handleDrawerImageError(validDrawerImages[0])" />
              </div>
              <div v-if="validDrawerImages.length > 1" class="photo-grid">
                <div v-for="(img, i) in validDrawerImages.slice(1)" :key="img + '-' + i" class="photo-item">
                  <img :src="img" @error="handleDrawerImageError(img)" />
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无有效照片，点击上方添加" :image-size="60" />
            
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
              <div v-if="photoFileList.length" class="upload-actions">
                <span>已选 {{ photoFileList.length }} 张</span>
                <el-button size="small" @click="clearPhotoSelection">清空</el-button>
                <el-button type="primary" size="small" @click="savePhotos">保存</el-button>
              </div>
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
            <span class="label">性别：</span>
            <span>{{ currentCat.gender === 'male' ? '公猫' : currentCat.gender === 'female' ? '母猫' : '未知' }}</span>
          </div>
          <div class="info-row">
            <span class="label">健康评分：</span>
            <el-input v-model.number="editHealthScore" type="number" size="small" style="width: 110px" :min="0" :max="100" />
            <span>分</span>
          </div>
          <div class="info-row">
            <span class="label">风险等级：</span>
            <el-select v-model="editRiskLevel" size="small" style="width: 110px">
              <el-option v-for="opt in riskOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </div>
          <div class="info-row">
            <span class="label">发现次数：</span>
            <el-input v-model.number="editSightingCount" type="number" size="small" style="width: 110px" :min="0" />
            <span>次</span>
          </div>
          <div class="info-row">
            <span class="label">最后发现：</span>
            <el-input v-model="editLastSeenAt" type="datetime-local" size="small" style="width: 210px" />
          </div>
          <div class="info-row description-row">
            <span class="label">描述：</span>
            <el-input v-model="editDescription" type="textarea" :rows="3" placeholder="可编辑猫档案描述" style="width: 100%" />
          </div>
          <div class="info-row">
            <el-button type="primary" size="small" @click="saveProfileFields">确定保存档案信息</el-button>
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
            <div v-for="obs in observations" :key="(obs as any)._id" class="obs-item" :class="{ important: obs.isImportant }">
              <div class="obs-header">
                <el-tag :type="(obs as any).isUserRecord ? 'warning' : 'success'" size="small">
                  {{ (obs as any).isUserRecord ? '用户提交' : '管理员记录' }}
                </el-tag>
                <el-tag :type="getTypeColor(obs.type)" size="small">{{ typeOptions.find(t => t.value === obs.type)?.label || obs.type }}</el-tag>
                <span class="obs-time">{{ obs.observedAt }}</span>
                <el-button type="danger" link size="small" @click="removeObservation((obs as any)._id)">删除</el-button>
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
.page {
  background: linear-gradient(180deg, #fffaf4 0%, #ffffff 58%);
  padding: 24px;
  border-radius: 12px;
}

.cat-id {
  color: #409eff;
  font-weight: bold;
  font-family: monospace;
}

.cat-name {
  display: inline-block;
  font-weight: 500;
}

.high-score {
  color: #67c23a;
}

.info-card,
.obs-card {
  margin-bottom: 16px;
  border: none;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(140, 96, 55, 0.1);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.info-row .label {
  color: #8f7a67;
  width: 70px;
  flex-shrink: 0;
}

.description-row {
  align-items: flex-start;
}

.photo-section {
  margin-top: 16px;
  padding: 10px;
  border-radius: 10px;
  background: #fff7ed;
  border: 1px solid #f2e3d1;
}

.photo-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.photo-display {
  margin-top: 12px;
}

.main-photo {
  width: 100%;
  height: 250px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
  background: #f6ecdf;
  border: 1px solid #eedbc4;
}

.main-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(66px, 1fr));
  gap: 8px;
}

.photo-item {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f6ecdf;
  border: 1px solid #eedbc4;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-upload {
  margin-top: 12px;
}

.upload-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  color: #8f7a67;
}

.obs-form {
  background: #fff7ed;
  border: 1px solid #f2e3d1;
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 12px;
}

.obs-form-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.obs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.obs-item {
  background: #fffdfa;
  border: 1px solid #f2e6d7;
  border-radius: 8px;
  padding: 10px;
}

.obs-item.important {
  background: #fff0ef;
  border-color: #f9d7d4;
}

.obs-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.obs-time {
  color: #909399;
  font-size: 12px;
  flex: 1;
}

.obs-content {
  color: #5d5144;
  line-height: 1.5;
  white-space: pre-wrap;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #909399;
}

.table-avatar {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  object-fit: cover;
  background: #f6ecdf;
}

.no-avatar {
  font-size: 20px;
}

.no-img {
  height: 100%;
  display: grid;
  place-items: center;
  color: #9e846b;
  font-size: 13px;
}

/* 移动端卡片列表样式 */
.mobile-card-list {
  display: none;
}

.card-title-wrap {
  flex: 1;
  overflow: hidden;
}

.card-subtitle {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.no-avatar-card {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f6ecdf;
  font-size: 24px;
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }

  .page h2 {
    font-size: 18px;
    margin-bottom: 16px;
  }

  .mobile-card-list {
    display: block;
  }

  .mobile-card-list .el-card {
    margin-bottom: 12px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .mobile-card-list .el-card:active {
    transform: scale(0.98);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .card-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .card-title {
    font-weight: 700;
    font-size: 16px;
    color: #4a3a2c;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-body {
    display: grid;
    gap: 10px;
  }

  .card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-label {
    color: #7d624b;
    font-size: 13px;
  }

  /* 移动端抽屉优化 */
  :deep(.el-drawer) {
    width: 90% !important;
    max-width: 400px;
  }

  .info-card,
  .obs-card {
    margin-bottom: 12px;
  }

  .info-row {
    flex-wrap: wrap;
    gap: 6px;
  }

  .info-row .label {
    width: 65px;
    font-size: 13px;
  }

  .main-photo {
    height: 200px;
  }

  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
  }

  .obs-form-tools {
    flex-wrap: wrap;
  }

  .obs-header {
    flex-wrap: wrap;
    gap: 6px;
  }

  .obs-time {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .page {
    padding: 12px;
  }

  .card-avatar {
    width: 48px;
    height: 48px;
  }

  .card-title {
    font-size: 15px;
  }

  .main-photo {
    height: 180px;
  }
}
</style>