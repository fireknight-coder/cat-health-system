// 猫咪观察记录API
import request from '@/api/request'

export interface ObservationItem {
  id: string
  catId: string
  content: string
  type: 'general' | 'health' | 'behavior' | 'feeding' | 'incident'
  observedAt: string
  location?: {
    lat: number
    lng: number
    address?: string
  }
  images?: string[]
  isImportant: boolean
  tags?: string[]
  recordedBy?: { _id: string; username: string }
  createdAt: string
}

export function getObservations(catId: string, params?: { page?: number; pageSize?: number }) {
  return request.get<{ list: ObservationItem[]; total: number }>(`/observations/cat/${catId}`, { params })
}

export function createObservation(data: {
  catId: string
  content: string
  type?: string
  observedAt?: string
  location?: { lat: number; lng: number; address?: string }
  images?: string[]
  tags?: string[]
  isImportant?: boolean
}) {
  return request.post('/observations', data)
}

export function deleteObservation(id: string) {
  return request.delete(`/observations/${id}`)
}