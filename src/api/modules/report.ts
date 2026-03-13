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
  mediaUrls: string[]
  lat?: number
  lng?: number
  address?: string
  reportedAt: string
  remark?: string
  reporterId?: string
  aiTopK?: { catId: string; similarity: number; avatar?: string }[]
  healthScore?: number
  riskLevel?: string
  createdAt: string
}

export function createReport(data: ReportCreatePayload) {
  return request.post<{ id: string }>('/reports', data)
}

export function getReportList(params?: { status?: string; page?: number; pageSize?: number }) {
  return request.get<{ list: ReportItem[]; total: number }>('/reports', { params })
}

export function getReportById(id: string) {
  return request.get<ReportItem>(`/reports/${id}`)
}
//匹配已有的猫
export function approveMatchExisting(reportId: string, catId: string) {
  return request.post(`/reports/${reportId}/approve-match`, { catId })
}
//创建新猫
export function approveNewCat(reportId: string) {
  return request.post<{ catId: string }>(`/reports/${reportId}/approve-new`)
}

export function rejectReport(reportId: string, reason?: string) {
  return request.post(`/reports/${reportId}/reject`, { reason })
}
