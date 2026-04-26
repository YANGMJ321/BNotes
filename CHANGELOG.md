# 更新日志

所有重要的版本更新都会记录在此文件中。

## [1.4.0] - 2026-06-15

### 阶段四 · 安卓移植

#### 新增
- **安卓端"书记"**：基于 Capacitor 的安卓应用，纯前端架构
  - sql.js 直接在 WebView 中运行，无需 Node.js 后端
  - IndexedDB 持久化数据库，防抖自动保存
  - 底部导航栏适配移动端操作习惯
  - "更多"页面整合导入导出、主题、反馈功能
  - 无需联网，零网络权限
  - 应用图标使用自定义图标
- **ZIP 压缩包导出/导入**：数据导出自动打包为 ZIP 压缩包
  - 导出：选中书籍自动生成 `.zip` 文件，内含 JSON 数据
  - 导入：支持解析 `.zip` 和 `.json` 两种格式
  - 电脑端和手机端数据格式完全兼容，互传无障碍
- **导出PDF修复**：原"导出PDF"改为"导出HTML"，修复打包后无法导出的问题

#### 技术架构
| 平台 | 架构 | 数据层 |
|------|------|--------|
| 桌面端 BNotes | Electron + Vue 3 + Express + sql.js | HTTP API → Node.js |
| 安卓端 书记 | Capacitor + Vue 3 + sql.js | 直接操作 → IndexedDB |

#### 新增文件
| 文件 | 说明 |
|------|------|
| `mobile/` | 安卓端项目目录 |
| `mobile/src/database.js` | 纯前端 sql.js 数据库模块 |
| `mobile/src/stores/books.js` | 移动端 Pinia Store（直接操作数据库） |
| `mobile/src/App.vue` | 移动端布局（底部导航） |
| `mobile/src/views/MoreView.vue` | 更多功能页面 |
| `mobile/src/router/index.js` | 移动端路由 |
| `mobile/src/main.js` | 移动端入口 |
| `mobile/vite.config.js` | Vite 构建配置 |
| `mobile/capacitor.config.ts` | Capacitor 配置 |
| `mobile/android/` | Android 原生项目 |

#### 变更文件
| 文件 | 变更说明 |
|------|----------|
| `frontend/src/views/ImportExport.vue` | 支持 .zip 文件导入 |
| `frontend/src/stores/books.js` | 导出改为 ZIP 打包 |
| `backend-node/server.js` | 导出API改为直接返回HTML |

---

## [1.3.0] - 2026-06-15

### 阶段三 · 功能重构

#### 新增
- **笔记多模式查看**：笔记页面支持四种查看模式——按书籍排列、按金句摘录、按读后感、按整理笔记，可单独筛选显示金句/读后感/笔记，每种模式独立卡片展示
- **莫兰迪色系主题**：默认主题色改为莫兰迪蓝灰色系，新增主题设置页面
  - 5 个莫兰迪预设模板：石板蓝、玫瑰、鼠尾草、沙色、薰衣草
  - 色环自定义主色，自动生成莫兰迪风格配色
  - 浅色/深色模式切换
  - 主题偏好自动保存，启动时加载避免闪烁
- **书籍分享导入**：支持将书架数据打包为 JSON 文件分享导入
  - 导出：勾选书籍导出为 BNotes 格式 JSON 文件
  - 导入：拖拽或选择 JSON 文件，预览后确认导入
  - 三种导入模式：本地优先（跳过重复）、导入优先（重复加后缀）、仅预览
  - 自动导入关联的分类和标签

#### 后端 API 新增
| 端点 | 说明 |
|------|------|
| `POST /api/export/bnotes` | 导出 BNotes 格式 JSON |
| `POST /api/import/bnotes` | 导入 BNotes 格式数据 |

#### 清理
- 删除废弃的 PHP 后端目录 `backend/`
- 删除废弃配置文件：`composer.json`、`build.ps1`、`electron-builder.json`、`VERSIONS.md`、`BUILD_GUIDE.md`、`RELEASE.md`

#### 变更文件
| 文件 | 变更说明 |
|------|----------|
| `frontend/src/views/NotesList.vue` | 重写为多模式查看 |
| `frontend/src/views/ThemeSettings.vue` | 新建主题设置页面 |
| `frontend/src/views/ImportExport.vue` | 新建导入导出页面 |
| `frontend/src/styles/main.css` | 改为 HSL 色相变量，莫兰迪色系 |
| `frontend/src/App.vue` | 新增主题/导入导出导航，主题加载逻辑 |
| `frontend/src/main.js` | 启动时加载主题避免闪烁 |
| `frontend/src/router/index.js` | 新增主题/导入导出路由 |
| `frontend/src/stores/books.js` | 新增导出/导入方法 |
| `backend-node/server.js` | 新增导出/导入 API |
| `electron/main.js` | 版本号更新 |

---

## [1.2.0] - 2026-06-15

### 阶段二 · 功能增强

#### 新增
- **分类引用功能**：点击分类旁"查看书籍"按钮，展开显示该分类下所有书籍，支持点击跳转
- **标签引用功能**：点击标签旁"查看书籍"按钮，展开显示拥有该标签的所有书籍
- **标签分组管理**：新增管理模式，可给标签设置分组名称，按分组展示标签
- **反馈入口**：侧边栏新增"反馈"导航，支持 Bug 反馈和功能建议，支持文字描述和图片上传（至少填一项）
- **书架封面模式**：书架支持列表/封面两种视图切换，封面模式展示书籍封面图片，视图偏好自动保存
- **书籍封面上传**：编辑书籍时可上传封面图片（支持 2MB 以内图片），书籍详情页展示封面

