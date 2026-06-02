# Java Quiz System v2.0.0 Design
# 视觉升级 - 主题系统、UI重设计、动画效果

## 概述

为Java期末考试刷题系统进行全面视觉升级，包括主题系统、UI重设计和动画效果，采用纯CSS实现，无外部依赖。

## 功能需求

### 1. 主题系统

#### 预设主题
- **亮色主题**：白色背景，深色文字（默认）
- **深色主题**：深色背景，浅色文字
- **护眼绿**：淡绿色背景，减少蓝光
- **星空蓝**：深蓝渐变背景，科技感

#### 自定义主题
- 用户可选择主色调（颜色选择器）
- 系统自动生成配色方案：
  - 主色：用户选择的颜色
  - 浅色：主色 + 20% 白色
  - 深色：主色 - 20% 黑色
  - 背景色：根据主色自动计算
  - 文字色：根据背景色自动计算对比度

#### 主题切换
- 首页右上角显示主题切换按钮
- 点击弹出主题选择面板
- 选择后立即预览
- 保存到localStorage

#### CSS变量设计
```css
:root {
  /* 亮色主题 */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #333333;
  --text-secondary: #666666;
  --accent-color: #667eea;
  --accent-light: #667eea20;
  --accent-dark: #5a6fd6;
  --border-color: #e0e0e0;
  --shadow-color: rgba(0,0,0,0.1);
  --success-color: #11998e;
  --error-color: #f5576c;
  --warning-color: #f093fb;
}

[data-theme="dark"] {
  /* 深色主题 */
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --text-primary: #e0e0e0;
  --text-secondary: #b0b0b0;
  --accent-color: #667eea;
  --accent-light: #667eea30;
  --accent-dark: #7b8ef0;
  --border-color: #2a2a4a;
  --shadow-color: rgba(0,0,0,0.3);
  --success-color: #38ef7d;
  --error-color: #f5576c;
  --warning-color: #f093fb;
}

[data-theme="green"] {
  /* 护眼绿 */
  --bg-primary: #f0f7e6;
  --bg-secondary: #e8f0d8;
  --text-primary: #2d4a22;
  --text-secondary: #4a6a3a;
  --accent-color: #4caf50;
  --accent-light: #4caf5020;
  --accent-dark: #388e3c;
  --border-color: #c8d8b8;
  --shadow-color: rgba(0,0,0,0.08);
  --success-color: #2e7d32;
  --error-color: #c62828;
  --warning-color: #f9a825;
}

[data-theme="blue"] {
  /* 星空蓝 */
  --bg-primary: #0f0c29;
  --bg-secondary: #1a1a3e;
  --text-primary: #e0e0ff;
  --text-secondary: #b0b0d0;
  --accent-color: #6c63ff;
  --accent-light: #6c63ff30;
  --accent-dark: #8b83ff;
  --border-color: #2a2a5a;
  --shadow-color: rgba(0,0,0,0.4);
  --success-color: #00e676;
  --error-color: #ff5252;
  --warning-color: #ffab40;
}
```

### 2. UI重设计（极简风格）

#### 设计原则
- 大量留白，呼吸感
- 柔和的圆角（12-16px）
- 轻盈的阴影
- 清晰的层次结构
- 简化配色，突出内容

#### 组件重设计

**卡片**
```css
.card {
  background: var(--bg-primary);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 1px solid var(--border-color);
}
```

**按钮**
```css
.btn {
  padding: 12px 28px;
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--shadow-color);
}
```

**选项**
```css
.option {
  padding: 16px 20px;
  border-radius: 12px;
  border: 2px solid var(--border-color);
  transition: all 0.2s ease;
}

.option:hover {
  border-color: var(--accent-color);
  background: var(--accent-light);
}
```

**标签页**
```css
.tabs {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 6px;
}

.tab {
  border-radius: 10px;
  padding: 12px 20px;
  transition: all 0.2s ease;
}

.tab.active {
  background: var(--bg-primary);
  box-shadow: 0 2px 8px var(--shadow-color);
}
```

### 3. 动画效果

#### 页面过渡动画
```css
.page {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### 选项交互动画
```css
.option {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.option:active {
  transform: scale(0.98);
}

.option.selected {
  animation: selectPulse 0.3s ease;
}

@keyframes selectPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}
```

#### 答题反馈动画
```css
/* 答对 - 绿色闪烁 */
.option.correct {
  animation: correctFlash 0.5s ease;
}

@keyframes correctFlash {
  0%, 100% { background: var(--success-light); }
  50% { background: var(--success-color); color: white; }
}

/* 答错 - 红色震动 */
.option.wrong {
  animation: wrongShake 0.5s ease;
}

@keyframes wrongShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}
```

#### 微交互动画
```css
/* 按钮悬停 */
.btn {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn:hover {
  transform: translateY(-2px);
}

.btn:active {
  transform: translateY(0);
}

/* 卡片悬停 */
.card {
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 8px 30px var(--shadow-color);
}

/* 标签页切换 */
.tab {
  transition: all 0.2s ease;
}

.tab-content {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 成就通知 */
.achievement-notification {
  animation: slideDown 0.3s ease, slideUp 0.3s ease 2.7s;
}

@keyframes slideDown {
  from { transform: translateX(-50%) translateY(-100px); }
  to { transform: translateX(-50%) translateY(0); }
}

@keyframes slideUp {
  from { transform: translateX(-50%) translateY(0); }
  to { transform: translateX(-50%) translateY(-100px); }
}

/* 进度条 */
.progress-bar {
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 计时器脉冲 */
.timer-display.warning {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### 4. 主题切换界面

#### 主题选择面板
```
┌─────────────────────────────────────────┐
│  🎨 主题设置                             │
│                                         │
│  预设主题                                │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │ ☀️  │ │ 🌙  │ │ 🌿  │ │ 🌌  │       │
│  │亮色 │ │深色 │ │护眼 │ │星空 │       │
│  └─────┘ └─────┘ └─────┘ └─────┘       │
│                                         │
│  自定义主题                              │
│  主色调: [颜色选择器]                     │
│  预览: [实时预览区域]                     │
│                                         │
│  [重置为默认]                            │
└─────────────────────────────────────────┘
```

### 5. 实现计划

#### v2.0.0 分三个子版本：
- **v2.0.0-alpha**：主题系统（CSS变量 + 预设主题 + 自定义主题）
- **v2.0.0-beta**：UI重设计（极简风格、组件重设计）
- **v2.0.0**：动画效果（页面过渡、选项交互、答题反馈、微交互）

## 技术实现

### CSS变量
- 使用 `data-theme` 属性切换主题
- 所有颜色使用 CSS 变量
- 自定义主题通过 JavaScript 动态修改 CSS 变量

### 动画
- 使用 CSS `transition` 实现平滑过渡
- 使用 CSS `@keyframes` 实现复杂动画
- 使用 `cubic-bezier` 缓动函数实现自然动画

### 存储
- 主题选择保存到 `localStorage`
- 自定义颜色保存到 `localStorage`

## 版本规划

- v1.11.1：填空题快捷键优化 ✅
- v2.0.0-alpha：主题系统（当前）
- v2.0.0-beta：UI重设计
- v2.0.0：动画效果
