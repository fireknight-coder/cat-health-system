// 宠物成长记录 API
import request from '@/api/request'

export interface PetGrowthRecord {
  _id: string
  adoptionId: string
  catId: string
  recorderId: string
  recorderName: string
  recorderRole: 'user' | 'admin' | 'superadmin'
  recordType: 'weight' | 'health' | 'behavior' | 'feeding' | 'growth' | 'other'
  content: string
  images: string[]
  recordDate: string
  createdAt: string
  updatedAt: string
}

// 获取某只宠物的所有成长记录
export function getPetGrowthRecords(adoptionId: string) {
  return request.get<PetGrowthRecord[]>(`/pet-growth/adoption/${adoptionId}/records`)
}

// 添加成长记录
export function addPetGrowthRecord(adoptionId: string, data: {
  content: string
  recordType?: string
  images?: string[]
  recordDate?: string
}) {
  return request.post<PetGrowthRecord>(`/pet-growth/adoption/${adoptionId}/records`, data)
}

// 删除成长记录
export function deletePetGrowthRecord(recordId: string) {
  return request.delete(`/pet-growth/records/${recordId}`)
}