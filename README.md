# 书记 BNotes

书记（BNotes）是一个简洁、高效、离线优先的桌面读书笔记管理工具。为每一本书建立完整的阅读档案：金句摘录、读后感、整理笔记，一个都不少。

## 功能特点

### 📚 书籍管理
- 书架式管理，支持列表 / 封面两种视图
- 阅读状态：想读 / 在读 / 已读，百分比进度追踪
- 自定义封面、作者、分类、标签
- 书籍之间可建立关联（笔记中输入书名或关键词即可互链）

### ✍️ 笔记写作
- 每本书三个笔记板块：**金句摘录 / 读后感 / 笔记整理**
- 全面支持 **Markdown** 语法，编辑 / 预览一键切换
- **编辑自动保存草稿**：中途离开不丢内容，回到编辑页或首页草稿箱一键继续
- 笔记流视图：按书籍、金句、读后感、整理笔记多维度浏览
- 全局搜索：可按书名或笔记内容分范围快速查找

### 📊 阅读统计
- 概览数字卡：总藏书、想读、在读、已读、笔记条数
- 阅读状态环形图，直观展示书架构成
- 阅读趋势柱状图：按年度 / 月度统计已读数量
- 零依赖自绘图表，离线可用

### 📄 导入导出
- 导出 PDF（含书籍信息与全部笔记，自动排版分页）
- 导出 HTML / 纯文本
- ZIP 压缩包完整备份导出 / 导入
- 书籍分享：将单本书连同笔记分享给他人导入

### 🛡️ 数据安全
- 自动备份：程序退出与每日定时备份，保留最近 10 份，一键恢复
- **WebDAV 云同步**：支持坚果云、Nextcloud 等，备份上云 / 云端恢复
- 数据完全本地存储，不上传任何服务器

### 🎨 主题外观
- 5 套莫兰迪预设配色 + 色环自定义主题色
- 明暗模式一键切换

### ⌨️ 高效操作
- 常用操作快捷键支持（`Ctrl+F` 全局搜索等）

## 下载使用

1. 前往 [Releases](../../releases) 页面下载最新版压缩包（如 `BNotes书记V1.9.4-win.zip`）
2. 解压后双击 `BNotes.exe` 即可运行，**无需安装**，绿色便携
3. 数据保存在程序同目录的 `data/` 文件夹下，方便随程序一起拷贝迁移

## 版本更新

1. 前往 [Releases](../../releases) 下载最新版压缩包，解压得到新版 `BNotes` 文件夹
2. 把旧版文件夹中的 `data/`、`exports/`、`userdata/` 三个文件夹复制到新版文件夹中（书籍、笔记与设置全部保存在这里）
3. 运行新版 `BNotes.exe`，确认数据完好后，旧版文件夹可自行删除
4. 程序自带自动备份（退出时与每日定时，保留最近 10 份），更新前建议先在程序内手动备份一次，万一更新出问题可随时恢复

---

# Shuji BNotes (English)

Shuji (BNotes) is a clean, efficient, offline-first desktop reading-notes manager. It builds a complete reading archive for every book: quote excerpts, reflections, and organized notes — nothing missed.

## Features

### 📚 Book Management
- Bookshelf-style management with list / cover views
- Reading status: Want to Read / Reading / Finished, with percentage progress tracking
- Custom cover, author, category, and tags
- Cross-book links (type a book title or keyword in a note to link books together)

### ✍️ Note Writing
- Three note sections per book: **Excerpts / Reflections / Organized Notes**
- Full **Markdown** support with one-click edit / preview switching
- **Auto-saved drafts**: leave mid-edit without losing content; resume from the editor or the draft box on the home page
- Notes feed view: browse by book, excerpts, reflections, or organized notes
- Scoped global search: search by book title or by note content

### 📊 Reading Statistics
- Overview cards: total books, want to read, reading, finished, note count
- Reading-status donut chart for shelf composition
- Reading trend bar chart by year / month
- Zero-dependency self-drawn charts, fully offline

### 📄 Import & Export
- PDF export (book info plus all notes, auto pagination)
- HTML / plain-text export
- Full backup export / import as a ZIP archive
- Book sharing: share a single book with its notes for others to import

### 🛡️ Data Safety
- Auto backup: on exit and daily, keeping the latest 10, one-click restore
- **WebDAV cloud sync**: works with Jianguoyun (Nutstore), Nextcloud, etc.
- All data stored locally, never uploaded to any server

### 🎨 Themes
- 5 Morandi preset palettes + custom theme color picker
- One-click light / dark mode switching

### ⌨️ Productivity
- Keyboard shortcuts for common actions (`Ctrl+F` global search, etc.)

## Download & Install

1. Go to the [Releases](../../releases) page and download the latest zip (e.g. `BNotes书记V1.9.4-win.zip`)
2. Extract and double-click `BNotes.exe` to run — **no installation required**, fully portable
3. Data lives in the `data/` folder next to the program, easy to copy and migrate

## Upgrading

1. Download the latest zip from [Releases](../../releases) and extract the new `BNotes` folder
2. Copy the `data/`, `exports/`, and `userdata/` folders from your old folder into the new one (all books, notes, and settings live there)
3. Run the new `BNotes.exe`; once you confirm your data is intact, the old folder can be deleted
4. The app auto-backs up (on exit and daily, keeping the latest 10). Before upgrading, it is recommended to run a manual backup inside the app so you can restore anytime if anything goes wrong

## Development

```bash
# Install dependencies
npm install

# Dev mode (frontend HMR + backend server)
npm run dev:all

# Build frontend (dist/)
npm run build

# Package Windows portable exe (output to release/)
npm run dist
```

Tech stack: Electron + Vue 3 + Express + sql.js

## Feedback

Questions or feature requests? Please open an [Issue](../../issues).

## License

[MIT License](LICENSE)
