import request from '@/api/request'

export interface DashboardStats {
  scale: { totalCats: number; newLast7d: number; goneLast7d: number }
  health: { scoreDistribution: Record<string, number>; highRiskCount: number; contagiousRiskCount: number }
  spatial: { heatmap?: unknown; areaRank?: { area: string; count: number }[]; coverage?: unknown }
  efficiency: {
    interventions: { open: number; inProgress: number; done: number }
    adoptionFunnel: { submitted: number; approved: number; followUpDone: number; followUpRate: number }
  }
}

export function getDashboardStats(params?: { start?: string; end?: string }) {
  return request.get<DashboardStats>('/admin/dashboard', { params })
}
