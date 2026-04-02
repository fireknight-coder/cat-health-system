<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElButton, ElEmpty, ElInput, ElMessage, ElMessageBox, ElSwitch, ElTag } from 'element-plus'
import type { UploadFile, UploadFiles } from 'element-plus'
import {
  createCommunityComment,
  createCommunityPost,
  deleteCommunityPost,
  getCommunityPosts,
  setCommunityPostPin,
  toggleCommunityPostLike,
  uploadCommunityMedia,
  type CommunityPostItem
} from '@/api/modules/community'
import { useAuthStore } from '@/stores/auth'

type ComposeMode = 'text' | 'image' | 'video'
type TabKey = 'all' | 'announcement' | 'dynamic'
type MediaRenderItem = { key: string; type: 'image' | 'video'; url: string }

const auth = useAuthStore()

const loading = ref(false)
const publishing = ref(false)
const posts = ref<CommunityPostItem[]>([])
const mediaFiles = ref<UploadFile[]>([])

const activeTab = ref<TabKey>('all')
const showFabActions = ref(false)
const composerVisible = ref(false)
const composeMode = ref<ComposeMode>('text')
const commentDrafts = reactive<Record<string, string>>({})
const commentSubmittingId = ref('')

const form = reactive({
  content: '',
  isAnnouncement: false
})

const canPublishAnnouncement = computed(() => auth.isAdmin)
const canManagePost = computed(() => auth.isAdmin)
const composerNeedsMedia = computed(() => composeMode.value !== 'text')

const composerTitle = computed(() => {
  if (composeMode.value === 'image') return '发布图片帖'
  if (composeMode.value === 'video') return '发布视频帖'
  return '发布文字帖'
})

const mediaAccept = computed(() => {
  if (composeMode.value === 'image') return 'image/*'
  if (composeMode.value === 'video') return 'video/*'
  return 'image/*,video/*'
})

const mediaLimit = computed(() => (composeMode.value === 'video' ? 3 : 9))

function formatRole(role: string) {
  if (role === 'superadmin') return '超级管理员'
  if (role === 'admin') return '管理员'
  if (role === 'pending_admin') return '申请中用户'
  return '用户'
}

