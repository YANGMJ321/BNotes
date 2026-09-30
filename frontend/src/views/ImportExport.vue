<template>
  <div class="import-export-view">
    <h1>导入导出</h1>

    <div class="tab-bar">
      <button class="tab-btn" :class="{ active: activeTab === 'export' }" @click="activeTab = 'export'">
        导出
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'import' }" @click="activeTab = 'import'">
        导入
      </button>
      <button
        v-if="isDesktop"
        class="tab-btn"
        :class="{ active: activeTab === 'backup' }"
        @click="activeTab = 'backup'; loadBackups()"
      >
        备份与同步
      </button>
    </div>

    <!-- 导出 Tab -->
    <div v-if="activeTab === 'export'" class="tab-content">
      <div class="export-card">
        <div class="card-header">
          <h2>选择要导出的书籍</h2>
          <div class="select-actions">
            <button class="btn btn-sm btn-secondary" @click="selectAll">全选</button>
            <button class="btn btn-sm btn-secondary" @click="deselectAll">取消全选</button>
            <span class="select-count">已选 {{ selectedBookIds.length }} / {{ bookStore.books.length }} 本</span>
          </div>
        </div>

        <div v-if="bookStore.books.length === 0" class="empty-tip">
          书架为空，暂无可导出的书籍
        </div>

        <div v-else class="book-list">
          <label
            v-for="book in bookStore.books"
            :key="book.id"
            class="book-item"
            :class="{ selected: selectedBookIds.includes(book.id) }"
          >
            <input
              type="checkbox"
              :value="book.id"
              v-model="selectedBookIds"
              class="book-checkbox"
            />
            <div class="book-info">
              <span class="book-title">{{ book.title }}</span>
              <span class="book-meta">{{ book.author || '未知作者' }}</span>
            </div>
            <span class="book-status" :class="'status-' + book.status">
              {{ statusLabel(book.status) }}
            </span>
          </label>
        </div>

        <div class="card-footer">
          <button
            class="btn btn-primary"
            :disabled="selectedBookIds.length === 0 || exporting"
            @click="handleExport"
          >
            {{ exporting ? '导出中...' : '导出选中书籍' }}
          </button>
          <button
            class="btn btn-secondary"
            :disabled="selectedBookIds.length === 0 || exportingPdf"
            @click="handleExportPdf"
          >
            {{ exportingPdf ? '生成中...' : '导出 PDF' }}
          </button>
        </div>

        <div v-if="exportError" class="message error">{{ exportError }}</div>
        <div v-if="exportSuccess" class="message success">导出成功！文件已开始下载</div>
        <div v-if="exportPdfSuccess" class="message success">PDF 导出成功！文件已开始下载</div>
      </div>
    </div>

    <!-- 导入 Tab -->
    <div v-if="activeTab === 'import'" class="tab-content">
      <div class="import-card">
        <!-- 上传区域 -->
        <div
          class="upload-zone"
          :class="{ dragover: isDragOver, 'has-file': importFile }"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".json,.zip"
            class="file-input"
            @change="handleFileSelect"
          />
          <template v-if="!importFile">
            <div class="upload-icon">📄</div>
            <p class="upload-text">拖拽文件到此处，或点击选择文件</p>
            <p class="upload-hint">支持 BNotes 导出格式 (.json) 和压缩包 (.zip)</p>
          </template>
          <template v-else>
            <div class="upload-icon">✅</div>
            <p class="upload-text">{{ importFile.name }}</p>
            <p class="upload-hint">点击可重新选择文件</p>
          </template>
        </div>

        <!-- 预览区域 -->
        <div v-if="previewData" class="preview-section">
          <h3>导入预览</h3>
          <div class="preview-stats">
            <div class="stat-item">
              <span class="stat-value">{{ previewData.book_count }}</span>
              <span class="stat-label">书籍</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ previewData.category_count }}</span>
              <span class="stat-label">分类</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ previewData.tag_count }}</span>
              <span class="stat-label">标签</span>
            </div>
          </div>

          <div v-if="previewData.books && previewData.books.length > 0" class="preview-books">
            <div v-for="(book, idx) in previewData.books" :key="idx" class="preview-book-item">
              <span class="preview-book-title">{{ book.title }}</span>
              <span class="preview-book-author">{{ book.author || '未知作者' }}</span>
            </div>
          </div>
        </div>

        <!-- 导入模式选择 -->
        <div v-if="importFileData" class="mode-section">
          <h3>导入模式</h3>
          <div class="mode-options">
            <label class="mode-option" :class="{ active: importMode === 'local' }">
              <input type="radio" v-model="importMode" value="local" />
              <div class="mode-content">
                <span class="mode-title">本地优先</span>
                <span class="mode-desc">只导入本地没有的书籍，重复书名跳过</span>
              </div>
            </label>
            <label class="mode-option" :class="{ active: importMode === 'imported' }">
              <input type="radio" v-model="importMode" value="imported" />
              <div class="mode-content">
                <span class="mode-title">导入优先</span>
                <span class="mode-desc">全部导入，重复书名加后缀 "(导入)"</span>
              </div>
            </label>
            <label class="mode-option" :class="{ active: importMode === 'none' }">
              <input type="radio" v-model="importMode" value="none" />
              <div class="mode-content">
                <span class="mode-title">仅预览</span>
                <span class="mode-desc">只查看内容，不实际导入</span>
              </div>
            </label>
          </div>
        </div>

        <!-- 导入按钮 -->
        <div v-if="importFileData" class="card-footer">
          <button
            class="btn btn-primary"
            :disabled="importing"
            @click="handleImport"
          >
            {{ importing ? '导入中...' : (importMode === 'none' ? '预览内容' : '确认导入') }}
          </button>
          <button class="btn btn-secondary" @click="resetImport">重新选择</button>
        </div>

        <div v-if="importError" class="message error">{{ importError }}</div>

        <!-- 导入结果 -->
        <div v-if="importResult" class="result-section">
          <h3>导入结果</h3>
          <div v-if="importResult.mode === 'none'" class="result-preview">
            <p>预览模式，未实际导入数据</p>
          </div>
          <div v-else class="result-stats">
            <div class="stat-item">
              <span class="stat-value">{{ importResult.imported }}</span>
              <span class="stat-label">成功导入</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ importResult.skipped }}</span>
              <span class="stat-label">跳过重复</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ importResult.renamed }}</span>
              <span class="stat-label">重命名导入</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ importResult.total }}</span>
              <span class="stat-label">总计</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 备份与同步 Tab（仅桌面端） -->
    <div v-if="activeTab === 'backup' && isDesktop" class="tab-content">
      <!-- 自动备份说明 -->
      <div class="backup-card">
        <div class="card-header">
          <h2>数据备份</h2>
          <button class="btn btn-primary" :disabled="backingUp" @click="handleCreateBackup">
            {{ backingUp ? '备份中...' : '立即备份' }}
          </button>
        </div>
        <p class="backup-hint">
          应用每次退出及每 24 小时自动备份，自动保留最近 10 份备份。
        </p>

        <div v-if="backups.length === 0" class="empty-tip">暂无备份记录</div>
        <div v-else class="backup-list">
          <div v-for="bk in backups" :key="bk.name" class="backup-item">
            <div class="backup-info">
              <span class="backup-name">{{ bk.name }}</span>
              <span class="backup-meta">{{ formatSize(bk.size) }} · {{ formatTime(bk.mtime) }}</span>
            </div>
            <button
              class="btn btn-sm btn-secondary"
              :disabled="restoring"
              @click="handleRestoreBackup(bk.name)"
            >
              恢复
            </button>
          </div>
        </div>

        <div v-if="backupMessage" class="message" :class="backupMessageType">{{ backupMessage }}</div>
      </div>

      <!-- WebDAV 同步 -->
      <div class="sync-card">
        <div class="card-header">
          <h2>WebDAV 云同步</h2>
        </div>
        <p class="backup-hint">
          通过 WebDAV（如坚果云、Nextcloud）将备份上传到云端，也可从云端拉取恢复。
        </p>

        <div class="sync-form">
          <label class="sync-field">
            <span class="sync-label">启用同步</span>
            <input type="checkbox" v-model="syncForm.enabled" class="sync-checkbox" />
          </label>
          <label class="sync-field">
            <span class="sync-label">WebDAV 地址</span>
            <input
              v-model="syncForm.url"
              type="text"
              placeholder="https://dav.jianguoyun.com/dav/"
              class="sync-input"
            />
          </label>
          <label class="sync-field">
            <span class="sync-label">账号</span>
            <input v-model="syncForm.username" type="text" class="sync-input" />
          </label>
          <label class="sync-field">
            <span class="sync-label">密码</span>
            <input v-model="syncForm.password" type="password" class="sync-input" />
          </label>
          <label class="sync-field">
            <span class="sync-label">远端目录</span>
            <input v-model="syncForm.remotePath" type="text" placeholder="/BNotes/" class="sync-input" />
          </label>
        </div>

        <div class="sync-actions">
          <button class="btn btn-secondary" :disabled="syncing" @click="handleSaveSync">保存配置</button>
          <button class="btn btn-secondary" :disabled="testingSync" @click="handleTestSync">测试连接</button>
          <button class="btn btn-primary" :disabled="syncing" @click="handlePushSync">上传到云端</button>
          <button class="btn btn-primary" :disabled="syncing" @click="handlePullSync">从云端恢复</button>
        </div>

        <div v-if="syncMessage" class="message" :class="syncMessageType">{{ syncMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useBookStore } from '../stores/books'

const bookStore = useBookStore()

const activeTab = ref('export')
const selectedBookIds = ref([])
const exporting = ref(false)
const exportingPdf = ref(false)
const exportError = ref('')
const exportSuccess = ref(false)
const exportPdfSuccess = ref(false)

const isDragOver = ref(false)
const importFile = ref(null)
const importFileData = ref(null)
const previewData = ref(null)
const importMode = ref('local')
const importing = ref(false)
const importError = ref('')
const importResult = ref(null)

// 备份与同步状态（仅桌面端）
const isDesktop = ref(!!bookStore.createBackup)
const backups = ref([])
const backingUp = ref(false)
const restoring = ref(false)
const backupMessage = ref('')
const backupMessageType = ref('success')
const syncForm = ref({ enabled: false, url: '', username: '', password: '', remotePath: '/BNotes/' })
const syncing = ref(false)
const testingSync = ref(false)
const syncMessage = ref('')
const syncMessageType = ref('success')

async function loadBackups() {
  backups.value = await bookStore.fetchBackups()
}

async function handleCreateBackup() {
  backingUp.value = true
  backupMessage.value = ''
  const result = await bookStore.createBackup()
  backupMessage.value = result.message || (result.code === 200 ? '备份成功' : '备份失败')
  backupMessageType.value = result.code === 200 ? 'success' : 'error'
  if (result.code === 200) await loadBackups()
  backingUp.value = false
}

async function handleRestoreBackup(name) {
  if (!confirm(`确定从备份 ${name} 恢复吗？当前数据将被覆盖。`)) return
  restoring.value = true
  backupMessage.value = ''
  const result = await bookStore.restoreBackup(name)
  backupMessage.value = result.message || '恢复失败'
  backupMessageType.value = result.code === 200 ? 'success' : 'error'
  restoring.value = false
}

async function loadSyncConfig() {
  const cfg = await bookStore.getSyncConfig()
  if (cfg) {
    syncForm.value = { ...syncForm.value, ...cfg }
  }
}

async function handleSaveSync() {
  syncing.value = true
  syncMessage.value = ''
  const result = await bookStore.saveSyncConfig(syncForm.value)
  syncMessage.value = result.message || (result.code === 200 ? '配置已保存' : '保存失败')
  syncMessageType.value = result.code === 200 ? 'success' : 'error'
  syncing.value = false
}

async function handleTestSync() {
  testingSync.value = true
  syncMessage.value = ''
  const result = await bookStore.testSync(syncForm.value)
  syncMessage.value = result.message || '测试失败'
  syncMessageType.value = result.code === 200 ? 'success' : 'error'
  testingSync.value = false
}

async function handlePushSync() {
  syncing.value = true
  syncMessage.value = ''
  const result = await bookStore.pushSync()
  syncMessage.value = result.message || '上传失败'
  syncMessageType.value = result.code === 200 ? 'success' : 'error'
  syncing.value = false
}

async function handlePullSync() {
  if (!confirm('将从云端拉取最新备份并覆盖当前数据，确定继续吗？')) return
  syncing.value = true
  syncMessage.value = ''
  const result = await bookStore.pullSync()
  syncMessage.value = result.message || '拉取失败'
  syncMessageType.value = result.code === 200 ? 'success' : 'error'
  syncing.value = false
}

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function formatTime(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleString('zh-CN', { hour12: false })
  } catch (e) {
    return iso
  }
}

