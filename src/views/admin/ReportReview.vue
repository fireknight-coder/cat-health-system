<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElMessage, ElInput, ElForm, ElFormItem, ElSelect, ElOption } from 'element-plus'
import { getReportById, approveMatchExisting, approveNewCat, rejectReport } from '@/api/modules/report'
import { getCatList } from '@/api/modules/cat'
import { getReportStatusLabel } from '@/stores/dictionary'
import type { ReportItem } from '@/api/modules/report'
import type { CatItem } from '@/api/modules/cat'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id as string)
const report = ref<ReportItem | null>(null)
const catOptions = ref<CatItem[]>([])
const selectedCatId = ref('')
const rejectReason = ref('')
const loading = ref(false)
const actionLoading = ref(false)

// 新猫建档表单
const newCatForm = reactive({
  name: '',
  age: undefined as number | undefined,
  gender: 'unknown',
  breed: '',
  color: '',
  healthNotes: ''
})

async function loadReport() {
  loading.value = true
  try {
    const res = await getReportById(id.value)
    report.value = (res as { data: ReportItem }).data
  } catch {
    report.value = null
  } finally {
    loading.value = false
  }
}

async function loadCats() {
  try {
    const res = await getCatList({ pageSize: 200 })
    catOptions.value = (res as { data: { list: CatItem[] } }).data?.list ?? []
  } catch {
    catOptions.value = []
  }
}

async function handleMatchExisting() {
  if (!selectedCatId.value) {
    ElMessage.warning('请选择要绑定的老猫')
    return
  }
  actionLoading.value = true
  try {
    await approveMatchExisting(id.value, selectedCatId.value)
    ElMessage.success('已绑定老猫并创建出现记录')
    router.push('/admin/reports')
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    actionLoading.value = false
  }
}

async function handleNewCat() {
  if (!newCatForm.name.trim()) {
    ElMessage.warning('请输入猫咪名字')
    return
  }
  actionLoading.value = true
  try {
    await approveNewCat(id.value, newCatForm)
    ElMessage.success(`新猫 "${newCatForm.name}" 建档成功，已生成身份ID卡！`)
    router.push('/admin/reports')
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    actionLoading.value = false
  }
}

async function handleReject() {
  actionLoading.value = true
  try {
    await rejectReport(id.value, rejectReason.value)
    ElMessage.success('已驳回')
    router.push('/admin/reports')
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    actionLoading.value = false
  }
}

function goBack() {
  router.push('/admin/reports')
}

onMounted(() => {
  loadReport()
  loadCats()
})
</script>

