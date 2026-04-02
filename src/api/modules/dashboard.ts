//管理员后端数据接口
import request from '@/api/request'

export interface DashboardStats {
  totalCats: number
  healthyCats: number
  adoptableCats: number
  totalReports: number
  pendingReports: number
  totalInterventions: number
  activeInterventions: number
  totalAdoptions: number
  pendingAdoptions: number
}

export function getDashboardStats(params?: { start?: string; end?: string }) {
  return request.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats', { params })
}