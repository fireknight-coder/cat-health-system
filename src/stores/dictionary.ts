/** 上报记录状态 */
export const REPORT_STATUS = {
  PENDING_REVIEW: '待审核',
  AI_PROCESSING: 'AI处理中',
  AI_PROCESSED: 'AI已处理',
  APPROVED_MATCH_EXISTING: '已匹配老猫',
  APPROVED_NEW_CAT: '已建档新猫',
  REJECTED: '已驳回',
} as const
export type ReportStatus = keyof typeof REPORT_STATUS

/** 猫档案状态 */
export const CAT_STATUS = {
  HEALTHY: '健康',
  SICK: '生病',
  ADOPTABLE: '可领养',
  ADOPTED: '已领养',
  UNDER_TREATMENT: '治疗中',
  MISSING: '失踪',
} as const
export type CatStatus = keyof typeof CAT_STATUS

/** 干预工单状态 */
export const INTERVENTION_STATUS = {
  OPEN: '待处理',
  TODO: '待办',
  IN_PROGRESS: '进行中',
  DONE: '已结案',
} as const
export type InterventionStatus = keyof typeof INTERVENTION_STATUS

/** 领养申请状态 */
export const ADOPTION_REQUEST_STATUS = {
  SUBMITTED: '已提交',
  CONTACTING: '联系中',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
  FOLLOW_UP_DUE: '待回访',
  FOLLOW_UP_DONE: '回访完成',
} as const
export type AdoptionRequestStatus = keyof typeof ADOPTION_REQUEST_STATUS

export function getReportStatusLabel(s: ReportStatus): string {
  return REPORT_STATUS[s] ?? s
}
export function getCatStatusLabel(s: CatStatus): string {
  return CAT_STATUS[s] ?? s
}
export function getInterventionStatusLabel(s: InterventionStatus): string {
  return INTERVENTION_STATUS[s] ?? s
}
export function getAdoptionRequestStatusLabel(s: AdoptionRequestStatus): string {
  return ADOPTION_REQUEST_STATUS[s] ?? s
}

/** 猫处于处理中时，禁止编辑关键字段、禁止领养（前端 UI 约束与后端需一致） */
export function isCatLocked(catStatus: CatStatus): boolean {
  return catStatus === 'UNDER_TREATMENT'
}

/** 审核分支与状态一一对应：老猫 → APPROVED_MATCH_EXISTING；新猫 → APPROVED_NEW_CAT；驳回 → REJECTED */
export const REPORT_APPROVAL_OUTCOMES = ['APPROVED_MATCH_EXISTING', 'APPROVED_NEW_CAT', 'REJECTED'] as const