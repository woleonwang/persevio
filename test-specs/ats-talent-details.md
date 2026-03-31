## 目标

- 为 `AtsTalentDetail` 页面建立可测试的 case 清单：渲染分支、用户交互、弹窗/表单校验、以及关键边界情况。
- 覆盖组件测试（vitest）与 E2E（Playwright）两条路线的共同断言点。

## 需要覆盖的核心渲染与交互 Case

文件：`src/components/AtsTalentDetail/index.tsx`

### 1) 顶层加载/空状态

- 当 `job` 或 `talent` 未就绪时，直接渲染 `<Spin />`（不展示其它 UI）。
- Notes 区域：`notes.length > 0` 渲染 notes 列表，否则渲染 `Empty`。
- Activity Log 区域：`activeLogs.length > 0` 渲染 activity 列表，否则渲染 `Empty`。
- Interview Round 面板：`interview.feedback_records.length > 0` 渲染记录列表，否则渲染 `Empty`。

### 2) Header 区（返回/下载/联系方式）

- 点击左上返回按钮（`ArrowLeftOutlined`）触发 `handleBack`：读取 `getQuery('from')` 后决定跳转到 `/app/talents` 或 `/app/jobs/${job.id}/standard-board?tab=talents`。
- 头像首字母渲染：`getInitials(talent.name)` 在“多词/单词/空字符串”输入下的表现（用于边界断言）。
- 联系方式渲染：仅当 `contact?.phone/email/linkedin` 存在时分别渲染对应 `tel:`/`mailto:`/外链；`linkedin` 非 http 链接需补 `https://`。
- `Download PDF`：点击触发 `downloadResume`，请求路径 `/api/jobs/${job.id}/talents/${talent.id}/download_resume`，并使用 `${talent.name}_resume` 作为文件名。

### 3) Resume 渲染分支

- 若 `talent.resume_detail_json` 可解析得到 `resumeDetail?.contact_information`：渲染 `<Resume resume={resumeDetail} />`。
- 否则渲染 `<MarkdownContainer content={talent.parsed_content || ''} />`。

### 4) Jobs Applied（Tabs + 状态/按钮分支）

- `Tabs` items 来自 `talentsOfCandidate`：每个 tab label 展示 `talent.job?.name`，并用 `talent.job?.posted_at` 区分 `Active/Closed`。
- `Tabs` 切换：`onChange` 找到对应 talent 后调用 `navigate(/app/jobs/${talent.job.id}/standard-board/talents/${talent.id})`，并触发 `forceUpdate()`。
- `jobApplyActions` 渲染分支：
  - 若 `talent.status === 'rejected'`：显示红色 `Tag`，不展示 Move Stage/Reject/Interview 按钮。
  - 否则：展示 `interviewButtonArea` + `Move Stage` + `Reject`。
- `interviewButtonArea` 三分支（基于 `interviews.length` 与 `interviews[0]` 字段）：
  - `interviews.length === 0`：primary 按钮文案 `schedule_interview`，点击 `setIsInterviewModalOpen(true)`。
  - `interviews[0].mode === 'written'` 或 `interviews[0].scheduled_at` 存在：按钮文案 `interview_scheduled`，点击打开 Interview modal。
  - 否则：按钮文案 `awaiting_candidate_confirm`，点击打开 Interview modal。
- `Reject` 点击逻辑：
  - 若 `talent.evaluate_feedback` 已存在：直接调用 `updateTalentStatus()`。
  - 否则：打开 `TalentEvaluateFeedbackWithReasonModal`（`setIsRejectModalOpen(true)`）。

### 5) Interviews（Collapse + Round 渲染 + Round 反馈交互）

- Collapse 展开状态：
  - `activeKey={activeInterviewKeys}`。
  - `onChange` 直接 `setActiveInterviewKeys(keys)`。
- Round 0（AI Prescreening）面板：
  - header 展示 `Round 0: AI Prescreening`，并通过 `getEvaluateResultLevel(report)` 渲染 `EvaluateResultBadge`。
- Round 列表面板：当 `interviews.length > 0 || customizedInterviews.length > 0` 时渲染：
  - 每个 Panel header 文案：
    - 有 `customized` name：`Interview Round: ${name}`。
    - 否则默认 `Round 1: Interview`。
  - header meta 显示 `dayjs(interview.created_at).format('MMM DD, YYYY')`。
- 每个 Round 面板内交互：
  - 显示 feedback 列表/Empty。
  - Round 底部 `+ Add Feedback`：设置 `setAddFeedbackForInterviewId(interview.id)` 并打开 Add Feedback modal。
- 创建新 Round：当至少存在一个 interview 或 customizedInterviews 时，渲染 `+ Create New Interview Round`：
  - 点击设置 `setAddFeedbackForInterviewId(undefined)` 并打开 Add Feedback modal。

