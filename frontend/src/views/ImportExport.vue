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
        </div>

        <div v-if="exportError" class="message error">{{ exportError }}</div>
        <div v-if="exportSuccess" class="message success">导出成功！文件已开始下载</div>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useBookStore } from '../stores/books'

const bookStore = useBookStore()

const activeTab = ref('export')
const selectedBookIds = ref([])
const exporting = ref(false)
const exportError = ref('')
const exportSuccess = ref(false)

const isDragOver = ref(false)
const importFile = ref(null)
const importFileData = ref(null)
const previewData = ref(null)
const importMode = ref('local')
const importing = ref(false)
const importError = ref('')
const importResult = ref(null)

onMounted(() => {
  bookStore.fetchBooks()
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
</style>
