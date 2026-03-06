import request from '@/api/request'

export interface DeviceItem {
  id: string
  deviceId: string
  petId?: string
  boundAt?: string
}

export interface LocationPoint {
  time: string
  lat: number
  lng: number
}

export function bindDevice(petId: string, deviceId: string) {
  return request.post('/devices/bind', { petId, deviceId })
}

export function getDeviceByPet(petId: string) {
  return request.get<DeviceItem>(`/devices/by-pet/${petId}`)
}

export function getLocationHistory(petId: string, params?: { start?: string; end?: string }) {
  return request.get<{ points: LocationPoint[] }>(`/pets/${petId}/location-history`, { params })
}

export function getAlerts(petId: string, params?: { page?: number; pageSize?: number }) {
  return request.get<{ list: { id: string; type: string; time: string; message: string }[]; total: number }>(`/pets/${petId}/alerts`, { params })
}
