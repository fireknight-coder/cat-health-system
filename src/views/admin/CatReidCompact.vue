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
const resultTone = computed(() => (result.value?.decision === 'old_cat' ? 'is-old' : 'is-new'))

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
  } catch (error: any) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.label ||
      error?.message ||
      '识别失败，请稍后再试'
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="cat-reid-page">
    <section class="hero">
      <p class="eyebrow">CAT RE-ID PANEL</p>
      <h2>猫咪新旧身份识别</h2>
      <p class="hero-copy">上传一张猫咪照片。页面将返回判定为老猫或判定为新猫。</p>
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

          <div class="result-cards">
            <div class="result-card">
              <span>判定结果</span>
              <strong>{{ result.decision === 'old_cat' ? '老猫' : '新猫' }}</strong>
            </div>

            <div class="result-card">
              <span>匹配猫档案编号</span>
              <strong>{{ result.bestCatId ?? '未命中' }}</strong>
            </div>

            <div class="result-card image-card">
              <span>匹配猫档案图片</span>
              <img
                v-if="result.matchedCatImageUrl"
                :src="result.matchedCatImageUrl"
                :alt="result.matchedCatImageName || '匹配猫图片'"
                class="result-card-image"
              />
              <div v-else class="result-card-placeholder">暂无匹配图</div>
              <small>{{ result.bestCatId ? `编号 ${result.bestCatId}` : '未命中' }}</small>
            </div>
          </div>
        </div>

        <div v-else class="result-empty">
          <p>结果会在这里显示</p>
          <span>识别后会返回老猫或者新猫</span>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.cat-reid-page {
  display: grid;
  gap: 14px;
  padding: 8px;
}

.hero {
  border-radius: 22px;
  border: 1px solid #ead9c5;
  background:
    radial-gradient(circle at 86% 18%, rgba(255, 232, 204, 0.6), transparent 30%),
    radial-gradient(circle at 8% 14%, rgba(255, 255, 255, 0.9), transparent 32%),
    linear-gradient(150deg, #fffaf3 0%, #f4e9dc 55%, #efdfcb 100%);
  box-shadow: 0 14px 28px rgba(125, 90, 56, 0.1);
  padding: 14px 24px;
}

.eyebrow {
  margin: 0 0 4px;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #a27958;
  font-weight: 700;
}

.hero h2 {
  margin: 0;
  color: #503827;
  font-size: 28px;
  line-height: 1.2;
}

.hero-copy {
  margin: 8px 0 0;
  max-width: 760px;
  color: #745943;
  line-height: 1.55;
}

.workspace {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
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
  min-height: 360px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
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
  min-height: 260px;
  border-radius: 20px;
  border: 1px dashed #d7bea0;
  background: linear-gradient(180deg, rgba(255, 250, 243, 0.96), rgba(247, 237, 223, 0.94));
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
  max-height: 210px;
  object-fit: cover;
  border-radius: 18px;
  box-shadow: 0 12px 24px rgba(101, 75, 51, 0.12);
}

.preview-meta {
  margin-top: 10px;
  display: grid;
  gap: 4px;
}

.preview-meta strong {
  font-size: 18px;
}

.panel-actions {
  display: flex;
  gap: 12px;
  margin-top: 14px;
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
  min-height: 52px;
  padding: 0 20px;
  border-radius: 999px;
  font-size: 22px;
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

.result-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.result-card {
  border-radius: 16px;
  border: 1px solid #eadcca;
  background: rgba(255, 255, 255, 0.78);
  padding: 14px 12px;
  min-height: 180px;
  display: grid;
  align-content: center;
  gap: 8px;
  text-align: center;
}

.result-card span {
  color: #8a6c54;
  font-size: 14px;
}

.result-card strong {
  color: #503828;
  font-size: 26px;
}

.image-card {
  align-content: start;
}

.result-card-image {
  width: 100%;
  height: 118px;
  object-fit: cover;
  border-radius: 14px;
  box-shadow: 0 8px 18px rgba(101, 75, 51, 0.12);
}

.result-card-placeholder {
  width: 100%;
  height: 118px;
  border-radius: 14px;
  border: 1px dashed #dfccb6;
  display: grid;
  place-items: center;
  color: #8a6c54;
  background: linear-gradient(180deg, rgba(255, 250, 244, 0.9), rgba(244, 235, 225, 0.9));
}

.image-card small {
  color: #8a6c54;
  font-size: 13px;
}

@media (max-width: 1100px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .result-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .cat-reid-page {
    padding: 4px;
  }

  .hero {
    padding: 14px 16px;
  }

  .hero h2,
  .panel-head h3 {
    font-size: 24px;
  }

  .panel-actions {
    flex-direction: column;
  }
}
</style>