onMounted(() => {
  bookStore.fetchBooks()
  if (isDesktop.value) loadSyncConfig()
})

function statusLabel(status) {
  const map = { want: '想读', reading: '在读', done: '已读' }
  return map[status] || status
}

function selectAll() {
  selectedBookIds.value = bookStore.books.map(b => b.id)
}

function deselectAll() {
  selectedBookIds.value = []
}

async function handleExport() {
  if (selectedBookIds.value.length === 0) return
  exporting.value = true
  exportError.value = ''
  exportSuccess.value = false

  try {
    const result = await bookStore.exportBnotes(selectedBookIds.value)
    if (result.code === 200) {
      exportSuccess.value = true
      setTimeout(() => { exportSuccess.value = false }, 3000)
    } else {
      exportError.value = result.message || '导出失败'
    }
  } catch (e) {
    exportError.value = '导出失败：' + e.message
  }
  exporting.value = false
}

async function handleExportPdf() {
  if (selectedBookIds.value.length === 0) return
  exportingPdf.value = true
  exportError.value = ''
  exportPdfSuccess.value = false

  try {
    // 从当前已加载的书架数据中筛出选中的书籍
    const selected = bookStore.books.filter(b => selectedBookIds.value.includes(b.id))
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    const statusMap = { want: '想读', reading: '在读', done: '已读' }
    let cursorY = 20

    // 逐本获取完整数据（含笔记），保证两端字段一致
    for (const book of selected) {
      const detail = await bookStore.fetchBook(book.id)
      const full = detail?.code === 200 ? detail.data : book
      const note = full.note || {}

      // 书籍标题
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(full.title || '未命名', 15, cursorY)
      cursorY += 7

      // 元信息
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const metaParts = []
      if (full.author) metaParts.push(`作者: ${full.author}`)
      if (full.category_name) metaParts.push(`分类: ${full.category_name}`)
      metaParts.push(`状态: ${statusMap[full.status] || full.status}`)
      if (full.progress != null) metaParts.push(`进度: ${full.progress}%`)
      doc.setTextColor(120, 120, 120)
      doc.text(metaParts.join(' | '), 15, cursorY)
      doc.setTextColor(0, 0, 0)
      cursorY += 7

      if (full.tags) {
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`标签: ${full.tags.split(',').join('、')}`, 15, cursorY)
        doc.setTextColor(0, 0, 0)
        cursorY += 7
      }

      // 笔记内容
      const sections = [
        { title: '金句摘录', content: note.excerpts },
        { title: '读后感', content: note.reflections },
        { title: '笔记内容', content: note.content }
      ]
      for (const sec of sections) {
        if (!sec.content) continue
        // 检查是否需要新页
        if (cursorY > 270) {
          doc.addPage()
          cursorY = 20
        }
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(sec.title, 15, cursorY)
        cursorY += 6
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        const lines = doc.splitTextToSize(sec.content, 180)
        for (const line of lines) {
          if (cursorY > 280) {
            doc.addPage()
            cursorY = 20
          }
          doc.text(line, 15, cursorY)
          cursorY += 5
        }
        cursorY += 6
      }

      cursorY += 10
      // 分隔线：若空间不足则翻页
      if (cursorY > 280) {
        doc.addPage()
        cursorY = 20
      }
    }

    doc.save(`BNotes-PDF-${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.pdf`)
    exportPdfSuccess.value = true
    setTimeout(() => { exportPdfSuccess.value = false }, 3000)
  } catch (e) {
    exportError.value = 'PDF 导出失败：' + e.message
  }
  exportingPdf.value = false
}

