# 前后端接口对接表单

> 前端已按以下约定调用；后端需实现对应接口。算法识别、健康评估等由后端完成，前端仅展示与提交决策。

---

## 1. 流1：发现流浪猫 → 上报 → AI 配对 → 审核

### 1.1 上传与媒体

| 项目 | 说明 |
|------|------|
| 接口名称 | 上传照片/视频 |
| 建议方法/路径 | `POST /upload` 或 `POST /reports/upload` |
| 请求 | `multipart/form-data`：`files[]` |
| 响应 | `{ "urls": ["https://..."] }` |
| 权限 | 登录用户 |
| 联调优先级 | P0 |

### 1.2 创建上报

| 项目 | 说明 |
|------|------|
| 接口名称 | 提交上报记录 |
| HTTP 方法/路径 | `POST /api/reports` |
| 请求参数 | `mediaUrls: string[]` 必填；`lat?, lng?, address?, reportedAt: string`（ISO8601）；`remark?: string` |
| 响应 | `{ "id": "reportId" }` |
| 状态影响 | 新建 Report，状态 `PENDING_REVIEW` |
| 权限 | 用户端 |
| 联调优先级 | P0 |

### 1.3 获取上报列表（管理端）

| 项目 | 说明 |
|------|------|
| HTTP 方法/路径 | `GET /api/reports` |
| 请求参数 | `status?: string`（如 PENDING_REVIEW）；`page?, pageSize?` |
| 响应 | `{ "list": ReportItem[], "total": number }` |
| ReportItem | `id, status, mediaUrls, lat?, lng?, address?, reportedAt, remark?, reporterId?, aiTopK?, healthScore?, riskLevel?, createdAt` |
| 权限 | 管理员 |
| 联调优先级 | P0 |

### 1.4 获取上报详情（含 AI 结果）

| 项目 | 说明 |
|------|------|
| HTTP 方法/路径 | `GET /api/reports/:id` |
| 响应 | 同上 ReportItem；`aiTopK: { catId, similarity, avatar? }[]` |
| 权限 | 管理员 |
| 联调优先级 | P0 |

### 1.5 审核：老猫绑定

| 项目 | 说明 |
|------|------|
| HTTP 方法/路径 | `POST /api/reports/:id/approve-match` |
| 请求参数 | `{ "catId": "string" }` |
| 响应 | 204 或 `{}` |
| 状态影响 | Report → `APPROVED_MATCH_EXISTING`；写入 Sighting，更新猫轨迹/热区 |
| 权限 | 管理员 |
| 联调优先级 | P0 |

### 1.6 审核：新猫建档

| 项目 | 说明 |
|------|------|
| HTTP 方法/路径 | `POST /api/reports/:id/approve-new` |
| 响应 | `{ "catId": "string" }` |
| 状态影响 | Report → `APPROVED_NEW_CAT`；新建 Cat，生成身份 ID 卡，首条 Sighting + Embedding + 健康评估 |
| 权限 | 管理员 |
| 联调优先级 | P0 |

### 1.7 审核：驳回

| 项目 | 说明 |
|------|------|
| HTTP 方法/路径 | `POST /api/reports/:id/reject` |
| 请求参数 | `{ "reason"?: "string" }` |
| 状态影响 | Report → `REJECTED` |
| 权限 | 管理员 |
| 联调优先级 | P1 |

---

## 2. 流2：健康异常 → 干预工单 → 锁定 → 解除

### 2.1 猫档案列表与详情

| 项目 | 说明 |
|------|------|
| GET /api/cats | 参数 `status?, page?, pageSize?`；响应 `{ list: CatItem[], total }` |
| GET /api/cats/:id | 响应 CatItem |
| CatItem | `id, name?, status, healthScore?, riskLevel?, avatar?, createdAt, sightingCount?, lastSeenAt?` |
| 权限 | 列表/详情管理端；可领养列表用户端见下 |
| 联调优先级 | P0 |

