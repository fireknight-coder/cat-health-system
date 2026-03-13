//管理猫绑定的设备 + 设备定位 + 警报信息
import request from '@/api/request'

export interface DeviceItem {
  id: string
  deviceId: string
  petId?: string
  boundAt?: string
}
//定位
export interface LocationPoint {
  time: string
  lat: number
  lng: number
}
//绑定设备
export function bindDevice(petId: string, deviceId: string) {
  return request.post('/devices/bind', { petId, deviceId })
}
//查询猫绑定设备
export function getDeviceByPet(petId: string) {
  return request.get<DeviceItem>(`/devices/by-pet/${petId}`)
}
//位置历史，形成区域路线图
export function getLocationHistory(petId: string, params?: { start?: string; end?: string }) {
  return request.get<{ points: LocationPoint[] }>(`/pets/${petId}/location-history`, { params })
}
//警报
export function getAlerts(petId: string, params?: { page?: number; pageSize?: number }) {
  return request.get<{ list: { id: string; type: string; time: string; message: string }[]; total: number }>(`/pets/${petId}/alerts`, { params })
}
