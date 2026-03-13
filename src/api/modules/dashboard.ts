//管理员后端数据接口，部分数据便于后期预测，这里主要是做数据分析，之后可以在这里接一些机器学习预测趋势
import request from '@/api/request'

export interface DashboardStats {
  //猫群规模
  scale: { 
    totalCats: number; 
    newLast7d: number; 
    goneLast7d: number 
  }
  //猫健康状况统计
  health: { 
    scoreDistribution: Record<string, number>;
    highRiskCount: number; 
    contagiousRiskCount: number 
  }
  //空间统计，地图分析数据
  spatial: { heatmap?: unknown; areaRank?: { area: string; count: number }[]; coverage?: unknown }

  efficiency: {
    interventions: { open: number; inProgress: number; done: number }
    adoptionFunnel: { submitted: number; approved: number; followUpDone: number; followUpRate: number }
  }
}

export function getDashboardStats(params?: { start?: string; end?: string }) {
  return request.get<DashboardStats>('/admin/dashboard', { params })
}