### 6) Evaluation 内容的条件渲染（用于组件断言）

- Requirements Summary：
  - `report.requirements` 按 `p0/p1/p2` 分组显示优先级行。
  - meetCount 逻辑：同时接受 `assessment === 'meets'` 与 `assessment_type === 'meets'`。
- Detailed Requirements Analysis：
  - 每条 requirement 行使用 `assessment_options.${item.assessment ?? item.assessment_type}`。
- Skills Fit 与 Interest Level：
  - 当 level 属于已知 key 列表时显示对应 label 与样式，否则走中性/unclear 分支。
- Strengths / Potential Gaps / Areas to Probe：仅当数组长度 `> 0` 才渲染；`Areas to Probe` 同时兼容 `areas_to_probe_further` 与 `areas_to_probe_futher`。
- AI Interview Summary：仅当 `report.ai_interview_summary` 存在时渲染，且 topics/key_revelations/interview_observations 子卡片按各自 length 决定是否显示。
- AI Interview Transcript：无条件渲染 `ChatMessagePreview`（messages/job/talent 作为 props）。
- EvaluateFeedback 相关交互：
  - `onChange`：`updateTalentEvaluateFeedback` 先 `setOpenEvaluateFeedbackReason(true)`，再 Post `/evaluate_feedback`，成功后 `fetchTalent()`。
  - `onOpen`：`setNeedConfirmEvaluateFeedbackConversation(false)` 并 `setOpenEvaluateFeedbackConversation(true)`。

### 7) Notes + Notes Modal

- Notes 列表：每条 note 展示 author（staff name 或 '-'）、date、Markdown content。
- Notes Modal：
  - 点击 `+ Add Note` 打开 modal（`isAddNoteModalOpen=true`）。
  - onOk 校验：`newNoteContent.trim()` 为空时 `message.error('Please enter note.')`。
  - 提交成功后调用 `fetchTalentNotes()` 与 `fetchActiveLogs()`，并清空表单。

### 8) Move Stage Modal

- 打开方式：`Move Stage` 按钮点击 `setIsMoveStageModalOpen(true)`。
- okButtonProps disabled：当 `!selectedStageId` 禁止提交。
- Select options：来自 `job.pipeline_stages`（JSON.parse 后映射为 `{value:id,label:name}`）。
- onOk：调用 `handleMoveStage` Post `/stage`，成功后关闭 modal，执行 `fetchTalent()` 与 `fetchActiveLogs()`。

### 9) Add Feedback Modal（最关键交互/校验）

- 打开方式：
  - Round 级 `+ Add Feedback`：`setAddFeedbackForInterviewId(interview.id)`。
  - `+ Create New Interview Round`：`setAddFeedbackForInterviewId(undefined)`。
- modal 内字段渲染：当 `!addFeedbackForInterviewId` 时才展示“Interview Round”输入框。
- onOk 校验：
  - `!addFeedbackForInterviewId && !newFeedbackRound.trim()` 时报错 `Please enter interview round.`。
  - `!newFeedbackContent.trim()` 时报错 `Please enter feedback.`。
- 提交分支：
  - for real interview（`typeof addFeedbackForInterviewId === 'number'`）提交到 `/interviews/${id}/feedback_records`。
  - create customized round（`addFeedbackForInterviewId` 为空/非 number）提交到 `/feedback_records`，并设置 `customized_round_key` 为 `(addFeedbackForInterviewId ?? newUuid)`。
- 成功后的状态更新：
  - 创建新 round 时，把 `newUuid` append 到 `activeInterviewKeys`（确保新 panel 能展开）。
  - 成功后清空表单并触发 `fetchInterviewFeedbackRecords()` + `fetchTalent()` + `fetchActiveLogs()`。

### 10) Interview Modal

- 打开方式：依 `interviewButtonArea` 三分支点击打开。
- InterviewForm props：
  - `interview={interviews[0]}`。
  - `interviewDefaults` 来自 `job.interview_defaults_json`（存在则 JSON.parse，否则 undefined）。
- onSubmit：
  - 若 `interviews[0]` 存在：直接关闭。
  - 若 `interviews[0]` 不存在：`fetchTalent()` 后关闭。

### 11) Reject/Evaluate Feedback 相关弹窗链路

- `TalentEvaluateFeedbackWithReasonModal`（仅在 `!!talent` 时渲染）：
  - onOk：关闭 reject modal，`needConfirm=true`、打开 `EvaluateFeedbackConversation`，并 `fetchTalent()`。
- `TalentEvaluateFeedbackModal`（reason 弹窗）：
  - open 由 `updateTalentEvaluateFeedback` 控制（先开 reason，再 Post evaluate_feedback）。
  - onOk：调用 `updateTalentEvaluateFeedbackReason(value)` 后关闭。
