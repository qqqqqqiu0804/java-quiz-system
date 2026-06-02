# Java Quiz System v1.5.0 Design
# 登录系统 + 云端数据同步

## 概述

为Java期末考试刷题系统添加登录功能和云端数据同步，使用Supabase作为后端服务。

## 功能需求

### 1. 用户认证

**登录方式：** 邮箱 + 密码

**功能：**
- 注册新账号
- 登录已有账号
- 退出登录
- 记住登录状态

### 2. 数据同步策略

**策略：** 双向同步 + 实时同步

**流程：**
1. 用户登录后，从云端拉取数据合并到本地
2. 每次答题后，立即同步到云端
3. 本地和云端都保存数据

### 3. 数据库设计

**表结构：**

```sql
-- 用户统计表
CREATE TABLE user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_answered INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  total_study_time INTEGER DEFAULT 0,
  today_study_time INTEGER DEFAULT 0,
  last_study_date DATE,
  chapter_stats JSONB DEFAULT '{}',
  daily_stats JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 用户错题表
CREATE TABLE user_wrong_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_text)
);
```

### 4. 界面设计

**登录/注册页面：**
```
┌─────────────────────────────────────────┐
│         Java期末考试刷题系统              │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  [登录]  [注册]                  │    │
│  │                                 │    │
│  │  邮箱: [________________]       │    │
│  │  密码: [________________]       │    │
│  │                                 │    │
│  │  [登录]                         │    │
│  │                                 │    │
│  │  还没有账号？点击注册            │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [跳过登录，使用本地模式]                │
└─────────────────────────────────────────┘
```

**用户信息显示：**
- 在首页右上角显示用户邮箱
- 显示"退出登录"按钮
- 显示同步状态图标

### 5. 同步逻辑

**登录时同步：**
1. 从云端获取用户统计数据
2. 与本地数据合并（取较新/较多的数据）
3. 更新本地存储
4. 更新云端数据

**答题后同步：**
1. 更新本地统计数据
2. 调用Supabase API更新云端数据
3. 如果同步失败，保留本地数据，下次登录时再同步

## 技术实现

### Supabase SDK

通过CDN引入：
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### 配置信息

```javascript
const SUPABASE_URL = 'https://lulhihbwzutrhulisryb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vJ-YbjSozEnzwZKuS1TCqg_5zuqqfG2';
```

### 新增功能模块

1. **AuthManager** - 管理用户认证
2. **CloudSync** - 管理云端数据同步

### localStorage 新增键值

- `java-quiz-user`：当前登录用户信息
- `java-quiz-sync-pending`：待同步的数据

## 版本规划

- v1.3.0：标签页切换 + 随机刷题 + 模拟考试 ✅
- v1.4.0：学习统计面板 ✅
- v1.5.0：登录系统 + 云端数据同步（当前）
