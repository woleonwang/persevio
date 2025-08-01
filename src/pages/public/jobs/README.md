# JobRecommendations 岗位推荐组件

根据设计稿实现的岗位推荐组件，支持岗位列表展示、筛选功能。

## 功能特性

- ✅ 岗位列表展示
- ✅ 热门精选/最新岗位筛选
- ✅ 响应式设计
- ✅ TypeScript 支持
- ✅ 点击事件处理
- ✅ 悬停效果

## 使用方法

```tsx
import JobRecommendations, { JobPosting } from './components/JobRecommendations';

const jobs: JobPosting[] = [
  {
    id: '1',
    title: 'TS游戏开发工程师',
    company: 'Meta',
    department: 'Metaapp - 海外审核团队',
    teamLanguage: '中文',
    workMode: '完全在办公室工作',
    postedTime: '2小时前',
    location: '成都',
    experienceLevel: '中级/有一定经验'
  }
  // ... 更多岗位数据
];

const App = () => {
  const handleJobClick = (job: JobPosting) => {
    console.log('点击了岗位:', job);
    // 处理岗位点击事件
  };

  return (
    <JobRecommendations 
      jobs={jobs}
      onJobClick={handleJobClick}
    />
  );
};
```

## API 文档

### Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| jobs | `JobPosting[]` | ✅ | - | 岗位数据数组 |
| onJobClick | `(job: JobPosting) => void` | ❌ | - | 岗位点击回调函数 |
| className | `string` | ❌ | `''` | 自定义CSS类名 |

### JobPosting 接口

```tsx
interface JobPosting {
  id: string;                    // 岗位唯一标识
  title: string;                 // 岗位标题
  company: string;               // 公司名称
  department: string;             // 部门信息
  teamLanguage: string;          // 团队语言
  workMode: string;              // 工作模式
  postedTime: string;            // 发布时间
  location: string;              // 工作地点
  experienceLevel: '初级/少量经验' | '中级/有一定经验' | '高级/经验非常丰富'; // 经验要求
  logo?: string;                 // 公司logo（可选）
}
```

### FilterType 类型

```tsx
type FilterType = '热门精选' | '最新岗位';
```

## 样式定制

组件使用CSS模块，可以通过以下类名进行样式定制：

- `.job-recommendations` - 主容器
- `.job-recommendations-header` - 头部区域
- `.job-recommendations-title` - 标题
- `.job-recommendations-filters` - 筛选按钮容器
- `.filter-button` - 筛选按钮
- `.filter-button.active` - 激活状态的筛选按钮
- `.job-list` - 岗位列表容器
- `.job-card` - 岗位卡片
- `.job-details` - 岗位详情区域
- `.job-logo` - 公司logo区域
- `.job-info` - 岗位信息区域
- `.job-title` - 岗位标题
- `.job-meta` - 岗位元信息
- `.job-time` - 发布时间
- `.job-tags` - 标签容器
- `.location-tag` - 地点标签
- `.experience-tag` - 经验标签

## 响应式设计

组件支持响应式设计，在移动端会自动调整布局：

- 头部区域在小屏幕上变为垂直布局
- 岗位卡片在小屏幕上变为垂直布局
- 标签在小屏幕上变为水平排列

## 示例

查看 `example.tsx` 文件获取完整的使用示例。 