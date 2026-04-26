# Git 分支管理策略

## 分支命名规范

```
master/          # 主分支（生产环境）
├── develop/     # 开发分支
│   ├── feature/ # 功能分支
│   ├── bugfix/  # Bug修复分支
│   └── release/ # 发布候选分支
└── hotfix/      # 紧急修复分支
```

## 分支说明

### 主分支 (master)
- 代码总是保持可发布状态
- 仅通过 merge 或 hotfix 更新
- 保护分支，禁止直接推送

### 开发分支 (develop)
- 集成了所有已完成的功能
- 下一版本的开发基础
- 通过 feature 分支合并

### 功能分支 (feature/xxx)
- 从 develop 拉取
- 开发新功能
- 完成后合并回 develop

### 发布候选分支 (release/v1.x.x)
- 从 develop 拉取
- 用于发布前的测试和修复
- 合并回 master 和 develop

### 紧急修复分支 (hotfix/x.x.x)
- 从 master 拉取
- 紧急修复生产环境问题
- 合并回 master 和 develop

## 工作流程

```
1. 从 develop 创建功能分支
   git checkout -b feature/xxx develop

2. 开发完成后，合并回 develop
   git checkout develop
   git merge --no-ff feature/xxx
   git branch -d feature/xxx

3. 发布前，从 develop 创建发布分支
   git checkout -b release/v1.0.0 develop

4. 发布后，合并到 master
   git checkout master
   git merge --no-ff release/v1.0.0
   git tag -a v1.0.0 -m "Release v1.0.0"
   git branch -d release/v1.0.0

5. 紧急修复，从 master 创建 hotfix
   git checkout -b hotfix/v1.0.1 master
   # 修复后...
   git checkout master
   git merge --no-ff hotfix/v1.0.1
   git tag -a v1.0.1 -m "Hotfix v1.0.1"
   git checkout develop
   git merge --no-ff hotfix/v1.0.1
   git branch -d hotfix/v1.0.1
```

## Git 常用命令

```bash
# 查看所有分支
git branch -a

# 创建并切换到新分支
git checkout -b feature/xxx

# 切换分支
git checkout develop

# 合并分支（保留合并历史）
git merge --no-ff feature/xxx

# 删除已合并的分支
git branch -d feature/xxx

# 强制删除未合并的分支
git branch -D feature/xxx

# 创建标签
git tag -a v1.0.0 -m "Release v1.0.0"

# 推送标签
git push origin v1.0.0

# 查看远程仓库
git remote -v

# 设置远程仓库
git remote add origin https://github.com/yourname/BNotes.git
```

## 提交信息规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建或辅助工具更新

### 示例
```
feat(book): 添加书籍分类功能

- 添加分类选择下拉框
- 支持多级分类
- 优化分类管理页面

Closes #123
```

## 后续版本更新计划

> 有空再更新，按改动难度从小到大排列，划分为四个阶段

### 阶段一 · 小修小改（Bug 修复 & 简单功能）

1. **分类界面 Bug 修复** — 第一个默认的"未分类"类别无法删除
2. **编辑快捷键与菜单中文化** — 电脑版编辑书籍时增加 Ctrl+S 保存快捷键；顶部菜单栏所有功能改为中文汉字显示
3. **笔记时间记录模式** — 两种模式可选：自定义笔记时间 / 自动读取本地时间记录
4. **书架书名去重** — 书架上的书名不能有重复。导入书籍笔记时若书名与本地已有书目重合，则弹窗提醒用户切换到显示导入模式查看；若用户选择不切换，则必须修改导入的书名至不重复

### 阶段二 · 功能增强（中等改动）

5. **分类/标签引用功能** — 点击相应分类或标签，可查看本地书架中拥有该分类/标签的书籍名称
6. **标签分类管理** — 标签默认平级，可自行开启标签管理模式，在标签页面给标签分类方便查找
7. **反馈入口** — 增加反馈功能，支持文字描述和图片，两者非必填但至少填一项，反馈发送到作者私人邮箱；可反馈 Bug 或功能建议，大众需求则更新，小众需求发布不同版本，极私人化需求可打赏作者定制
8. **书架封面模式** — 书架可选有封面模式或无封面模式，有封面模式可自行添加书籍封面并展示，无封面模式则不展示图片（即当前默认样式）

### 阶段三 · 功能重构（较大改动）

9. **笔记多模式查看** — 笔记版面分多种查看模式：按金句摘抄、读后感、整理笔记分类查看，或按书籍排列，可单独筛选显示金句/读后感/笔记
10. **主题色增强** — 更多主题色调节，加入色环模式自定义主题色，同时提供预设颜色模板
11. **书籍分享导入** — 支持将别人书架上的感想、摘抄等打包分享导入到本地，打开后内容与原书架一致；考虑用压缩包形式分享，需防范恶意病毒侵入。用户可选择导入模式：显示本地版/显示导入版/不显示

### 阶段四 · 跨端移植（最大改动）

12. **移动端本地部署** — 开发一版能够移植到手机上进行本地部署存储的软件
