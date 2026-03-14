# 3.2 创作者申请流程（Creator Application）实现说明

## 1. 页面拆分（对应 Figma `3.2 /creator/apply`）

路由与页面：

1. `/creator/apply`：Step 1 - Basic Information  
2. `/creator/apply/creative`：Step 2 - Creative Info  
3. `/creator/apply/identity`：Step 3 - Verify Identity  
4. `/creator/apply/agreement`：Step 4 - Terms & Agreement  
5. `/creator/apply/review`：Step 5 - Final Review & Submit  
6. `/creator/apply/status`：提交失败/中间态反馈页  
7. `/creator/pending`：提交成功后的审核中状态页

## 2. 跳转逻辑（状态机）

### 2.1 正常申请流（未申请或申请失败）

- Step1 -> Step2 -> Step3 -> Step4 -> Step5
- Step5 `Submit` 成功：跳转 `/creator/pending`
- Step5 `Submit` 失败：跳转 `/creator/apply/status?result=failed`

### 2.2 Creator 角色状态流

- `pending / under_review / in_review`：强制跳转 `/creator/pending`
- `approved`：可进入 `/creator/dashboard` 及受保护创作者子页面
- `rejected` 或无申请记录：可进入申请流程页面

### 2.3 登录态流

- 未登录访问 `/creator/*`：跳转 `/auth/login?returnUrl=...`
- 登录后返回原页面继续申请

## 3. API 端口与接口约定

### 3.1 固定端口

- Frontend: `http://localhost:7001`
- Backend API: `http://localhost:7002`
- MongoDB: `mongodb://localhost:27017/tinytale`

### 3.2 接口（建议主接口 + 兼容回退）

主接口（Creator 命名空间）：

- `GET /api/creator/application/status`
- `GET /api/creator/application/draft`
- `PUT /api/creator/application/draft`
- `POST /api/creator/application/submit`

兼容回退（当前线上可用）：

- `POST /api/promoter/apply`
- `GET /api/promoter/profile`

说明：
- 前端优先走 `/api/creator/application/*`。
- 若主接口未上线，前端自动回退到 `/api/promoter/*` 以保证流程可用。

## 4. MongoDB 字段设计（建议）

集合：`creator_applications`

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "applicationNo": "TTC-20260314-0001",
  "status": "draft|pending|under_review|approved|rejected|needs_resubmission",
  "currentStep": 1,
  "basicInformation": {
    "identityType": "individual|agency",
    "fullName": "string",
    "workEmail": "string",
    "country": "string",
    "portfolioLink": "string"
  },
  "creativeInformation": {
    "contentCategory": "string",
    "primaryLanguage": "string",
    "primaryPlatforms": ["string"],
    "socialLink": "string",
    "shortBio": "string"
  },
  "identityVerification": {
    "verificationType": "government_id|passport|business_license",
    "documentNumber": "string",
    "issueCountry": "string",
    "taxIdOrBusinessId": "string",
    "documentFileName": "string",
    "documentFileUrl": "string"
  },
  "agreement": {
    "acceptedTerms": true,
    "acceptedAuthenticity": true,
    "signatureName": "string",
    "signedAt": "ISODate"
  },
  "review": {
    "reviewerId": "ObjectId",
    "reviewNotes": "string",
    "rejectionReason": "string",
    "reviewedAt": "ISODate"
  },
  "submittedAt": "ISODate",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

建议索引：

- `{ userId: 1, status: 1, updatedAt: -1 }`
- `{ applicationNo: 1 }` unique
- `{ status: 1, createdAt: -1 }`

## 5. 前端草稿策略

- 本地草稿：`localStorage`（key: `creator_application_draft_v3_2`）
- 远端草稿：有 token 时同步到 `PUT /api/creator/application/draft`
- 提交成功后清理本地草稿