### 2.2 可领养列表（用户端）

| 项目 | 说明 |
|------|------|
| HTTP 方法/路径 | `GET /api/cats/adoptable` |
| 请求参数 | `page?, pageSize?` |
| 响应 | `{ list: CatItem[], total }`，仅 status=ADOPTABLE |
| 权限 | 用户 |
| 联调优先级 | P0 |

### 2.3 更新猫档案

| 项目 | 说明 |
|------|------|
| HTTP 方法/路径 | `PATCH /api/cats/:id` |
| 请求参数 | `{ "name"?: string, "status"?: string }` |
| 约束 | 当 Cat.status=UNDER_TREATMENT 时，后端应拒绝关键字段修改 |
| 联调优先级 | P1 |

### 2.4 创建干预工单

| 项目 | 说明 |
|------|------|
| HTTP 方法/路径 | `POST /api/interventions` |
| 请求参数 | `{ "catId": "string", "remark"?: "string" }` |
| 响应 | `{ "id": "interventionId" }` |
| 状态影响 | 新建 Intervention（OPEN/TODO）；Cat → `UNDER_TREATMENT` |
| 权限 | 管理员 |
| 联调优先级 | P0 |

### 2.5 干预工单列表与详情

| 项目 | 说明 |
|------|------|
| GET /api/interventions | 参数 `status?, catId?, page?, pageSize?`；响应 `{ list: InterventionItem[], total }` |
| GET /api/interventions/:id | 响应 InterventionItem |
| InterventionItem | `id, catId, status, createdAt, updatedAt?, result?`；result: `time?, place?, cost?, measures?, photos?, remark?` |
| 联调优先级 | P0 |

### 2.6 更新工单状态与结案

| 项目 | 说明 |
|------|------|
| HTTP 方法/路径 | `PATCH /api/interventions/:id` |
| 请求参数 | `{ "status": "string", "result"?: { ... } }` |
| 状态影响 | 工单 DONE 时，后端将 Cat 从 UNDER_TREATMENT 改为 ACTIVE 或 ADOPTABLE |
| 权限 | 管理员 |
| 联调优先级 | P0 |

---

## 3. 流3：领养申请 → 联系 → 同意/拒绝 → 回访

### 3.1 提交领养申请

| 项目 | 说明 |
|------|------|
| HTTP 方法/路径 | `POST /api/adoption-requests` |
| 请求参数 | `{ "catId": "string", "phone": "string", "remark"?: "string" }` |
| 响应 | `{ "id": "requestId" }` |
| 状态影响 | 新建 AdoptionRequest，状态 `SUBMITTED` |
| 权限 | 用户（且 Cat 非 UNDER_TREATMENT） |
| 联调优先级 | P0 |

### 3.2 领养申请列表与详情

| 项目 | 说明 |
|------|------|
| GET /api/adoption-requests | 参数 `status?, page?, pageSize?`；响应 `{ list: AdoptionRequestItem[], total }` |
| GET /api/adoption-requests/:id | 响应 AdoptionRequestItem（含 contactLogs、followUpRecords） |
| AdoptionRequestItem | `id, catId, userId, phone, remark?, status, contactLogs?, followUpRecords?, createdAt` |
| 权限 | 管理员 |
| 联调优先级 | P0 |

### 3.3 联系日志

| 项目 | 说明 |
|------|------|
| HTTP 方法/路径 | `POST /api/adoption-requests/:id/contact-logs` |
| 请求参数 | `{ "time": "string", "result": "string", "note"?: "string" }` |
| 状态影响 | 可选：SUBMITTED → CONTACTING |
| 联调优先级 | P1 |

### 3.4 同意领养

| 项目 | 说明 |
|------|------|
| HTTP 方法/路径 | `POST /api/adoption-requests/:id/approve` |
| 状态影响 | AdoptionRequest → APPROVED；Cat → ADOPTED；建立回访计划（FOLLOW_UP_DUE） |
| 权限 | 管理员 |
| 联调优先级 | P0 |

