# Frontend Conventions

本文档整理当前仓库里已经在执行的前端代码约定，作为后续开发参考。

## 1) 组件与状态管理

- 使用函数组件，主要基于 React Hooks。
- 状态命名语义化：
  - 列表数据使用复数（如 `staffs`、`groups`）
  - 布尔状态使用 `isXxx`（如 `isModalOpen`、`isEditMode`）
  - 请求状态使用 `loading`
- 函数命名遵循动作语义：
  - `fetchXxx`（拉取数据）
  - `handleXxx`（事件处理）
  - `showXxx`（打开弹窗等）
- 常见列表页状态结构：`list + loading + search + page + modal + form + editingItem`

## 2) 页面结构（管理页）

列表/管理页面通常遵循以下结构：

- `headerSection`：标题区域
- `filterSection`：筛选区域（搜索、按钮）
- `tableSection`：列表表格
- `Modal + Form`：创建/编辑

## 3) API 调用与错误处理

- 统一通过 `src/utils/request.ts` 调用接口（`Get/Post/Delete/PostFormData/Download`）。
- 业务成功统一判断 `code === 0`。
- 成功与失败反馈统一使用 antd `message`：
  - 成功：`message.success(...)`
  - 失败：`message.error(...)`
- 删除操作交互统一使用 `Modal.confirm({ onOk: async () => ... })`。

## 4) TypeScript 类型约定

- 业务类型集中定义在 `src/type.d.ts`。
- 命名惯例：
  - `I` 前缀用于 `interface`（如 `IStaff`、`IGroupWithStaffIds`）
  - `T` 前缀用于 `type`（如 `TTalent`、`TMenu`）
- 页面优先复用全局类型，减少重复定义。

## 5) 国际化（i18n）

- 文案集中在：
  - `src/locales/en-US.ts`
  - `src/locales/zh-CN.ts`
- 页面文案按命名空间组织（如 `staffs.xxx`、`groups.xxx`、`menu.xxx`）。
- 通用文案放根级 key（如 `pagination_total`、`empty_text`）。

## 6) 样式约定（LESS Modules）

- 使用 `*.module.less` + `import styles from "./style.module.less"`。
- CSS 类名使用 camelCase（如 `headerSection`、`tableSection`）。
- 需要覆盖 antd 内部样式时，使用 `:global(.ant-...)`。
- 常见布局方式为 flex，列表区常见 `flex: auto + overflow: auto`。

## 7) 路由与菜单

- 路由统一在 `src/main.tsx` 注册。
- 侧边栏菜单在对应 layout 内维护（如 `src/layouts/App/index.tsx`）。
- 菜单项可包含权限字段（如 `requireStaffAdmin`），再通过 `filter` 控制显示。

## 8) 常见交互模式

- 搜索输入：`Input + SearchOutlined + allowClear`。
- 分页：`Table.pagination` + `showQuickJumper` + `pageSize` + `onChange`。
- 删除：按钮禁用条件前置 + 删除确认弹窗 + 后端错误兜底提示。
- 列表页通常包含 `loading`、空数据展示、刷新列表逻辑。

## 9) 测试与质量现状

- 单测目录：`src/__tests__/**/*.(test).ts(x)`。
- E2E 目录：`e2e/**/*.spec.ts`。
- 常用质量脚本：
  - `yarn lint`
  - `yarn test`
  - `yarn test:e2e`

