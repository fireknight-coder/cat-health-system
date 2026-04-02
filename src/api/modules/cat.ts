
//这里放猫档案的
import request from '@/api/request'

export interface CatItem {
  id: string
  _id?: string
  name?: string
  status: string
  healthScore?: number
  riskLevel?: string
  avatar?: string
  images?: string[]
  createdAt: string
  sightingCount?: number
  lastSeenAt?: string
  age?: number
  gender?: string
  breed?: string
  color?: string
  healthNotes?: string
  description?: string
  adoptedAt?: string
  pendingAdoptionCount?: number
}

export function getCatList(params?: { status?: string; page?: number; pageSize?: number }) {
  return request.get<{ list: CatItem[]; total: number }>('/cats', { params })
}

export function getCatById(id: string) {
  return request.get<CatItem>(`/cats/${id}`)
}

export function updateCat(id: string, data: Partial<Pick<CatItem, 'name' | 'status' | 'avatar' | 'images' | 'age' | 'gender' | 'breed' | 'color' | 'healthNotes' | 'healthScore' | 'riskLevel' | 'sightingCount' | 'lastSeenAt' | 'description'>>) {
  return request.patch(`/cats/${id}`, data)
}

export function uploadCatImages(files: File[]) {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  return request.post<{ urls: string[] }>('/cats/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function getAdoptableCats(params?: { page?: number; pageSize?: number }) {
  return request.get<{ list: CatItem[]; total: number }>('/cats/adoptable', { params })
}