### 3.5 拒绝领养

| 项目 | 说明 |
|------|------|
| HTTP 方法/路径 | `POST /api/adoption-requests/:id/reject` |
| 请求参数 | `{ "reason"?: "string" }` |
| 状态影响 | AdoptionRequest → REJECTED；Cat 保持 ADOPTABLE/ACTIVE |
| 联调优先级 | P0 |

### 3.6 回访记录

| 项目 | 说明 |
|------|------|
| HTTP 方法/路径 | `POST /api/adoption-requests/:id/follow-up` |
| 请求参数 | `{ "time": "string", "env"?, "relation"?, "needIntervention"?, "note"? }` |
| 状态影响 | FOLLOW_UP_DUE → FOLLOW_UP_DONE |
| 联调优先级 | P1 |

---

## 4. 流4：项圈定位与告警

### 4.1 设备绑定

| 项目 | 说明 |
|------|------|
| HTTP 方法/路径 | `POST /api/devices/bind` |
| 请求参数 | `{ "petId": "string", "deviceId": "string" }` |
| 权限 | 用户（本人宠物）或管理员 |
| 联调优先级 | P1 |

### 4.2 按宠物查设备

| 项目 | 说明 |
|------|------|
| GET /api/devices/by-pet/:petId | 响应 DeviceItem：`id, deviceId, petId?, boundAt?` |
| 联调优先级 | P1 |

### 4.3 定位历史

| 项目 | 说明 |
|------|------|
| GET /api/pets/:petId/location-history | 参数 `start?, end?`；响应 `{ "points": { time, lat, lng }[] }` |
| 权限 | 宠物主人/管理员 |
| 联调优先级 | P1 |

### 4.4 异常告警列表

| 项目 | 说明 |
|------|------|
| GET /api/pets/:petId/alerts | 参数 `page?, pageSize?`；响应 `{ list: { id, type, time, message }[], total }` |
| 联调优先级 | P2 |

---

## 5. 流5：仪表盘聚合

### 5.1 仪表盘数据

| 项目 | 说明 |
|------|------|
| HTTP 方法/路径 | `GET /api/admin/dashboard` |
| 请求参数 | `start?, end?`（可选时间窗口） |
| 响应 | 见下表 DashboardStats |
| 权限 | 管理员 |
| 联调优先级 | P0 |

**DashboardStats 结构：**

- `scale`: `{ totalCats, newLast7d, goneLast7d }`
- `health`: `{ scoreDistribution?, highRiskCount, contagiousRiskCount }`
- `spatial`: `{ heatmap?, areaRank?: { area, count }[], coverage? }`
- `efficiency`: `{ interventions: { open, inProgress, done }, adoptionFunnel: { submitted, approved, followUpDone, followUpRate } }`

---

## 6. 通用说明

- **BaseURL**：前端通过 `VITE_API_BASE` 配置，默认 `/api`。
- **鉴权**：请求头 `Authorization: Bearer <token>`；401 时前端清空登录态并跳转登录。
- **状态枚举**（前后端需一致）：
  - Report: `PENDING_REVIEW` | `APPROVED_MATCH_EXISTING` | `APPROVED_NEW_CAT` | `REJECTED`
  - Cat: `ACTIVE` | `UNDER_TREATMENT` | `ADOPTABLE` | `ADOPTED`
  - Intervention: `OPEN` | `TODO` | `IN_PROGRESS` | `DONE`
  - AdoptionRequest: `SUBMITTED` | `CONTACTING` | `APPROVED` | `REJECTED` | `FOLLOW_UP_DUE` | `FOLLOW_UP_DONE`
- **错误响应**：建议统一 `{ code, message }`；前端对 4xx/5xx 做统一提示。