function triggerFileInput() {
  const input = document.querySelector('.import-card .file-input')
  if (input) input.click()
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  processFile(file)
}

function handleDrop(event) {
  isDragOver.value = false
  const file = event.dataTransfer.files[0]
  if (!file) return
  if (!file.name.endsWith('.json') && !file.name.endsWith('.zip')) {
    importError.value = '请选择 .json 或 .zip 格式的文件'
    return
  }
  processFile(file)
}

async function processFile(file) {
  importError.value = ''
  importResult.value = null
  previewData.value = null

  try {
    let data
    if (file.name.endsWith('.zip')) {
      // Parse ZIP file using JSZip
      const JSZip = (await import('jszip')).default
      const zip = await JSZip.loadAsync(file)
      // Find the JSON file inside the zip
      let jsonFile = null
      zip.forEach((relativePath, zipEntry) => {
        if (relativePath.endsWith('.json') && !zipEntry.dir) {
          jsonFile = zipEntry
        }
      })
      if (!jsonFile) {
        importError.value = '压缩包中未找到 .json 数据文件'
        return
      }
      const jsonText = await jsonFile.async('string')
      data = JSON.parse(jsonText)
    } else {
      const reader = new FileReader()
      data = await new Promise((resolve, reject) => {
        reader.onload = (e) => {
          try { resolve(JSON.parse(e.target.result)) } catch (err) { reject(err) }
        }
        reader.onerror = reject
        reader.readAsText(file)
      })
    }

    if (!data.type || data.type !== 'bnotes-export') {
      importError.value = '无效的 BNotes 导出文件格式'
      return
    }
    importFile.value = file
    importFileData.value = data
    previewData.value = {
      book_count: (data.books || []).length,
      category_count: (data.categories || []).length,
      tag_count: (data.tags || []).length,
      books: (data.books || []).map(b => ({ title: b.title, author: b.author }))
    }
  } catch (err) {
    importError.value = '文件解析失败：' + (err.message || '未知错误')
  }
}

