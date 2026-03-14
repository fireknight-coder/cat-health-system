//居民发现猫的整个流程
import request from '@/api/request'

//创建居民提交的报告数据表单
export interface ReportCreatePayload {
  mediaUrls: string[]
  lat?: number
  lng?: number
  address?: string
  reportedAt: string
  remark?: string
}

export interface ReportItem {
  id: string
  status: string
  type?: string
  description?: string
  images?: string[]
  videos?: string[]
  location?: {
    lat: number
    lng: number
    address?: string
  }
  reportedAt?: string
  remark?: string
  reporterId?: { id?: string; username?: string }
  catId?: string
  // AI处理相关
  aiProcessed?: boolean
  aiEmbedding?: number[]
  aiHealthScore?: number
  aiRiskLevel?: string
  aiTopK?: { catId: { _id?: string; name?: string }; similarity: number; avatar?: string }[]
  aiHealthNotes?: string
  // 审核相关
  adminNotes?: string
  rejectReason?: string
  processedAt?: string
  createdAt: string
  updatedAt?: string
}

export function createReport(data: ReportCreatePayload) {
  return request.post<{ id: string }>('/report', data)
}

export function getReportList(params?: { status?: string; page?: number; pageSize?: number }) {
  return request.get<{ list: ReportItem[]; total: number }>('/report', { params })
}

export function getReportById(id: string) {
  return request.get<ReportItem>(`/report/${id}`)
}

export function approveMatchExisting(reportId: string, catId: string, adminNotes?: string) {
  return request.post(`/report/${reportId}/approve-match`, { catId, adminNotes })
}

export function approveNewCat(reportId: string, catData?: {
  name?: string
  age?: number
  gender?: string
  breed?: string
  color?: string
  healthNotes?: string
  adminNotes?: string
}) {
  return request.post(`/report/${reportId}/approve-new`, catData || {})
}

export function rejectReport(reportId: string, reason?: string) {
  return request.post(`/report/${reportId}/reject`, { reason })
}