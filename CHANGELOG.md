# 更新日志

所有重要的版本更新都会记录在此文件中。

## [1.9.5] - 2026-11-01

### 体验完善批次：草稿保护、搜索范围、预览式 PDF 导出

#### 新增
- **草稿自动保存**：编辑笔记时每秒自动保存草稿，中途切走不丢内容；回到编辑页自动恢复并提示，可一键放弃；保存成功后草稿自动清除（新建未保存的书同样受保护）
- **首页草稿箱**：书架顶部仅在存在草稿时显示草稿箱（书名 + 摘要），点击继续编辑或逐条放弃
- **编辑器内联新建分类**：分类下拉框下方可直接输入并新建分类，交互与标签一致，无需跳转分类管理页
- **搜索范围切换**：搜索结果页可选「全部 / 书名搜索 / 笔记搜索」，后端、桌面与移动端本地 store 同步支持
- **统计概览卡跳转**：总藏书→书架、想读/在读/已读→书架并自动带上状态筛选、笔记条数→笔记页（移动端复用共享组件自动生效）
- **标签分组展示**：管理模式分组后，退出管理模式按组展示（未分组的归入「未分组」置底）；从未分过组则保持平铺不显示组标题

#### 修复
- **新建书籍丢失笔记内容**：桌面端后端 `POST /api/books` 原只建空笔记行，现同步保存金句/读后感/笔记整理与关联书籍；移动端本地 store 同补关联书籍保存
- **PDF 导出按预览样式渲染**：不再剥离 Markdown 直接打印编辑原文，改为渲染标题、加粗、行内代码、有序/无序列表（悬挂缩进）、引用块（左侧竖条）、代码块（灰底）、分隔线
- **PDF 分页截断**：排版阶段按页断行，行内容不再被页边界拦腰截断，标题不孤悬页尾
- **导出文件名自动生成**：单本导出为「书名-日期.pdf」，多本合并仍为「书记笔记-日期.pdf」
- 界面文案统一为「书记」：窗口标题、关于对话框、侧栏 logo、页面标题
- 笔记时间/最后编辑只显示日期，不再带时分
- 书籍详情空状态按钮重叠修复
- 反馈页改为联系方式展示（邮箱 + 小红书，点击复制）

#### 其他
- 使用说明补全：README（中英双语）、移动端使用指南、桌面 docx/pdf 手册均新增「版本更新」指引与自动保存说明
- 打包脚本增强：程序运行中拒绝打包、release 目录自动创建；产物文件名含版本号
- 版本号五处同步至 1.9.5（根 / electron / 关于对话框 / mobile / versionCode 14）

---

## [1.9.4] - 2026-10-31

### 移动端集中修复同步 & 桌面端体验修复（两端版本对齐）

#### 修复（桌面端）
- **搜索误触发**：搜索框改为回车 / 按钮触发，空关键词不跳转（原实现每输入一个字符即跳转，删除键也会误触发）
- **搜索快捷键**：补充 Ctrl+F 聚焦搜索框（占位符原有承诺）与 Esc 清空
- **PDF 导出重构**：改为 Canvas 排版转图片嵌入 PDF（`frontend/src/utils/pdfExport.js`），修复中文乱码（原 helvetica 字体不支持中文）、长笔记分页截断、emoji 显示异常

#### 修复（移动端 v1.9.1–v1.9.4）
- 保存新笔记后返回原界面（原为空白页）
- 标签添加：输入框 + 添加按钮 + 已有标签联想
- 书架列表改为细长文件夹样式；书架名称可点击编辑
- 笔记页分类页签：书籍 / 金句 / 读后感 / 笔记
- 标签点击展开关联书籍列表 + 数量徽标
- 主题文案修正为「自动生成护眼主题」
- 封面图片上传限制 7MB
- Android 返回键接管（仅主页退出，其余返回上一界面）
- 移动端本地 store 修复：time_mode 列缺失致笔记空白、空 id 防护、notes 关联查询补全
- vite 构建重定向修复（桌面视图误依赖 HTTP store 导致全功能静默失效）与依赖去重
- 应用图标替换为桌面版同款；反馈页重构、账号显示、打赏与使用指南页