async function handleImport() {
  if (!importFileData.value) return
  importing.value = true
  importError.value = ''
  importResult.value = null

  const result = await bookStore.importBnotes(importFileData.value, importMode.value)
  if (result.code === 200) {
    importResult.value = result.data
  } else {
    importError.value = result.message || '导入失败'
  }
  importing.value = false
}

function resetImport() {
  importFile.value = null
  importFileData.value = null
  previewData.value = null
  importResult.value = null
  importError.value = ''
  // Reset file input
  const input = document.querySelector('.file-input')
  if (input) input.value = ''
}
</script>

<style scoped>
.import-export-view {
  max-width: 800px;
}

.import-export-view h1 {
  font-size: 24px;
  margin: 0 0 24px;
}

.tab-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 4px;
  width: fit-content;
}

.tab-btn {
  padding: 10px 28px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.tab-btn.active {
  background: var(--primary-color);
  color: white;
}

.tab-btn:hover:not(.active) {
  color: var(--text-color);
  background: var(--hover-bg);
}

.export-card,
.import-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h2 {
  font-size: 16px;
  margin: 0;
  font-weight: 500;
}

.select-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.select-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 13px;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--tag-bg);
  color: var(--text-color);
}

.btn-secondary:hover {
  background: var(--hover-bg);
}

