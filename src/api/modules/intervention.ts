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
  return request.post<{ id: string }>('/interventions', { catId, remark })
}

export function getInterventionList(params?: { status?: string; catId?: string; page?: number; pageSize?: number }) {
  return request.get<{ list: InterventionItem[]; total: number }>('/interventions', { params })
}

export function getInterventionById(id: string) {
  return request.get<InterventionItem>(`/interventions/${id}`)
}

export function updateInterventionStatus(id: string, status: string, result?: InterventionItem['result']) {
  return request.patch(`/interventions/${id}`, { status, result })
}