function formatTime(time: string) {
  const d = new Date(time)
  if (Number.isNaN(d.getTime())) return time
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function collectMedia(post: CommunityPostItem): MediaRenderItem[] {
  const images: MediaRenderItem[] = (post.images || [])
    .map((url) => (typeof url === 'string' ? url.trim() : ''))
    .filter((url) => Boolean(url))
    .map((url, idx) => ({ key: `img-${post.id}-${idx}`, type: 'image', url }))
  const videos: MediaRenderItem[] = (post.videos || [])
    .map((url) => (typeof url === 'string' ? url.trim() : ''))
    .filter((url) => Boolean(url))
    .map((url, idx) => ({ key: `video-${post.id}-${idx}`, type: 'video', url }))
  return [...images, ...videos]
}

function toggleFabActions() {
  showFabActions.value = !showFabActions.value
}

function openComposer(mode: ComposeMode) {
  composeMode.value = mode
  showFabActions.value = false
  composerVisible.value = true
  mediaFiles.value = []
}

function clearComposer() {
  form.content = ''
  form.isAnnouncement = false
  mediaFiles.value = []
  composeMode.value = 'text'
}

function handleMediaChange(_file: UploadFile, files: UploadFiles) {
  if (!composerNeedsMedia.value) {
    mediaFiles.value = []
    return
  }
  const mimePrefix = composeMode.value === 'video' ? 'video/' : 'image/'
  mediaFiles.value = files.filter((item) => String(item.raw?.type || '').startsWith(mimePrefix))
}

async function loadPosts(tab: TabKey = activeTab.value) {
  loading.value = true
  try {
    const res = await getCommunityPosts({ pageSize: 50, tab })
    posts.value = (res as any)?.data?.list ?? []
  } catch {
    posts.value = []
  } finally {
    loading.value = false
  }
}

async function publishPost() {
  const text = form.content.trim()
  const rawFiles = mediaFiles.value
    .map((item) => item.raw as File | undefined)
    .filter((item): item is File => Boolean(item))

  if (!text && rawFiles.length === 0) {
    ElMessage.warning('请输入内容或上传媒体')
    return
  }

  publishing.value = true
  try {
    let images: string[] = []
    let videos: string[] = []

    if (rawFiles.length > 0) {
      const uploadRes = await uploadCommunityMedia(rawFiles)
      const media = (uploadRes as any)?.data?.media ?? []
      images = media.filter((item: any) => item.type === 'image').map((item: any) => item.url)
      videos = media.filter((item: any) => item.type === 'video').map((item: any) => item.url)
    }

    await createCommunityPost({
      content: text,
      images,
      videos,
      isAnnouncement: canPublishAnnouncement.value ? form.isAnnouncement : false
    })

    ElMessage.success('发布成功')
    composerVisible.value = false
    clearComposer()
    await loadPosts()
  } catch {
    ElMessage.error('发布失败，请稍后重试')
  } finally {
    publishing.value = false
  }
}

async function toggleLike(post: CommunityPostItem) {
  try {
    await toggleCommunityPostLike(post.id)
    await loadPosts()
  } catch {
    ElMessage.error('点赞操作失败')
  }
}

async function sendComment(post: CommunityPostItem) {
  const content = (commentDrafts[post.id] || '').trim()
  if (!content) {
    ElMessage.warning('请先输入评论内容')
    return
  }
  if (commentSubmittingId.value) return

  commentSubmittingId.value = post.id
  try {
    await createCommunityComment(post.id, { content })
    commentDrafts[post.id] = ''
    await loadPosts()
  } catch {
    ElMessage.error('评论发送失败')
  } finally {
    commentSubmittingId.value = ''
  }
}

async function togglePin(post: CommunityPostItem) {
  try {
    await setCommunityPostPin(post.id, !post.isPinned)
    ElMessage.success(post.isPinned ? '已取消置顶' : '已置顶')
    await loadPosts()
  } catch {
    ElMessage.error('置顶操作失败')
  }
}

async function removePost(post: CommunityPostItem) {
  try {
    await ElMessageBox.confirm('删除后不可恢复，确定删除该帖子吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteCommunityPost(post.id)
    ElMessage.success('帖子已删除')
    await loadPosts()
  } catch (err: any) {
    if (err && err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

watch(activeTab, (tab) => {
  loadPosts(tab)
})

onMounted(() => loadPosts('all'))
</script>

<template>
  <div class="community-page">
    <div class="head-row">
      <div>
        <h2>哈基米社区</h2>
        <p class="sub">分享日常、互助求助、公告通知都在这里</p>
      </div>
      <el-tag class="role-tag" type="warning">当前身份：{{ formatRole(auth.role) }}</el-tag>
    </div>

    <div class="tab-row">
      <button class="tab-btn" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">全部</button>
      <button class="tab-btn" :class="{ active: activeTab === 'announcement' }" @click="activeTab = 'announcement'">公告</button>
      <button class="tab-btn" :class="{ active: activeTab === 'dynamic' }" @click="activeTab = 'dynamic'">动态</button>
    </div>

    <div class="feed" v-loading="loading">
      <article v-for="post in posts" :key="post.id" class="post-card">
        <div class="post-top">
          <div class="author">
            <strong>{{ post.authorName }}</strong>
            <span class="meta">（{{ formatRole(post.authorRole) }}）</span>
          </div>
          <div class="tag-group">
            <el-tag v-if="post.isPinned" type="warning" size="small">置顶</el-tag>
            <el-tag v-if="post.isAnnouncement" type="danger" size="small">公告</el-tag>
            <span class="meta">{{ formatTime(post.createdAt) }}</span>
          </div>
        </div>

        <p v-if="post.content" class="post-content">{{ post.content }}</p>

        <div v-if="collectMedia(post).length" class="media-masonry">
          <div v-for="media in collectMedia(post)" :key="media.key" class="media-cell">
            <img v-if="media.type === 'image'" :src="media.url" class="media-item" />
            <video v-else :src="media.url" class="media-item" controls preload="metadata" />
          </div>
        </div>

        <div class="action-row">
          <div class="left-actions">
            <button class="mini-action" :class="{ liked: post.likedByMe }" @click="toggleLike(post)">
              {{ post.likedByMe ? '已赞' : '点赞' }} {{ post.likeCount || 0 }}
            </button>
            <span class="count-text">评论 {{ post.commentCount || 0 }}</span>
          </div>
          <div class="right-actions" v-if="canManagePost">
            <ElButton link type="warning" @click="togglePin(post)">{{ post.isPinned ? '取消置顶' : '置顶' }}</ElButton>
            <ElButton link type="danger" @click="removePost(post)">删除</ElButton>
          </div>
        </div>

        <div class="comment-panel">
          <div v-if="post.comments && post.comments.length" class="comment-list">
            <div v-for="(comment, idx) in post.comments" :key="comment.id + '-' + idx" class="comment-item">
              <div class="comment-top">
                <strong>{{ comment.username }}</strong>
                <span class="meta">（{{ formatRole(comment.userRole) }}）</span>
                <span class="meta">{{ formatTime(comment.createdAt) }}</span>
              </div>
              <p>{{ comment.content }}</p>
            </div>
          </div>

          <div class="comment-input-row">
            <ElInput
              v-model="commentDrafts[post.id]"
              :rows="1"
              type="textarea"
              placeholder="写下你的评论..."
              resize="none"
            />
            <ElButton type="primary" :loading="commentSubmittingId === post.id" @click="sendComment(post)">发送</ElButton>
          </div>
        </div>
      </article>

      <ElEmpty v-if="!loading && posts.length === 0" description="当前分类暂无帖子" />
    </div>

    <transition name="fab-fade">
      <div v-if="showFabActions" class="fab-actions">
        <button class="fab-action" @click="openComposer('text')">发文字</button>
        <button class="fab-action" @click="openComposer('image')">发图片</button>
        <button class="fab-action" @click="openComposer('video')">发视频</button>
      </div>
    </transition>

    <button class="fab-main" @click="toggleFabActions">{{ showFabActions ? '×' : '+' }}</button>

    <el-dialog v-model="composerVisible" :title="composerTitle" width="680px" @closed="clearComposer">
      <ElInput
        v-model="form.content"
        type="textarea"
        :rows="4"
        :placeholder="composeMode === 'text' ? '写点想分享的内容...' : '可选：为媒体补充说明...'"
      />

      <div v-if="composerNeedsMedia" class="tool-row">
        <el-upload
          :auto-upload="false"
          :limit="mediaLimit"
          :accept="mediaAccept"
          list-type="picture-card"
          :on-change="handleMediaChange"
        >
          <ElButton size="small">选择{{ composeMode === 'video' ? '视频' : '图片' }}</ElButton>
        </el-upload>
      </div>

      <div class="dialog-actions">
        <ElSwitch
          v-if="canPublishAnnouncement"
          v-model="form.isAnnouncement"
          active-text="作为公告发布"
          inactive-text="普通帖子"
        />
        <div class="right-buttons">
          <ElButton @click="composerVisible = false">取消</ElButton>
          <ElButton type="primary" :loading="publishing" @click="publishPost">发布</ElButton>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.community-page {
  position: relative;
  min-height: calc(100vh - 120px);
  padding: 16px 16px 120px;
  border-radius: 22px;
  border: 1px solid #f2dfc9;
  box-shadow: 0 14px 32px rgba(118, 84, 52, 0.12);
  background:
    radial-gradient(circle at 8% 8%, rgba(255, 228, 201, 0.56), transparent 42%),
    radial-gradient(circle at 92% 14%, rgba(255, 240, 220, 0.55), transparent 38%),
    linear-gradient(180deg, #fffdf9 0%, #fff8ef 100%);
}

.community-page::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.26;
  background-image: radial-gradient(rgba(126, 88, 52, 0.12) 0.8px, transparent 0.8px);
  background-size: 10px 10px;
  border-radius: inherit;
}

.head-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  gap: 10px;
}

.head-row h2 {
  margin: 0;
  color: #573c2a;
  letter-spacing: 0.2px;
  font-size: 34px;
}

.sub {
  margin: 6px 0 0;
  color: #856448;
  font-size: 14px;
}

.role-tag {
  border: none;
  background: #fff3e3;
  color: #9b6338;
}

.tab-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.tab-btn {
  border: 1px solid #efd7bc;
  background: linear-gradient(145deg, #fff9f2, #f7ebdc);
  color: #83593a;
  border-radius: 999px;
  padding: 7px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.tab-btn.active {
  background: linear-gradient(145deg, #f6cda1, #ebba87);
  color: #5a3a22;
  border-color: #e6b885;
  box-shadow: 0 8px 18px rgba(160, 107, 53, 0.24);
}

.feed {
  display: grid;
  gap: 14px;
}

.post-card {
  position: relative;
  border: 1px solid #f1deca;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.93);
  box-shadow: 0 12px 26px rgba(152, 101, 52, 0.1);
  transition: transform 0.24s ease, box-shadow 0.24s ease;
  animation: card-in 0.35s ease both;
  padding: 15px;
}

.post-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  border-radius: 18px 0 0 18px;
  background: linear-gradient(180deg, #f2be89 0%, #e39e63 100%);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(152, 101, 52, 0.16);
}

.post-card:hover::before {
  opacity: 1;
}

.post-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.author {
  color: #533a2b;
}

.tag-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta {
  color: #a98d74;
  font-size: 12px;
}

.post-content {
  margin: 12px 0 2px;
  color: #5f4938;
  line-height: 1.72;
  white-space: pre-wrap;
}

.media-masonry {
  margin-top: 10px;
  column-count: 3;
  column-gap: 10px;
}

.media-cell {
  break-inside: avoid;
  margin-bottom: 10px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #f0deca;
  background: #f7ecdf;
}

.media-item {
  width: 100%;
  display: block;
  max-height: 360px;
  object-fit: cover;
  background: #f0e0ce;
}

.action-row {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mini-action {
  border: 0;
  background: linear-gradient(145deg, #fff0df, #fde1c2);
  color: #8f5833;
  border-radius: 999px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.22s ease;
  font-weight: 600;
}

.mini-action:hover {
  background: linear-gradient(145deg, #ffe8d0, #fddeb6);
}

.mini-action.liked {
  background: linear-gradient(145deg, #ffd9cf, #f9c0b4);
  color: #b84b3f;
}

.count-text {
  color: #96775c;
  font-size: 13px;
}

.comment-panel {
  margin-top: 10px;
  border-top: 1px solid #f3e4d3;
  padding-top: 10px;
}

.comment-list {
  max-height: 190px;
  overflow: auto;
  display: grid;
  gap: 8px;
  margin-bottom: 8px;
}

.comment-item {
  border-radius: 12px;
  background: #fff8ef;
  border: 1px solid #f4e8d9;
  padding: 8px 10px;
}

.comment-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.comment-item p {
  margin: 0;
  color: #5e4632;
  line-height: 1.6;
  white-space: pre-wrap;
}

.comment-input-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
}

.fab-main {
  position: fixed;
  right: 26px;
  bottom: 26px;
  width: 58px;
  height: 58px;
  border: 0;
  border-radius: 50%;
  font-size: 32px;
  line-height: 58px;
  text-align: center;
  color: #fff7ed;
  cursor: pointer;
  background: linear-gradient(160deg, #f5a765 0%, #d97739 100%);
  box-shadow: 0 16px 30px rgba(168, 96, 45, 0.38);
  transition: transform 0.24s ease;
  z-index: 30;
}

.fab-main:hover {
  transform: translateY(-2px) scale(1.06);
}

.fab-actions {
  position: fixed;
  right: 26px;
  bottom: 92px;
  display: grid;
  gap: 8px;
  z-index: 30;
}

.fab-action {
  border: 1px solid #f1d4b6;
  background: linear-gradient(145deg, #fff9f0, #f7ecdd);
  color: #8f603b;
  padding: 8px 12px;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 8px 16px rgba(147, 96, 54, 0.16);
}

.fab-action:hover {
  background: linear-gradient(145deg, #ffe8cf, #ffdcb7);
}

.fab-fade-enter-active,
.fab-fade-leave-active {
  transition: all 0.22s ease;
}

.fab-fade-enter-from,
.fab-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.tool-row {
  margin-top: 12px;
}

.dialog-actions {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.right-buttons {
  display: flex;
  gap: 8px;
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 960px) {
  .media-masonry {
    column-count: 2;
  }
}

@media (max-width: 700px) {
  .community-page {
    padding: 10px 10px 100px;
    border-radius: 14px;
  }

  .head-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .head-row h2 {
    font-size: 28px;
  }

  .media-masonry {
    column-count: 1;
  }

  .fab-main {
    right: 16px;
    bottom: 16px;
  }

  .fab-actions {
    right: 16px;
    bottom: 82px;
  }

  .comment-input-row {
    grid-template-columns: 1fr;
  }
}
</style>