.empty-tip {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
  font-size: 14px;
}

.book-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.book-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid var(--border-color);
}

.book-item:last-child {
  border-bottom: none;
}

.book-item:hover {
  background: var(--hover-bg);
}

.book-item.selected {
  background: var(--primary-light);
}

.book-checkbox {
  margin-right: 12px;
  width: 16px;
  height: 16px;
  accent-color: var(--primary-color);
}

.book-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.book-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.book-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.book-status {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 500;
}

.status-want {
  background: #e8d5c4;
  color: #8b6914;
}

.status-reading {
  background: #c4d5e8;
  color: #2c5f8a;
}

.status-done {
  background: #c4e8c9;
  color: #2e7d32;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.message {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
}

.message.error {
  background: #f0d6d6;
  color: #8b3a3a;
}

.message.success {
  background: #d6f0d9;
  color: #2e7d32;
}

/* 导入相关样式 */
.upload-zone {
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--input-bg);
}

.upload-zone:hover,
.upload-zone.dragover {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.upload-zone.has-file {
  border-style: solid;
  border-color: var(--primary-color);
}

.file-input {
  display: none;
}

.upload-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 14px;
  color: var(--text-color);
  margin: 0 0 4px;
}

.upload-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

.preview-section,
.mode-section,
.result-section {
  margin-top: 24px;
}

.preview-section h3,
.mode-section h3,
.result-section h3 {
  font-size: 15px;
  margin: 0 0 12px;
  font-weight: 500;
}

.preview-stats,
.result-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px 20px;
  text-align: center;
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-color);
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.preview-books {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.preview-book-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-color);
}

.preview-book-item:last-child {
  border-bottom: none;
}

.preview-book-title {
  font-size: 14px;
  color: var(--text-color);
}

.preview-book-author {
  font-size: 12px;
  color: var(--text-secondary);
}

.mode-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mode-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-option:hover {
  border-color: var(--primary-color);
}

.mode-option.active {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.mode-option input[type="radio"] {
  margin-top: 2px;
  accent-color: var(--primary-color);
}

.mode-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mode-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.mode-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.result-preview {
  padding: 16px;
  background: var(--input-bg);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  text-align: center;
}

/* 备份与同步相关样式 */
.backup-card,
.sync-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}

.backup-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 16px;
  line-height: 1.5;
}

.backup-list {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.backup-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.backup-item:last-child {
  border-bottom: none;
}

.backup-item:hover {
  background: var(--hover-bg);
}

.backup-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.backup-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  word-break: break-all;
}

.backup-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.sync-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}

.sync-field {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sync-label {
  font-size: 13px;
  color: var(--text-secondary);
  width: 110px;
  flex-shrink: 0;
}

.sync-input {
  flex: 1;
  padding: 9px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
}

.sync-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.sync-checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--primary-color);
  cursor: pointer;
}

.sync-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