<template>
  <div class="page">
    <div class="page-header">
      <el-button @click="goBack">← 返回列表</el-button>
      <h2>上报审核</h2>
      <el-tag v-if="report" :type="report.status === 'PENDING_REVIEW' ? 'warning' : 'success'">
        {{ getReportStatusLabel(report.status as any) }}
      </el-tag>
    </div>
    
    <div v-if="loading" class="loading">加载中...</div>
    <template v-else-if="report">
      <!-- 上报信息 -->
      <div class="section">
        <h3>📍 上报信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">发现时间：</span>
            <span>{{ (report as any).reportedAt || report.createdAt }}</span>
          </div>
          <div class="info-item">
            <span class="label">位置：</span>
            <span>{{ (report as any).address || report.location?.address || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">上报人：</span>
            <span>{{ (report as any).reporterId?.username || '-' }}</span>
          </div>
        </div>
        <!-- 上报图片 -->
        <div class="images" v-if="report.images?.length">
          <img v-for="(img, i) in report.images" :key="i" :src="img" />
        </div>
        <p v-if="report.description" class="description">备注：{{ report.description }}</p>
      </div>
      
      <!-- AI处理结果 -->
      <div class="section ai-result">
        <h3>🤖 AI 处理结果</h3>
        <div class="ai-tags">
          <el-tag :type="report.aiRiskLevel === 'high' ? 'danger' : report.aiRiskLevel === 'medium' ? 'warning' : 'success'">
            风险等级：{{ report.aiRiskLevel || 'low' }}
          </el-tag>
          <el-tag type="info">AI健康评分：{{ report.aiHealthScore ?? '-' }}</el-tag>
        </div>
        <p v-if="report.aiHealthNotes" class="ai-notes">AI健康提示：{{ report.aiHealthNotes }}</p>
        
        <!-- AI 相似猫 Top-K -->
        <div class="topk-section" v-if="(report as any).aiTopK?.length">
          <h4>🐱 AI 相似猫候选（Top-K）</h4>
          <div class="topk-list">
            <div v-for="(c, i) in (report as any).aiTopK" :key="c.catId" class="topk-item">
              <span class="rank">#{{ Number(i) + 1 }}</span>
              <span class="similarity">{{ (Number(c.similarity || 0) * 100).toFixed(1) }}% 相似</span>
              <el-button type="primary" link @click="selectedCatId = c.catId">
                {{ c.catId?.name || c.catId }}
              </el-button>
            </div>
          </div>
        </div>
        <p v-else class="no-candidate">暂无AI匹配候选</p>
      </div>
      
      <!-- 审核操作 -->
      <div class="section actions">
        <h3>📝 审核结论</h3>
        
        <!-- 选项A: 绑定老猫 -->
        <div class="action-card">
          <h4>A. 判定为【老猫（已存在）】</h4>
          <p>绑定到已有猫咪档案，创建出现记录</p>
          <div class="action-form">
            <el-select v-model="selectedCatId" placeholder="选择要绑定的老猫" filterable clearable>
              <el-option v-for="c in catOptions" :key="c.id" :label="`${c.name || '未命名'} (${c.id})`" :value="c.id" />
            </el-select>
            <el-button type="primary" :loading="actionLoading" :disabled="!selectedCatId" @click="handleMatchExisting">
              确认绑定老猫
            </el-button>
          </div>
        </div>
        
        <!-- 选项B: 新猫建档 -->
        <div class="action-card">
          <h4>B. 判定为【新猫（未建档）】</h4>
          <p>创建新的猫咪档案，生成身份ID卡</p>
          <div class="action-form">
            <el-form :model="newCatForm" inline>
              <el-form-item label="名字">
                <el-input v-model="newCatForm.name" placeholder="起个名字" />
              </el-form-item>
              <el-form-item label="年龄">
                <el-input v-model.number="newCatForm.age" type="number" placeholder="估算年龄" />
              </el-form-item>
              <el-form-item label="性别">
                <el-select v-model="newCatForm.gender">
                  <el-option label="未知" value="unknown" />
                  <el-option label="公猫" value="male" />
                  <el-option label="母猫" value="female" />
                </el-select>
              </el-form-item>
              <el-form-item label="品种">
                <el-input v-model="newCatForm.breed" placeholder="如：橘猫" />
              </el-form-item>
            </el-form>
            <el-button type="success" :loading="actionLoading" @click="handleNewCat">
              创建新猫档案
            </el-button>
          </div>
        </div>
        
        <!-- 选项C: 驳回 -->
        <div class="action-card reject">
          <h4>C. 驳回（信息不足/非猫/恶意）</h4>
          <div class="action-form">
            <el-input v-model="rejectReason" placeholder="驳回原因（选填）" style="width: 300px" />
            <el-button type="danger" :loading="actionLoading" @click="handleReject">
              确认驳回
            </el-button>
          </div>
        </div>
      </div>
    </template>
    <div v-else class="empty">未找到该上报</div>
  </div>
</template>

<style scoped>
.page { background: #fff; padding: 24px; border-radius: 8px; }
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.page-header h2 { margin: 0; flex: 1; }

.section { margin-bottom: 24px; padding: 16px; background: #f9fafc; border-radius: 8px; }
.section h3 { margin: 0 0 12px 0; color: #303133; }
.section h4 { margin: 0 0 8px 0; color: #606266; font-size: 14px; }

.info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.info-item { display: flex; gap: 8px; }
.info-item .label { color: #909399; }

.images { display: flex; gap: 8px; margin: 12px 0; flex-wrap: wrap; }
.images img { width: 150px; height: 150px; object-fit: cover; border-radius: 8px; }
.description { color: #606266; margin-top: 12px; }

.ai-result { background: #f0f9ff; }
.ai-tags { display: flex; gap: 8px; margin-bottom: 12px; }
.ai-notes { color: #e6a23c; font-size: 14px; }

.topk-section { margin-top: 12px; }
.topk-list { display: flex; flex-wrap: wrap; gap: 12px; }
.topk-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #fff; border-radius: 8px; }
.topk-item .rank { font-weight: bold; color: #409eff; }
.topk-item .similarity { color: #67c23a; }
.no-candidate { color: #909399; font-style: italic; }

.action-card { padding: 16px; background: #fff; border: 1px solid #ebeef5; border-radius: 8px; margin-bottom: 16px; }
.action-card.reject { border-color: #fde2e2; background: #fef0f0; }
.action-card h4 { color: #303133; margin-bottom: 4px; }
.action-card p { color: #909399; font-size: 13px; margin-bottom: 12px; }
.action-form { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.loading, .empty { text-align: center; padding: 40px; color: #909399; }
</style>