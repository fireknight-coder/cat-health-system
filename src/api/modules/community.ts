import request from '@/api/request'

export interface CommunityCommentItem {
  id: string
  userId?: string
  username: string
  userRole: 'user' | 'admin' | 'superadmin' | 'pending_admin' | 'guest'
  content: string
  createdAt: string
}

export interface CommunityPostItem {
  id: string
  authorId?: string
  authorName: string
  authorRole: 'user' | 'admin' | 'superadmin' | 'pending_admin' | 'guest'
  content?: string
  images?: string[]
  videos?: string[]
  isAnnouncement?: boolean
  isPinned?: boolean
  tags?: string[]
  likeCount?: number
  commentCount?: number
  likedByMe?: boolean
  comments?: CommunityCommentItem[]
  createdAt: string
  updatedAt?: string
}

export function getCommunityPosts(params?: { page?: number; pageSize?: number; tab?: 'all' | 'announcement' | 'dynamic' }) {
  return request.get<{ list: CommunityPostItem[]; total: number }>('/community/posts', { params })
}

export function createCommunityPost(data: {
  content?: string
  images?: string[]
  videos?: string[]
  isAnnouncement?: boolean
  tags?: string[]
}) {
  return request.post<CommunityPostItem>('/community/posts', data)
}

export function uploadCommunityMedia(files: File[]) {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  return request.post<{ media: { url: string; type: 'image' | 'video' }[] }>('/community/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function toggleCommunityPostLike(postId: string) {
  return request.post<{ post: CommunityPostItem; liked: boolean }>(`/community/posts/${postId}/like-toggle`)
}

export function getCommunityComments(postId: string) {
  return request.get<{ list: CommunityCommentItem[]; total: number }>(`/community/posts/${postId}/comments`)
}

export function createCommunityComment(postId: string, data: { content: string }) {
  return request.post<{ post: CommunityPostItem; comment: CommunityCommentItem }>(`/community/posts/${postId}/comments`, data)
}

export function setCommunityPostPin(postId: string, isPinned: boolean) {
  return request.patch<CommunityPostItem>(`/community/posts/${postId}/pin`, { isPinned })
}

export function deleteCommunityPost(postId: string) {
  return request.delete(`/community/posts/${postId}`)
}
