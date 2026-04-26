# BNotes 发布管理流程

## 发布前检查清单

### 代码检查
- [ ] 所有功能已完成并测试通过
- [ ] 代码已通过 lint 检查
- [ ] 没有 TODO 或未完成的代码
- [ ] 文档已更新

### 测试检查
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试完成
- [ ] 不同环境测试（Windows）

### 版本检查
- [ ] CHANGELOG.md 已更新
- [ ] version.config.json 已更新
- [ ] package.json version 已更新
- [ ] README.md 功能列表已更新

### 构建检查
- [ ] 网页版构建成功
- [ ] 桌面版构建成功
- [ ] 便携版可正常运行
- [ ] 安装版可正常安装

### 发布检查
- [ ] Git tag 已创建
- [ ] GitHub release 已创建
- [ ] 下载链接可用
- [ ] 发布公告已准备

## 发布流程

### 1. 准备工作

```bash
# 确保在 master 分支
git checkout master
git pull origin master

# 确保 develop 分支最新
git checkout develop
git pull origin develop
```

### 2. 创建发布分支

```bash
git checkout -b release/v1.0.1 develop
```

### 3. 更新版本信息

修改以下文件：
- `version.config.json` - 版本号
- `package.json` - version 字段
- `CHANGELOG.md` - 更新日志
- `README.md` - 如有新功能

### 4. 构建测试

```powershell
# 测试构建
.\build.ps1

# 手动测试程序
# ... 测试完成后 ...

# 如果有问题，在这里修复
git add .
git commit -m "fix: 修复发布前的问题"
```

### 5. 合并到 master

```bash
git checkout master
git merge --no-ff release/v1.0.1
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin master
git push origin v1.0.1
```

### 6. 合并回 develop

```bash
git checkout develop
git merge --no-ff release/v1.0.1
git push origin develop
git branch -d release/v1.0.1
```

### 7. 发布到 GitHub

```bash
# 在 GitHub 上创建 Release
# 标题: v1.0.1
# 内容: 复制 CHANGELOG.md 中的更新内容
# 上传: dist/release/*.exe
```

### 8. 发布后工作

- [ ] 验证 GitHub release
- [ ] 验证下载链接
- [ ] 更新官网（如有）
- [ ] 发布公告（社交媒体）
- [ ] 通知用户

## 快速修复流程 (Hotfix)

### 1. 创建 hotfix 分支

```bash
git checkout master
git pull origin master
git checkout -b hotfix/v1.0.2
```

### 2. 修复问题

修改代码，测试通过后：

```bash
git add .
git commit -m "fix: 修复严重问题 #issue"
```

### 3. 合并和发布

```bash
git checkout master
git merge --no-ff hotfix/v1.0.2
git tag -a v1.0.2 -m "Hotfix v1.0.2"
git push origin master
git push origin v1.0.2

git checkout develop
git merge --no-ff hotfix/v1.0.2
git push origin develop
git branch -d hotfix/v1.0.2
```

## 版本号更新规则

| 更新类型 | 命令 | 版本变化 | 示例 |
|---------|------|---------|------|
| 主版本 | `.\build.ps1 -Major` | x.0.0 | 1.0.0 → 2.0.0 |
| 次版本 | `.\build.ps1 -Minor` | x.y.0 | 1.0.0 → 1.1.0 |
| 修订版 | `.\build.ps1 -Patch` | x.y.z | 1.0.0 → 1.0.1 |

## 自动更新配置

后续可以集成 electron-updater 实现自动更新：

```javascript
// electron/updater.js
const { autoUpdater } = require('electron-updater')

autoUpdater.checkForUpdatesAndNotify()

autoUpdater.on('update-available', () => {
  // 通知用户有可用更新
})

autoUpdater.on('update-downloaded', () => {
  // 更新已下载，准备安装
})

autoUpdater.on('update-installed', () => {
  // 更新已安装，重启应用
})
```
