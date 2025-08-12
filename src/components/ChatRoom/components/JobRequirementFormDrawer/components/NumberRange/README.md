# NumberRange 数字范围组件

一个支持在 antd form 中使用的数字范围输入组件，格式为 "()-() years"。

## 功能特性

- 支持最小值和最大值输入
- 自动验证范围逻辑（最小值不能大于最大值）
- 完全兼容 antd Form 组件
- 支持自定义后缀文本
- 响应式设计，支持移动端
- 使用 CSS Modules 避免样式冲突
- **国际化支持**：最小值和最大值占位符支持多语言

## 使用方法

### 基础用法

```tsx
import NumberRange from './NumberRange';

// 在 antd Form 中使用
<Form.Item name="experience" label="工作经验">
  <NumberRange 
    suffix="years"
  />
</Form.Item>
```

### 自定义后缀

```tsx
<NumberRange 
  suffix="months"
/>

<NumberRange 
  suffix="k"
/>

<NumberRange 
  suffix="岁"
/>
```

### 受控组件用法

```tsx
const [value, setValue] = useState({ min: 1, max: 5 });

<NumberRange 
  value={value}
  onChange={setValue}
  suffix="years"
/>
```

## 国际化

组件自动支持国际化，最小值和最大值的占位符文本会根据当前语言自动切换：

- **中文 (zh-CN)**: "最小值", "最大值"
- **英文 (en-US)**: "Min", "Max"

### 国际化配置

确保在项目的国际化配置文件中添加以下翻译键：

```tsx
// zh-CN.ts
numberRange: {
  min: "最小值",
  max: "最大值",
}

// en-US.ts  
numberRange: {
  min: "Min",
  max: "Max",
}
```

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 当前值 | `{ min?: number; max?: number }` | `{}` |
| onChange | 值变化时的回调 | `(val: { min?: number; max?: number }) => void` | - |
| suffix | 后缀文本 | `string` | `"years"` |

### 返回值格式

```tsx
interface NumberRangeValue {
  min?: number;  // 最小值
  max?: number;  // 最大值
}
```

## 注意事项

1. 组件会自动验证范围逻辑，确保最小值不大于最大值
2. 在 antd Form 中使用时，Form.Item 的 name 属性会正确绑定到组件的 value/onChange
3. 组件支持响应式设计，在小屏幕设备上会自动调整布局
4. 使用 CSS Modules 避免样式冲突，所有样式类名都是局部的
5. 国际化功能需要项目已配置 react-i18next 