#### 其他
- 桌面端新增低调打赏入口（侧边栏底部 ☕）与打赏页，移动端打赏页保持不变；打赏码图片改为本地资源不入库（`assets/donate/`，图片缺失时页面自动隐藏，不影响构建）
- 打赏码历史已从仓库彻底移除（历史重写），`.gitignore` 永久忽略双端 `assets/donate/` 目录
- 新增 `DEV_PROTOCOL.md`：仓库推送范围与双端开发协议
- `.gitignore` 增加 `分享包/`（发布产物不入库）
- 版本号五处同步至 1.9.4（根 / electron / 关于对话框 / mobile / versionCode 13）

---

## [1.9.0] - 2026-10-07

### 阶段八 · 新功能扩展（二）阅读统计看板

#### 新增
- **阅读统计看板**：新增独立统计页面（`/stats`），三个页签切换展示
  - **概览**：总藏书 / 想读 / 在读 / 已读 / 笔记条数数字卡
  - **状态分布**：自绘 SVG 环形图 + 图例（想读/在读/已读 数量与占比）
  - **阅读趋势**：按 `read_date` 统计已读数量柱状图，年度选择器（"全部"按年汇总 / 具体年份展开 12 个月）
- **零依赖图表**：柱状图 / 环形图全部手写 SVG，无新增图表库，风格与莫兰迪主题融合，两端离线可用
- **纯前端计算**：从 store 书籍数据直接统计，无新增后端 API，桌面端与移动端共用同一套视图
- 桌面端侧边栏新增"统计"入口；移动端"更多"页新增"阅读统计"入口

#### 变更文件
| 文件 | 变更说明 |
|------|----------|
| `frontend/src/views/StatisticsView.vue` | 新建统计看板页面 |
| `frontend/src/router/index.js` | 新增 /stats 路由 |
| `frontend/src/App.vue` | 侧边栏新增"统计"入口 |
| `mobile/src/router/index.js` | 新增 /stats 路由 |
| `mobile/src/views/MoreView.vue` | "更多"页新增"阅读统计"入口 |
| `package.json` / `mobile/package.json` / `electron/package.json` / `electron/main.js` | 版本号 1.9.0 |

---

## [1.8.0] - 2026-09-30

### 阶段八 · 新功能扩展（一）Markdown 笔记支持

#### 新增
- **Markdown 笔记支持**：金句摘录 / 读后感 / 笔记整理三个字段全面支持 Markdown 语法
  - 编辑页每个字段新增"编辑 / 预览"页签，预览实时渲染，不引入重编辑器
  - 书籍详情页与笔记卡片同步按 Markdown 渲染展示
  - 关联书籍关键词高亮在渲染后的内容中仍生效（仅替换文本节点，不破坏 HTML 结构）
  - 基于 markdown-it 本地打包（纯 JS），桌面端与移动端离线可用
- **零迁移兼容**：既有纯文本笔记本身就是合法 Markdown，无需改动数据即无缝升级

#### 变更文件
| 文件 | 变更说明 |
|------|----------|
| `frontend/src/utils/markdown.js` | 新建 Markdown 渲染工具（含关键词高亮） |
| `frontend/src/views/BookEdit.vue` | 三个笔记字段新增编辑/预览页签 |
| `frontend/src/views/BookDetail.vue` | 内容区改为 Markdown 渲染 |
| `frontend/src/views/NotesList.vue` | 笔记卡片改为 Markdown 渲染 |
| `package.json` / `mobile/package.json` | 新增 markdown-it 依赖，版本号 1.8.0 |
| `electron/package.json` / `electron/main.js` | 版本号 1.8.0 |

---

## [1.7.0] - 2026-09-30

### 阶段七 · 数据安全与同步

