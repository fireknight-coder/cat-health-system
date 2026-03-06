/**
 * Mock 开关：无后端时用本地数据演示。
 * 在 main.ts 中根据 VITE_USE_MOCK 决定是否注册 mock 拦截器。
 */
import type { InternalAxiosRequestConfig } from 'axios'

const MOCK_REPORTS = [
  { id: 'r1', status: 'PENDING_REVIEW', mediaUrls: [], reportedAt: '2025-03-01T10:00:00', address: 'A区', createdAt: '2025-03-01T10:00:00', aiTopK: [{ catId: 'c1', similarity: 0.92 }], healthScore: 75, riskLevel: '中' },
]
const MOCK_CATS = [
  { id: 'c1', name: '橘座', status: 'ADOPTABLE', healthScore: 80, createdAt: '2025-01-01', sightingCount: 5 },
  { id: 'c2', name: '小黑', status: 'ACTIVE', healthScore: 70, createdAt: '2025-02-01', sightingCount: 2 },
]
const MOCK_INTERVENTIONS = [
  { id: 'i1', catId: 'c2', status: 'OPEN', createdAt: '2025-03-01T09:00:00' },
]
const MOCK_ADOPTIONS = [
  { id: 'ar1', catId: 'c1', userId: 'u1', phone: '138****0000', status: 'SUBMITTED', createdAt: '2025-03-01T11:00:00' },
]

export function installMock(instance: any) {
  const defaultAdapter = instance.defaults.adapter
  instance.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    let url = (config.url ?? '').replace(/^\/api\/?/, '') || '/'
    if (!url.startsWith('/')) url = '/' + url
    const method = (config.method ?? 'get').toLowerCase()

    if (url === '/reports' && method === 'get') {
      return { data: { list: MOCK_REPORTS, total: MOCK_REPORTS.length }, status: 200 }
    }
    if (url.startsWith('/reports/') && url.split('/').length === 3 && method === 'get') {
      const id = url.split('/')[2]
      const r = MOCK_REPORTS.find((x: any) => x.id === id)
      return { data: r ?? null, status: r ? 200 : 404 }
    }
    if (url === '/reports' && method === 'post') {
      return { data: { id: 'r-new' }, status: 200 }
    }
    if (url === '/cats' && method === 'get') {
      return { data: { list: MOCK_CATS, total: MOCK_CATS.length }, status: 200 }
    }
    if (url === '/cats/adoptable' && method === 'get') {
      const adoptable = MOCK_CATS.filter((c: any) => c.status === 'ADOPTABLE')
      return { data: { list: adoptable, total: adoptable.length }, status: 200 }
    }
    if (url.match(/^\/cats\/[^/]+$/) && method === 'get') {
      const id = url.split('/')[2]
      const c = MOCK_CATS.find((x: any) => x.id === id)
      return { data: c ?? null, status: c ? 200 : 404 }
    }
    if (url.match(/^\/cats\/[^/]+$/) && method === 'patch') {
      return { data: null, status: 200 }
    }
    if (url === '/interventions' && method === 'get') {
      return { data: { list: MOCK_INTERVENTIONS, total: MOCK_INTERVENTIONS.length }, status: 200 }
    }
    if (url === '/interventions' && method === 'post') {
      return { data: { id: 'i-new' }, status: 200 }
    }
    if (url.match(/^\/interventions\/[^/]+$/) && method === 'get') {
      const id = url.split('/')[2]
      const i = MOCK_INTERVENTIONS.find((x: any) => x.id === id)
      return { data: i ?? null, status: i ? 200 : 404 }
    }
    if (url.match(/^\/interventions\/[^/]+$/) && method === 'patch') {
      return { data: null, status: 200 }
    }
    if (url === '/adoption-requests' && method === 'get') {
      return { data: { list: MOCK_ADOPTIONS, total: MOCK_ADOPTIONS.length }, status: 200 }
    }
    if (url === '/adoption-requests' && method === 'post') {
      return { data: { id: 'ar-new' }, status: 200 }
    }
    if (url === '/admin/dashboard' && method === 'get') {
      return {
        data: {
          scale: { totalCats: 2, newLast7d: 1, goneLast7d: 0 },
          health: { highRiskCount: 0, contagiousRiskCount: 0 },
          efficiency: { interventions: { open: 1, inProgress: 0, done: 0 }, adoptionFunnel: { submitted: 1, approved: 0, followUpDone: 0, followUpRate: 0 } },
        },
        status: 200,
      }
    }

    return defaultAdapter(config)
  }
}
