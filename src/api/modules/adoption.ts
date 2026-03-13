//领养相关的接口
import request from '@/api/request'

export interface AdoptionRequestItem {
  id: string
  catId: string
  userId: string
  phone: string
  remark?: string
  status: string
  contactLogs?: { 
    time: string; 
    result: string; 
    note?: string 
  }[]
  //回访记录
  followUpRecords?: { 
    time: string; 
    env?: string; 
    relation?: string; 
    needIntervention?: boolean; 
    note?: string 
  }[]
  createdAt: string
}

//创建领养申请
export function createAdoptionRequest(catId: string, data: { phone: string; remark?: string }) {
  return request.post<{ id: string }>('/adoption-requests', { catId, ...data })
}
//获取领养申请列表
export function getAdoptionRequestList(params?: { status?: string; page?: number; pageSize?: number }) {
  return request.get<{ list: AdoptionRequestItem[]; total: number }>('/adoption-requests', { params })
}

export function getAdoptionRequestById(id: string) {
  return request.get<AdoptionRequestItem>(`/adoption-requests/${id}`)
}
//添加联系记录
export function addContactLog(requestId: string, data: { time: string; result: string; note?: string }) {
  return request.post(`/adoption-requests/${requestId}/contact-logs`, data)
}
//通过领养
export function approveAdoption(requestId: string) {
  return request.post(`/adoption-requests/${requestId}/approve`)
}
//拒绝领养
export function rejectAdoption(requestId: string, reason?: string) {
  return request.post(`/adoption-requests/${requestId}/reject`, { reason })
}

//添加回访记录
export function addFollowUp(requestId: string, data: { time: string; env?: string; relation?: string; needIntervention?: boolean; note?: string }) {
  return request.post(`/adoption-requests/${requestId}/follow-up`, data)
}
