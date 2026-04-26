# Git 本地仓库配置指南

## 第一步：检查 Git 是否安装

打开 PowerShell 终端，输入：

```powershell
git --version
```

如果显示版本号（如 `git version 2.40.0`），说明已安装。
如果没有安装，需要先下载 Git：https://git-scm.com/download/win

---

## 第二步：创建 .gitignore 文件

这个文件告诉 Git 忽略哪些文件，不纳入版本管理。

创建文件 `F:\aStudy\Code\BNotes\.gitignore`：

```
# 依赖
node_modules/
package-lock.json

# 构建输出
dist/
release/

# Electron
*.log
*.tmp

# IDE
.vscode/
.idea/

# 系统文件
.DS_Store
Thumbs.db

# 环境配置
.env
.env.local

# 测试
coverage/
```

---

## 第三步：打开项目目录

在终端中进入项目目录：

```powershell
cd F:\aStudy\Code\BNotes
```

---

## 第四步：初始化 Git 仓库

```powershell
git init
```

成功后会显示：
```
Initialized empty Git repository in F:/aStudy/Code/BNotes/.git/
```

---

## 第五步：配置用户信息

这是你提交代码时的身份标识：

```powershell
# 设置用户名（改成你的名字）
git config user.name "你的名字"

# 设置邮箱（改成你的邮箱）
git config user.email "[email protected]"
```

**注意**：如果只在当前项目设置，加上 `--local` 参数：
```powershell
git config --local user.name "你的名字"
git config --local user.email "[email protected]"
```

---

## 第六步：查看当前状态

```powershell
git status
```

会显示：
- 红色文件：未跟踪的文件
- 绿色文件：已暂存的文件

---

## 第七步：添加文件到暂存区

添加所有文件：
```powershell
git add .
```

添加特定文件：
```powershell
git add index.html
git add package.json
```

---

## 第八步：提交到本地仓库

```powershell
git commit -m "feat: 初始版本发布 v1.0.0"
```

提交信息规范：
- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `refactor:` 重构
- `chore:` 辅助工具更新

---

## 第九步：查看提交历史

```powershell
# 查看简要历史
git log --oneline

# 查看详细历史
git log

# 查看最近3次提交
git log -3 --oneline
```

---

## 第十步：创建分支

创建并切换到新分支：
```powershell
git checkout -b develop
```

查看所有分支：
```powershell
git branch
```

当前分支会显示 `*`

切回主分支：
```powershell
git checkout master
```

---

## 第十一步：合并分支

假设你在 `develop` 分支开发了新功能：

```powershell
# 1. 切换到主分支
git checkout master

# 2. 合并 develop 分支
git merge develop
```

---

## 第十二步：撤销操作

撤销暂存（还没提交）：
```powershell
git reset HEAD index.html
```

撤销提交（还没 push）：
```powershell
# 撤销最近一次提交，保留修改
git reset --soft HEAD~1

# 撤销最近一次提交，丢弃修改（危险！）
git reset --hard HEAD~1
```

---

## 第十三步：储藏工作区

如果临时需要切换分支，但不想提交当前修改：

```powershell
# 储藏当前修改
git stash

# 查看储藏列表
git stash list

# 恢复最近的储藏
git stash pop

# 删除储藏
git stash drop
```

---

## 常用 Git 命令速查表

| 操作 | 命令 |
|------|------|
| 初始化仓库 | `git init` |
| 查看状态 | `git status` |
| 添加文件 | `git add .` |
| 提交 | `git commit -m "消息"` |
| 查看历史 | `git log --oneline` |
| 创建分支 | `git checkout -b 分支名` |
| 切换分支 | `git checkout 分支名` |
| 合并分支 | `git merge 分支名` |
| 删除分支 | `git branch -d 分支名` |
| 储藏修改 | `git stash` |
| 恢复储藏 | `git stash pop` |
| 查看差异 | `git diff` |
| 查看远程 | `git remote -v` |

---

## 下一步：配置远程仓库

当你有 GitHub/Gitee 远程仓库后，使用以下命令：

```powershell
# 添加远程仓库（改成你的仓库地址）
git remote add origin https://github.com/你的用户名/BNotes.git

# 推送本地 master 到远程
git push -u origin master

# 推送 develop 分支
git push -u origin develop

# 推送标签
git push origin v1.0.0

# 拉取远程更新
git pull origin master
```

---

## 完整示例：第一次提交代码

```powershell
# 1. 进入项目目录
cd F:\aStudy\Code\BNotes

# 2. 初始化
git init

# 3. 配置用户（只在这个项目生效）
git config --local user.name "你的名字"
git config --local user.email "[email protected]"

# 4. 添加所有文件
git add .

# 5. 提交
git commit -m "feat: 初始版本发布 v1.0.0"

# 6. 创建开发分支
git checkout -b develop

# 7. 查看状态
git status
git log --oneline
```

---

按照以上步骤操作即可！需要我帮你执行哪些步骤吗？
