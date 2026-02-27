---
name: backend-api-definitions
description: 指引代理在需要查看或推断后端接口定义时，前往 /Users/marvinwang/Documents/GitHub/persevio-backend 代码仓，并以 cmd/main.go 作为入口定位 API 定义。适用于用户询问接口定义、路由、handler、后端入参出参结构或需要根据后端实现回答问题的场景。
---

# 后端接口定义查询（persevio-backend）

## 适用场景

当需要了解或确认 **后端接口定义 / API 路由 / handler 实现 / 请求与响应结构** 时，使用本技能。

- **后端代码仓路径**：`/Users/marvinwang/Documents/GitHub/persevio-backend`
- **入口文件**：`cmd/main.go`

典型触发条件包括但不限于：

- 用户提到“接口定义”“API 定义”“后端接口”“路由”“handler”
- 用户询问某个接口的 **URL、Method、参数、返回值、状态码** 等
- 需要根据后端实际实现来确认前端调用方式或数据结构

## 使用指引

1. **定位代码仓**
   - 将后端代码的根目录视为：`/Users/marvinwang/Documents/GitHub/persevio-backend`
   - 所有与后端接口相关的搜索，默认在该目录下进行。

2. **从入口文件开始查找**
   - 首先查看 `cmd/main.go`：
     - 寻找 **路由注册**、**HTTP 服务器初始化**、**中间件挂载** 等逻辑。
     - 从这里反向追踪到具体的 router / controller / handler / service 等模块。

3. **查找接口定义的一般步骤**
   - 优先使用语义搜索或文本搜索，目标包括：
     - 路由前缀（如 `/api/`、`/v1/` 等）
     - 具体路径片段（例如用户提到的 `/jobs`、`/pipeline` 等）
     - handler / controller 的函数名（如 `GetJob`, `ListJobs`, `UpdateJobStatus` 等）
   - 如果发现统一路由模块（例如 `router.go`、`routes.go` 或框架特定的路由文件）：
     - 先在该模块中确认 **method + path**，再跳转到对应的 handler。

4. **确认请求与响应结构**
   - 在 handler 函数中：
     - 找出 **请求体结构体 / DTO**（例如 `CreateJobRequest`, `UpdateStatusPayload` 等）。
     - 找出 **响应结构体** 或返回值（例如 `JobResponse`, `PipelineResponse` 等）。
   - 如有中间层（service / usecase），根据需要继续向下追踪，但回答接口定义相关问题时，优先以 **handler 层暴露的参数和返回** 为准。

5. **回答用户问题时的优先级**
   - **事实优先**：所有关于接口的描述，以 `/Users/marvinwang/Documents/GitHub/persevio-backend` 中的实际实现为准。
   - 如代码中存在多处定义或重构痕迹：
     - 以当前生效的路由注册为主（即从 `cmd/main.go` 实际挂载到的 router 链路出发）。
   - 如无法在后端代码中找到某接口：
     - 明确说明“当前在后端仓库中未找到该接口的定义”，避免猜测。

## 回答格式建议

在根据后端代码回答接口问题时，可以采用类似结构（按需精简）：

```markdown
- **接口路径**: `GET /api/example`
- **所在文件**: `path/to/handler.go`
- **入口链路**: `cmd/main.go -> internal/router/router.go -> handler.ExampleHandler`
- **请求参数**:
  - Query: `page` (int), `pageSize` (int)
- **请求体**:
  - 无 / 或列出 JSON 结构
- **响应结构**:
  - 字段列表 + 含义
```

无需在技能中维护具体接口列表，**始终以实时读取后端代码为准**。

