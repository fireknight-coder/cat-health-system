//医疗干预和救助处理
import request from '@/api/request'

export interface InterventionItem {
  id: string
  catId: string
  status: string
  createdAt: string
  updatedAt?: string
  result?: { time?: string; place?: string; cost?: number; measures?: string; photos?: string[]; remark?: string }
}

export function createIntervention(catId: string, remark?: string) {
  return request.post<{ id: string }>('/intervention', { catId, remark })
}

export function getInterventionList(params?: { status?: string; catId?: string; page?: number; pageSize?: number }) {
  return request.get<{ list: InterventionItem[]; total: number }>('/intervention', { params })
}

export function getInterventionById(id: string) {
  return request.get<InterventionItem>(`/intervention/${id}`)
}

export function updateInterventionStatus(id: string, status: string, result?: InterventionItem['result']) {
  return request.patch(`/intervention/${id}/status`, { status, result })
}