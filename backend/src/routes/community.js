import express from 'express'
import { CommunityPost } from '../models/CommunityPost.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import { communityUpload } from '../middleware/upload.js'

const router = express.Router()

function toSafeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeMediaUrls(list) {
  if (!Array.isArray(list)) return []
  return list
    .map((item) => toSafeString(item))
    .filter((item) => Boolean(item))
}

function normalizeComments(comments) {
  if (!Array.isArray(comments)) return []
  return comments
    .map((item) => {
      const source = item && typeof item.toObject === 'function' ? item.toObject() : (item || {})
      return {
        id: String(source._id || ''),
        userId: String(source.userId || ''),
        username: toSafeString(source.username) || '匿名用户',
        userRole: source.userRole || 'user',
        content: toSafeString(source.content),
        createdAt: source.createdAt || new Date().toISOString()
      }
    })
    .filter((item) => Boolean(item.content))
}

function formatPost(post, currentUserId) {
  const source = post && typeof post.toObject === 'function' ? post.toObject() : (post || {})
  const likes = Array.isArray(source.likes) ? source.likes : []
  const comments = normalizeComments(source.comments)
  const userIdText = String(currentUserId || '')

  return {
    id: String(source._id || ''),
    authorId: String(source.authorId || ''),
    authorName: source.authorName || '匿名用户',
    authorRole: source.authorRole || 'user',
    content: source.content || '',
    images: normalizeMediaUrls(source.images),
    videos: normalizeMediaUrls(source.videos),
    isAnnouncement: Boolean(source.isAnnouncement),
    isPinned: Boolean(source.isPinned),
    tags: Array.isArray(source.tags) ? source.tags : [],
    likeCount: likes.length,
    commentCount: comments.length,
    likedByMe: userIdText ? likes.some((item) => String(item) === userIdText) : false,
    comments,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt
  }
}

router.post('/upload', authenticateToken, communityUpload.array('files', 9), async (req, res) => {
  try {
    const files = req.files || []
    const media = files.map((file) => ({
      url: `${req.protocol}://${req.get('host')}/uploads/community/${file.filename}`,
      type: file.mimetype?.startsWith('video/') ? 'video' : 'image'
    }))
    res.json({ success: true, data: { media } })
  } catch {
    res.status(500).json({ success: false, message: '社区素材上传失败' })
  }
})

router.get('/posts', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20))
    const tab = toSafeString(req.query.tab)
    const query = {}
    if (tab === 'announcement') query.isAnnouncement = true
    if (tab === 'dynamic') query.isAnnouncement = false

    const posts = await CommunityPost.find(query)
      .sort({ isPinned: -1, isAnnouncement: -1, createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)

    const total = await CommunityPost.countDocuments(query)
    const list = posts.map((item) => formatPost(item, req.user?._id))

    res.json({ success: true, data: { list, total } })
  } catch {
    res.status(500).json({ success: false, message: '获取社区帖子失败' })
  }
})

router.post('/posts', authenticateToken, async (req, res) => {
  try {
    const content = toSafeString(req.body?.content)
    const images = normalizeMediaUrls(req.body?.images)
    const videos = normalizeMediaUrls(req.body?.videos)
    const tags = Array.isArray(req.body?.tags) ? req.body.tags.map((item) => toSafeString(item)).filter((item) => Boolean(item)) : []
    const canAnnouncement = req.user?.role === 'admin' || req.user?.role === 'superadmin'

    if (!content && images.length === 0 && videos.length === 0) {
      return res.status(400).json({ success: false, message: '帖子内容不能为空' })
    }

    const post = await CommunityPost.create({
      authorId: req.user?._id,
      authorName: req.user?.username || '匿名用户',
      authorRole: req.user?.role || 'user',
      content,
      images,
      videos,
      tags,
      isAnnouncement: Boolean(req.body?.isAnnouncement) && canAnnouncement,
      isPinned: false,
      likes: [],
      comments: []
    })

    res.json({ success: true, data: formatPost(post, req.user?._id) })
  } catch {
    res.status(500).json({ success: false, message: '发布帖子失败' })
  }
})

router.post('/posts/:id/like-toggle', authenticateToken, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' })
    }

    const currentUserId = String(req.user?._id || '')
    if (!currentUserId) {
      return res.status(401).json({ success: false, message: '未登录' })
    }

    if (!Array.isArray(post.likes)) {
      post.likes = []
    }

    const index = post.likes.findIndex((item) => String(item) === currentUserId)
    let liked = false
    if (index >= 0) {
      post.likes.splice(index, 1)
    } else {
      post.likes.push(req.user?._id)
      liked = true
    }

    await post.save()
    res.json({
      success: true,
      message: liked ? '已点赞' : '已取消点赞',
      data: {
        post: formatPost(post, currentUserId),
        liked
      }
    })
  } catch {
    res.status(500).json({ success: false, message: '点赞操作失败' })
  }
})

router.get('/posts/:id/comments', authenticateToken, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id).select('comments')
    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' })
    }
    const comments = normalizeComments(post.comments || [])
    res.json({ success: true, data: { list: comments, total: comments.length } })
  } catch {
    res.status(500).json({ success: false, message: '获取评论失败' })
  }
})

router.post('/posts/:id/comments', authenticateToken, async (req, res) => {
  try {
    const content = toSafeString(req.body?.content)
    if (!content) {
      return res.status(400).json({ success: false, message: '评论内容不能为空' })
    }
    if (content.length > 500) {
      return res.status(400).json({ success: false, message: '评论内容不能超过500字' })
    }

    const post = await CommunityPost.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' })
    }

    if (!Array.isArray(post.comments)) {
      post.comments = []
    }

    post.comments.push({
      userId: req.user?._id,
      username: req.user?.username || '匿名用户',
      userRole: req.user?.role || 'user',
      content
    })

    await post.save()
    const comments = normalizeComments(post.comments || [])
    const latestComment = comments.length ? comments[comments.length - 1] : null
    res.json({
      success: true,
      message: '评论成功',
      data: {
        post: formatPost(post, req.user?._id),
        comment: latestComment
      }
    })
  } catch {
    res.status(500).json({ success: false, message: '评论失败' })
  }
})

router.patch('/posts/:id/pin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' })
    }

    post.isPinned = Boolean(req.body?.isPinned)
    await post.save()
    res.json({
      success: true,
      message: post.isPinned ? '已置顶' : '已取消置顶',
      data: formatPost(post, req.user?._id)
    })
  } catch {
    res.status(500).json({ success: false, message: '置顶操作失败' })
  }
})

router.delete('/posts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const post = await CommunityPost.findByIdAndDelete(req.params.id)
    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' })
    }
    res.json({ success: true, message: '帖子已删除' })
  } catch {
    res.status(500).json({ success: false, message: '删除帖子失败' })
  }
})

export default router