- `EvaluateFeedbackConversation`：
  - open 由 `updateTalentEvaluateFeedbackReason` 或 reject modal 的 onOk 控制。
  - `needConfirm` 影响后续交互分支（测试断言点：确认/不确认路径）。

## 建议的自动化测试覆盖策略（用于落地）

- 组件测试（vitest）：
  - mock `useJob()` 与 `useTalent()`，直接控制 `job/talent`、`interviews`、`notes`、`activeLogs`、`talentChatMessages`。
  - mock 网络层（`Get/Post/Download`），断言 modal open/close、message.error 文案、以及 Post URL 与 payload。
- E2E（Playwright）：
  - mock API 返回不同场景（job/talent 缺失、空 interviews、存在 customized rounds、notes/active_logs 为空等）。
  - 断言路由导航（Tabs 切换、返回按钮）、modal 表单校验、提交后 UI 刷新（例如新增 panel keys、notes/activity 变化）。

## 当前未覆盖 Case（基于 `src/__tests__/pages/ats-talent-detail.test.tsx`）

### 1) Jobs Applied / Tabs 细节

- `Tabs` label 中 `Active/Closed` 文案分支（依赖 `talent.job?.posted_at`）。
- `Tabs` 切换时 `navigate(/app/jobs/${talent.job.id}/standard-board/talents/${talent.id})` 与 `forceUpdate()` 的联动。
- `talent.status === 'rejected'` 时仅显示红色 `Tag`，并隐藏 Move Stage / Reject / Interview 按钮。

### 2) Interviews 结构化渲染与交互

- Collapse 的展开收起行为（`activeInterviewKeys` 变化）与 `onChange` 分支。
- Round 0 面板中的关键信息断言（标题、`EvaluateResultBadge`、summary 关键字段）。
- 非 Round 0 面板（真实面试 / customized round）中：
  - header 文案分支（`Interview Round: ${name}` vs `Round 1: Interview`）。
  - header 日期渲染 `dayjs(...).format("MMM DD, YYYY")`。
  - feedback list 非空时的列表渲染细节（interviewer/date/content/advance_status 样式文案）。
  - `+ Add Feedback`（针对已有 interview）打开 Add Feedback modal 的分支。

### 3) Add Feedback 成功链路（目前仅覆盖必填校验）

- 针对真实 interview（`typeof addFeedbackForInterviewId === 'number'`）提交到 `/interviews/${id}/feedback_records`。
- 创建 customized round 成功提交到 `/feedback_records`，并验证 `customized_round_key` 逻辑。
- 成功后状态联动：
  - 新 round 时 `activeInterviewKeys` append `newUuid`。
  - 触发 `fetchInterviewFeedbackRecords()` + `fetchTalent()` + `fetchActiveLogs()`。

### 4) Evaluation 内容分支（展示层）

- Requirements Summary 的分组与计数（`assessment` / `assessment_type` 双兼容）完整断言。
- Detailed Requirements Analysis 行级渲染（priority/assessment/reasoning 与 i18n key）。
- `skillsFitMeta` 与 `interestLevelMeta`：
  - 已知 key 映射样式分支。
  - 未知 key fallback 到 neutral/unclear 的分支。
- Strengths / Potential Gaps / Areas to Probe：
  - 各数组为空与非空的显示/隐藏分支。
  - `areas_to_probe_further` 与 `areas_to_probe_futher` 兼容分支。
- AI Interview Summary：
  - `topics_covered` / `key_revelations` / `interview_observations` 的 length 分支。

### 5) Evaluate Feedback 三弹窗完整链路

- `EvaluateFeedback` 的 `onChange`：
  - 打开 `TalentEvaluateFeedbackModal`（reason modal）并调用 `/evaluate_feedback`。
- `TalentEvaluateFeedbackModal` onOk：
  - 调用 `updateTalentEvaluateFeedbackReason(value)` 分支与成功消息。
- `EvaluateFeedbackConversation`：
  - `needConfirm` 在不同入口（reject onOk / evaluate reason onOk）的取值差异与展示分支。

### 6) Interview Modal 行为细节

- 三个入口文案按钮点击后均可打开 Interview modal。
- `InterviewForm` props 断言：
  - `interview={interviews[0]}`。
  - `interviewDefaults` 来自 `job.interview_defaults_json`（有/无）。
- `onSubmit` 双分支：
  - `interviews[0]` 存在时仅关闭。
  - 不存在时 `fetchTalent()` 后关闭。

### 7) Header / Contact 补充边界

- `getInitials` 的边界输入（多词、单词、空值）对应展示结果。
- contact 链接渲染细节：
  - phone/email/linkedin 缺失时不渲染。
  - linkedin 非 `http` 前缀自动补 `https://`。

