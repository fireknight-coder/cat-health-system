import request from '@/api/request'

export interface AdoptionRequestItem {
  id: string
  catId: string
  userId: string
  phone: string
  remark?: string
  status: string
  contactLogs?: { time: string; result: string; note?: string }[]
  followUpRecords?: { time: string; env?: string; relation?: string; needIntervention?: boolean; note?: string }[]
  createdAt: string
}

export function createAdoptionRequest(catId: string, data: { phone: string; remark?: string }) {
  return request.post<{ id: string }>('/adoption-requests', { catId, ...data })
}

export function getAdoptionRequestList(params?: { status?: string; page?: number; pageSize?: number }) {
  return request.get<{ list: AdoptionRequestItem[]; total: number }>('/adoption-requests', { params })
}

export function getAdoptionRequestById(id: string) {
  return request.get<AdoptionRequestItem>(`/adoption-requests/${id}`)
}

export function addContactLog(requestId: string, data: { time: string; result: string; note?: string }) {
  return request.post(`/adoption-requests/${requestId}/contact-logs`, data)
}

export function approveAdoption(requestId: string) {
  return request.post(`/adoption-requests/${requestId}/approve`)
}

export function rejectAdoption(requestId: string, reason?: string) {
  return request.post(`/adoption-requests/${requestId}/reject`, { reason })
}

export function addFollowUp(requestId: string, data: { time: string; env?: string; relation?: string; needIntervention?: boolean; note?: string }) {
  return request.post(`/adoption-requests/${requestId}/follow-up`, data)
}