#### 后端 API 新增
| 端点 | 说明 |
|------|------|
| `GET /api/categories/:id/books` | 获取某分类下的书籍 |
| `GET /api/tags/:id/books` | 获取某标签下的书籍 |
| `POST /api/feedback` | 提交反馈 |
| `GET /api/settings/:key` | 获取设置 |
| `PUT /api/settings/:key` | 保存设置 |

#### 数据库变更
- books 表新增 `cover` 字段（封面图片 base64）
- tags 表新增 `group_name` 字段（标签分组名）
- 新增 `feedback` 表（反馈记录）

#### 变更文件
| 文件 | 变更说明 |
|------|----------|
| `backend-node/database.js` | 新增 cover、group_name 字段，新增 feedback 表 |
| `backend-node/server.js` | 新增 5 个 API 端点，cover/group_name 字段支持 |
| `frontend/src/views/Home.vue` | 封面/列表视图切换，封面模式展示 |
| `frontend/src/views/BookEdit.vue` | 封面图片上传功能 |
| `frontend/src/views/BookDetail.vue` | 展示封面图片 |
| `frontend/src/views/CategoriesManage.vue` | 分类引用查看书籍 |
| `frontend/src/views/TagsManage.vue` | 标签引用+分组管理 |
| `frontend/src/views/FeedbackView.vue` | 新建反馈页面 |
| `frontend/src/stores/books.js` | 新增 5 个 store 方法 |
| `frontend/src/router/index.js` | 新增反馈路由 |
| `frontend/src/App.vue` | 侧边栏新增反馈导航 |

---

## [1.1.0] - 2026-06-15

### 后端迁移：PHP -> Node.js

#### 变更
- 后端从 PHP 迁移到 Node.js/Express + sql.js（纯 JS SQLite，无需编译）
- Electron 主进程直接启动 Express 服务器（不再使用子进程，避免打包后路径问题）
- 打包方式从 electron-builder 改为手动便携版打包（避免 winCodeSign 签名问题）
- 数据目录独立于程序目录：打包后用户数据保存在 BNotes.exe 同级的 data/ 目录
- 更新时自动保留 data/ 和 exports/ 目录，仅替换程序文件

#### 新增文件
| 文件 | 说明 |
|------|------|
| `backend-node/server.js` | Node.js/Express 后端，完全复刻 PHP 后端所有 API |
| `backend-node/database.js` | sql.js 数据库模块，防抖保存，进程退出时同步保存 |
| `build-portable.ps1` | 便携版打包脚本，自动保留用户数据 |

#### 修改文件
| 文件 | 变更说明 |
|------|----------|
| `electron/main.js` | 主进程直接 require 服务器模块，打包模式下数据路径指向 exe 同级目录 |
| `index.html` | 改为 Vite 入口文件，引用 frontend/src/main.js |
| `package.json` | 新增 express/cors/sql.js 依赖，版本 1.1.0，新增 author 字段 |
| `vite.config.js` | 代理目标改为 localhost:18765 |
| `frontend/src/stores/books.js` | API_BASE 改为 localhost:18765 |

### 阶段一 · 小修小改

#### 修复
- 修复"未分类"类别无法删除的问题，现在所有分类均可删除（仅剩最后一个分类时禁止删除，删除后该分类下书籍自动移至其他分类）

#### 新增
- 编辑书籍时支持 Ctrl+S 快捷键保存
- 顶部菜单栏全部改为中文显示（撤销、重做、剪切、复制、粘贴、全选、重新加载、开发者工具、放大、缩小、全屏、退出）
- 笔记时间记录模式：支持"自动记录"和"自定义时间"两种模式，自定义模式下可手动选择笔记时间
- 书籍详情页显示笔记时间（优先显示自定义时间，否则显示创建时间）
- 书架书名去重校验：创建和编辑书籍时检查书名唯一性，重复时提示用户修改

#### 变更文件
| 文件 | 变更说明 |
|------|----------|
| `backend/models/Category.php` | 移除 id==1 硬编码限制，改为动态查找回退分类 |
| `backend/models/Book.php` | 新增 checkTitleExists 方法，create/update 时查重；allowedNoteFields 增加 note_date |
| `backend/models/Note.php` | allowedFields 增加 note_date |
| `backend/database.php` | notes 表新增 note_date 字段，兼容已有数据库 |
| `frontend/src/views/CategoriesManage.vue` | 删除按钮逻辑改为仅剩一个分类时禁用 |
| `frontend/src/views/BookEdit.vue` | 添加 Ctrl+S 快捷键、笔记时间模式切换、书名重复提示 |
| `frontend/src/views/BookDetail.vue` | 笔记区域显示笔记时间 |
| `electron/main.js` | 所有菜单项改为中文 label |

---

## [1.0.1] - 2026-04-XX

### 待加入功能
- [ ] PDF 导出功能完善
- [ ] 笔记关联跳转功能
- [ ] 批量操作（删除/移动/导出）
- [ ] 数据导入导出
- [ ] 云端同步

### 已知问题
- [ ] 暂无

---

## [1.0.0] - 2026-04-26

### 首次发布
- ✅ 基础框架搭建
- ✅ 书籍 CRUD
- ✅ 笔记管理
- ✅ 分类系统
- ✅ 标签系统
- ✅ 阅读进度追踪
- ✅ 全局搜索
- ✅ 暗色模式
- ✅ 快捷键支持
- ✅ Electron 桌面打包
