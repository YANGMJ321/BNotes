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