#### 新增
- **自动备份**：应用每次退出、每 24 小时自动备份数据库，自动保留最近 10 份备份
  - 手动"立即备份"随时生成带时间戳的快照
  - "导入导出 → 备份与同步"页面可查看备份列表、一键恢复
  - 恢复前自动先备份当前数据，防止恢复失败丢失数据
- **WebDAV 云同步**：通过 WebDAV（坚果云、Nextcloud 等）将备份上传云端或从云端拉取恢复
  - 配置：启用开关 + 地址/账号/密码/远端目录
  - 测试连接：PROPFIND 探测，区分网络错误与认证失败
  - 上传到云端：生成备份并 PUT 上传到远端目录
  - 从云端恢复：PROPFIND 列出远端 `.db` 文件，按修改时间取最新下载并恢复
- 恢复备份/同步拉取后自动重建内存数据库实例，界面数据立即刷新

#### 变更文件
| 文件 | 变更说明 |
|------|----------|
| `backend-node/database.js` | 新增自动备份、备份列表、恢复、重载内存库逻辑 |
| `backend-node/server.js` | 新增备份 API（3 个）+ WebDAV 同步 API（5 个） |
| `frontend/src/stores/books.js` | 新增备份/同步 8 个 store 方法 |
| `frontend/src/views/ImportExport.vue` | 新增"备份与同步"页签 |
| `package.json` | 版本号 1.7.0 |

---

## [1.6.0] - 2026-09-30

### 阶段六 · 桌面端体验打磨

#### 新增
- **PDF 导出**：导入导出页新增"导出 PDF"按钮，基于 jsPDF 将选中书籍（含金句/读后感/笔记内容）排版为 PDF，桌面端与移动端均可使用

#### 修复
- **批量移动体验**：书架页"批量移动"从 `prompt` 手输分类 ID 改为下拉框选择分类，未选分类时提示
- **菜单"导出"失效**：Electron 菜单中"导出"此前发送无人监听的 `export-pdf` 事件，现改为直接跳转导入导出页（`Ctrl+E` 同样生效）

#### 变更文件
| 文件 | 变更说明 |
|------|----------|
| `frontend/src/views/Home.vue` | 批量移动改为分类下拉选择 |
| `electron/main.js` | 菜单"导出"跳转导入导出页 |
| `frontend/src/views/ImportExport.vue` | 新增 PDF 导出 |
| `mobile/package.json` | 补 jspdf 依赖 |

---

## [1.5.0] - 2026-09-30

### 阶段五 · 移动端离线修复与加固

#### 新增
- **备份/恢复数据库**：移动端"更多"页面新增"备份数据库"与"恢复备份"
  - 备份：导出整个数据库为 `.db` 文件，原生平台通过系统分享面板保存/发送
  - 恢复：选择 `.db` 备份文件，确认后替换当前全部数据并自动刷新
- **导出改为原生分享**：移动端 ZIP 导出改用 Capacitor Filesystem + Share，走系统分享面板，Web 环境自动降级为浏览器下载

#### 修复
- **移动端 sql.js 离线加载**：修复 `initSqlJs` 未导入的问题，sql-wasm 从 CDN 改为随 APK 本地打包，真正实现"无需联网、零网络权限"
- 移除无代码引用的遗留配置 `version.config.json`
- `electron/package.json` 精简为当前架构（删除 PHP 时代遗留配置）

#### 变更文件
| 文件 | 变更说明 |
|------|----------|
| `mobile/src/database.js` | 显式导入 sql.js，wasm 本地打包 |
| `mobile/src/views/MoreView.vue` | 新增备份/恢复入口 |
| `mobile/src/stores/books.js` | ZIP 导出改用 Capacitor 原生分享 |
| `mobile/public/sql-wasm.wasm` | wasm 本地资源（随 APK 打包） |
| `.gitignore` | 新增 data/（用户数据库不入库） |
| `electron/package.json` | 精简为当前架构 |

---

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
