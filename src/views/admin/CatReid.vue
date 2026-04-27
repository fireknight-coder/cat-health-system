<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { identifyCatImage, type CatReidResult } from '@/api/modules/catReid'

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')
const loading = ref(false)
const result = ref<CatReidResult | null>(null)

const hasImage = computed(() => Boolean(selectedFile.value && previewUrl.value))
const resultTone = computed(() => result.value?.decision === 'old_cat' ? 'is-old' : 'is-new')

function openFilePicker() {
  fileInput.value?.click()
}

function resetSelection() {
  selectedFile.value = null
  previewUrl.value = ''
  result.value = null
}

function updateSelectedFile(file?: File | null) {
  if (!file) return
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
  result.value = null
}

function onInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  updateSelectedFile(target.files?.[0] ?? null)
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  updateSelectedFile(event.dataTransfer?.files?.[0] ?? null)
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
}

async function runIdentify() {
  if (!selectedFile.value) {
    ElMessage.warning('请先上传一张猫咪图片')
    return
  }

  loading.value = true
  try {
    result.value = await identifyCatImage(selectedFile.value)
  } catch {
    ElMessage.error('识别失败，请稍后再试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="cat-reid-page">
    <section class="hero">
      <div>
        <p class="eyebrow">CAT RE-ID PANEL</p>
        <h2>猫咪新旧身份识别</h2>
        <p class="hero-copy">
          上传一张猫咪照片，页面将返回“判定为老猫”或“判定为新猫”。
          整体界面沿用你截图里的暖米白、浅金棕色系，保持简单、干净和稳定。
        </p>
      </div>
      <div class="hero-badge">
        <span>轻量界面</span>
        <strong>上传 + 判定</strong>
      </div>
    </section>

    <section class="workspace">
      <article class="panel upload-panel">
        <div class="panel-head">
          <h3>上传猫咪图片</h3>
          <span class="chip">输入区</span>
        </div>

        <div
          class="dropzone"
          @click="openFilePicker"
          @drop="onDrop"
          @dragover="onDragOver"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden-input"
            @change="onInputChange"
          />

          <template v-if="hasImage">
            <img :src="previewUrl" alt="猫咪预览" class="preview-image" />
            <div class="preview-meta">
              <strong>{{ selectedFile?.name }}</strong>
              <span>{{ Math.round((selectedFile?.size || 0) / 1024) }} KB</span>
            </div>
          </template>

          <template v-else>
            <div class="drop-icon">+</div>
            <strong>点击上传或拖拽图片到这里</strong>
            <span>支持 JPG / PNG / WEBP</span>
          </template>
        </div>

        <div class="panel-actions">
          <el-button class="action-btn primary-btn" :loading="loading" @click="runIdentify">
            开始识别
          </el-button>
          <el-button class="action-btn" plain @click="resetSelection">
            重新选择
          </el-button>
        </div>
      </article>

      <article class="panel result-panel" :class="resultTone">
        <div class="panel-head">
          <h3>识别结果</h3>
          <span class="chip">输出区</span>
        </div>

        <div v-if="result" class="result-content">
          <div class="result-badge" :class="resultTone">
            {{ result.label }}
          </div>

          <div class="metric-grid">
            <div class="metric-card">
              <span>最终判定</span>
              <strong>{{ result.decision === 'old_cat' ? '老猫' : '新猫' }}</strong>
            </div>
            <div class="metric-card">
              <span>最高相似度</span>
              <strong>{{ result.score?.toFixed(2) ?? '--' }}</strong>
            </div>
            <div class="metric-card">
              <span>阈值</span>
              <strong>{{ result.threshold?.toFixed(2) ?? '--' }}</strong>
            </div>
            <div class="metric-card">
              <span>匹配猫档案</span>
              <strong>{{ result.bestCatId ?? '未命中' }}</strong>
            </div>
          </div>

          <p class="result-note">
            <template v-if="result.decision === 'old_cat'">
              当前图片更像已有猫档案，可按老猫流程继续处理。
            </template>
            <template v-else>
              当前图片没有稳定命中已有档案，可先按新猫录入。
            </template>
          </p>
        </div>

        <div v-else class="result-empty">
          <p>结果会在这里显示</p>
          <span>识别后只返回两种状态：老猫 / 新猫</span>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.cat-reid-page {
  display: grid;
  gap: 18px;
  padding: 8px;
}

.hero {
  display: grid;
  grid-template-columns: 1.3fr 0.7fr;
  gap: 18px;
  border-radius: 24px;
  border: 1px solid #ead9c5;
  background:
    radial-gradient(circle at 86% 18%, rgba(255, 232, 204, 0.6), transparent 30%),
    radial-gradient(circle at 8% 14%, rgba(255, 255, 255, 0.9), transparent 32%),
    linear-gradient(150deg, #fffaf3 0%, #f4e9dc 55%, #efdfcb 100%);
  box-shadow: 0 18px 34px rgba(125, 90, 56, 0.12);
  padding: 24px;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #a27958;
  font-weight: 700;
}

.hero h2 {
  margin: 0;
  color: #503827;
  font-size: 32px;
  line-height: 1.2;
}

.hero-copy {
  margin: 12px 0 0;
  max-width: 720px;
  color: #745943;
  line-height: 1.8;
}

.hero-badge {
  align-self: center;
  justify-self: end;
  width: min(100%, 270px);
  border-radius: 20px;
  border: 1px solid #ead8c0;
  background: rgba(255, 252, 247, 0.78);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  padding: 18px;
  display: grid;
  gap: 8px;
}

.hero-badge span {
  font-size: 12px;
  color: #a37a59;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-badge strong {
  color: #553d2b;
  font-size: 24px;
}

.workspace {
  display: grid;
  grid-template-columns: 1fr 0.92fr;
  gap: 18px;
}

.panel {
  border-radius: 22px;
  border: 1px solid #eadcca;
  background:
    radial-gradient(circle at 90% 10%, rgba(255, 235, 210, 0.55), transparent 24%),
    rgba(255, 255, 255, 0.82);
  box-shadow: 0 14px 30px rgba(117, 82, 50, 0.11);
  padding: 18px;
  min-height: 460px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.panel-head h3 {
  margin: 0;
  font-size: 24px;
  color: #533b2a;
}

.chip {
  border-radius: 999px;
  border: 1px solid #e7ccb0;
  background: #fff0dc;
  color: #946843;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 700;
}

.dropzone {
  min-height: 320px;
  border-radius: 20px;
  border: 1px dashed #d7bea0;
  background:
    linear-gradient(180deg, rgba(255, 250, 243, 0.96), rgba(247, 237, 223, 0.94));
  display: grid;
  place-items: center;
  text-align: center;
  padding: 18px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.dropzone:hover {
  transform: translateY(-1px);
  border-color: #cfa57a;
  box-shadow: 0 10px 18px rgba(129, 95, 61, 0.1);
}

.hidden-input {
  display: none;
}

.drop-icon {
  font-size: 44px;
  color: #cc9360;
  margin-bottom: 8px;
}

.dropzone strong {
  color: #5a4332;
  font-size: 20px;
}

.dropzone span {
  margin-top: 6px;
  color: #8a6e56;
  font-size: 14px;
}

.preview-image {
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  border-radius: 18px;
  box-shadow: 0 12px 24px rgba(101, 75, 51, 0.12);
}

.preview-meta {
  margin-top: 12px;
  display: grid;
  gap: 4px;
}

.preview-meta strong {
  font-size: 18px;
}

.panel-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.action-btn {
  min-width: 124px;
  height: 42px;
  border-radius: 999px;
  border-color: #dcc3a8;
  color: #5d4533;
  background: linear-gradient(145deg, #fff9f1, #f2e4d2);
}

.primary-btn {
  border-color: #d2a677;
  color: #513828;
  background: linear-gradient(145deg, #ffe9cc, #f0d6b5);
}

.result-panel {
  display: flex;
  flex-direction: column;
}

.result-content,
.result-empty {
  flex: 1;
  border-radius: 20px;
  border: 1px solid #efe1d0;
  background: linear-gradient(180deg, rgba(255, 250, 244, 0.92), rgba(248, 240, 230, 0.92));
  padding: 18px;
}

.result-empty {
  display: grid;
  place-items: center;
  text-align: center;
  color: #8d7057;
}

.result-empty p {
  margin: 0;
  font-size: 22px;
  color: #5b4331;
}

.result-badge {
  display: inline-flex;
  align-items: center;
  min-height: 56px;
  padding: 0 22px;
  border-radius: 999px;
  font-size: 24px;
  font-weight: 700;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
}

.result-badge.is-old,
.result-panel.is-old .result-content {
  background:
    radial-gradient(circle at 88% 12%, rgba(255, 226, 188, 0.45), transparent 28%),
    linear-gradient(180deg, rgba(255, 249, 241, 0.98), rgba(245, 232, 214, 0.96));
}

.result-badge.is-old {
  border: 1px solid #d9b188;
  color: #6d4729;
}

.result-badge.is-new,
.result-panel.is-new .result-content {
  background:
    radial-gradient(circle at 88% 12%, rgba(244, 231, 210, 0.52), transparent 30%),
    linear-gradient(180deg, rgba(255, 250, 245, 0.98), rgba(241, 234, 226, 0.96));
}

.result-badge.is-new {
  border: 1px solid #d8c8b5;
  color: #705948;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.metric-card {
  border-radius: 16px;
  border: 1px solid #eadcca;
  background: rgba(255, 255, 255, 0.72);
  padding: 14px;
  display: grid;
  gap: 6px;
}

.metric-card span {
  color: #8a6c54;
  font-size: 13px;
}

.metric-card strong {
  color: #503828;
  font-size: 22px;
}

.result-note {
  margin: 18px 0 0;
  color: #735843;
  line-height: 1.8;
}

@media (max-width: 980px) {
  .hero,
  .workspace {
    grid-template-columns: 1fr;
  }

  .hero-badge {
    justify-self: stretch;
    width: 100%;
  }
}

@media (max-width: 640px) {
  .cat-reid-page {
    padding: 4px;
  }

  .hero {
    padding: 16px;
  }

  .hero h2,
  .panel-head h3 {
    font-size: 24px;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }

  .panel-actions {
    flex-direction: column;
  }
}
</style>
