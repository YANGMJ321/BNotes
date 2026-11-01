<template>
  <div class="book-edit">
    <h1>{{ isNew ? '新建书籍' : '编辑书籍' }}</h1>

    <form @submit.prevent="saveBook" class="edit-form">
      <div class="draft-banner" v-if="draftRestored">
        <span>已恢复上次未保存的草稿</span>
        <button type="button" @click="discardDraft">放弃草稿</button>
      </div>

      <div class="form-section">
        <h2>基本信息</h2>

        <div class="form-group">
          <label>书名 *</label>
          <input type="text" v-model="form.title" required placeholder="请输入书名" />
        </div>

        <div class="form-group">
          <label>书籍封面</label>
          <div class="cover-upload">
            <div class="cover-preview" v-if="form.cover" :style="{ backgroundImage: `url(${form.cover})` }"></div>
            <div class="cover-placeholder" v-else>
              <span>📖</span>
              <p>点击上传封面</p>
            </div>
            <input type="file" accept="image/*" @change="handleCoverUpload" class="cover-input" />
            <button type="button" v-if="form.cover" class="btn btn-small btn-danger" @click="removeCover">移除封面</button>
          </div>
        </div>

        <div class="form-group">
          <label>作者</label>
          <input type="text" v-model="form.author" placeholder="请输入作者" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>分类</label>
            <select v-model="form.category_id">
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
            <div class="tag-input-row category-input-row">
              <input
                type="text"
                v-model="categoryInput"
                @keydown.enter.prevent="addCategory"
                placeholder="输入名称快速新建分类"
              />
              <button type="button" class="btn-add-tag" @click="addCategory">新建</button>
            </div>
          </div>

          <div class="form-group">
            <label>阅读状态</label>
            <select v-model="form.status">
              <option value="want">想读</option>
              <option value="reading">在读</option>
              <option value="done">已读</option>
            </select>
          </div>
        </div>

        <div class="form-row" v-if="form.status === 'reading'">
          <div class="form-group">
            <label>阅读进度</label>
            <div class="progress-input">
              <input type="range" min="0" max="100" v-model="form.progress" />
              <span>{{ form.progress }}%</span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>阅读日期</label>
          <input type="date" v-model="form.read_date" />
        </div>

        <div class="form-group">
          <label>标签</label>
          <div class="tag-input-row">
            <input
              type="text"
              v-model="tagInput"
              @keydown.enter.prevent="addTag"
              placeholder="输入标签名称"
            />
            <button type="button" class="btn-add-tag" @click="addTag">添加</button>
          </div>
          <div class="tag-suggestions" v-if="tagSuggestions.length">
            <button
              v-for="name in tagSuggestions"
              :key="name"
              type="button"
              class="tag-suggestion"
              @click="addTagName(name)"
            >+ {{ name }}</button>
          </div>
          <div class="tags-display">
            <span class="tag" v-for="(tag, index) in form.tags" :key="index">
              {{ tag }}
              <button type="button" @click="removeTag(index)">×</button>
            </span>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h2>笔记内容</h2>

        <div class="form-group">
          <label>笔记时间</label>
          <div class="time-mode">
            <label class="radio-label">
              <input type="radio" v-model="timeMode" value="auto" /> 自动记录
            </label>
            <label class="radio-label">
              <input type="radio" v-model="timeMode" value="custom" /> 自定义时间
            </label>
          </div>
          <input
            v-if="timeMode === 'custom'"
            type="datetime-local"
            v-model="form.note.note_date"
          />
        </div>

        <div class="form-group">
          <label>金句摘录</label>
          <div class="md-tabs">
            <button
              type="button"
              class="md-tab"
              :class="{ active: !previewMode.excerpts }"
              @click="previewMode.excerpts = false"
            >编辑</button>
            <button
              type="button"
              class="md-tab"
              :class="{ active: previewMode.excerpts }"
              @click="previewMode.excerpts = true"
            >预览</button>
          </div>
          <textarea
            v-if="!previewMode.excerpts"
            v-model="form.note.excerpts"
            rows="5"
            placeholder="支持 Markdown 语法，记录书中的精彩段落..."
          ></textarea>
          <div v-else class="md-preview" v-html="renderMarkdown(form.note.excerpts)"></div>
          <p class="hint">提示：输入书名或关键词后添加关联书籍；支持 Markdown 语法</p>
        </div>

        <div class="form-group">
          <label>读后感</label>
          <div class="md-tabs">
            <button
              type="button"
              class="md-tab"
              :class="{ active: !previewMode.reflections }"
              @click="previewMode.reflections = false"
            >编辑</button>
            <button
              type="button"
              class="md-tab"
              :class="{ active: previewMode.reflections }"
              @click="previewMode.reflections = true"
            >预览</button>
          </div>
          <textarea
            v-if="!previewMode.reflections"
            v-model="form.note.reflections"
            rows="5"
            placeholder="支持 Markdown 语法，写下你的感想和心得..."
          ></textarea>
          <div v-else class="md-preview" v-html="renderMarkdown(form.note.reflections)"></div>
        </div>

        <div class="form-group">
          <label>笔记整理</label>
          <div class="md-tabs">
            <button
              type="button"
              class="md-tab"
              :class="{ active: !previewMode.content }"
              @click="previewMode.content = false"
            >编辑</button>
            <button
              type="button"
              class="md-tab"
              :class="{ active: previewMode.content }"
              @click="previewMode.content = true"
            >预览</button>
          </div>
          <textarea
            v-if="!previewMode.content"
            v-model="form.note.content"
            rows="10"
            placeholder="支持 Markdown 语法，整理书籍的核心内容和笔记..."
          ></textarea>
          <div v-else class="md-preview" v-html="renderMarkdown(form.note.content)"></div>
        </div>

        <div class="form-group">
          <label>关联书籍</label>
          <div class="link-search">
            <input
              type="text"
              v-model="linkSearch"
              @input="searchBooks"
              placeholder="搜索要关联的书籍..."
            />
            <div class="search-results" v-if="searchResults.length">
              <div
                v-for="result in searchResults"
                :key="result.id"
                class="search-result"
                @click="addLink(result)"
              >
                {{ result.title }}
              </div>
            </div>
          </div>
          <div class="links-display" v-if="form.links.length">
            <div v-for="(link, index) in form.links" :key="index" class="link-item">
              <input type="text" v-model="link.keyword" placeholder="关联关键词" />
              <span>{{ getBookTitle(link.target_book_id) }}</span>
              <button type="button" @click="removeLink(index)">×</button>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">{{ isNew ? '创建' : '保存' }}</button>
        <button type="button" class="btn btn-secondary" @click="goBack">取消</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBookStore } from '../stores/books'
import { renderMarkdown } from '../utils/markdown'

const route = useRoute()
const router = useRouter()
const bookStore = useBookStore()

const isNew = computed(() => route.path === '/books/new' || route.params.id === 'new')
const categories = computed(() => bookStore.categories)

const form = reactive({
  title: '',
  author: '',
  cover: '',
  category_id: 1,
  status: 'want',
  progress: 0,
  read_date: '',
  tags: [],
  note: {
    excerpts: '',
    reflections: '',
    content: ''
  },
  links: []
})

const tagInput = ref('')
const categoryInput = ref('')
const linkSearch = ref('')
const searchResults = ref([])
const timeMode = ref('auto')
const previewMode = reactive({ excerpts: false, reflections: false, content: false })

const tagSuggestions = computed(() => {
  return (bookStore.tags || [])
    .map(t => t.name)
    .filter(name => name && !form.tags.includes(name))
    .slice(0, 12)
})

// ========== 草稿自动保存（防止切出页面丢失编辑内容） ==========
const draftRestored = ref(false)
// 注意：必须在 setup 阶段固定 key，离开页面时 route 已变成目标路由，取不到当前 id
const draftKey = `bnotes-draft-book-${isNew.value ? 'new' : route.params.id}`
let loadedSnapshot = '' // 刚从数据库加载、尚未编辑时的表单快照
let draftTimer = null

watch(form, () => {
  if (draftTimer) clearTimeout(draftTimer)
  draftTimer = setTimeout(flushDraft, 1000)
}, { deep: true })

onMounted(async () => {
  await bookStore.fetchCategories()
  await bookStore.fetchTags()

  if (!isNew.value) {
    const result = await bookStore.fetchBook(route.params.id)
    if (result.code === 200) {
      const book = result.data
      form.title = book.title
      form.author = book.author
      form.cover = book.cover || ''
      form.category_id = book.category_id
      form.status = book.status
      form.progress = book.progress
      form.read_date = book.read_date || ''
      form.tags = book.tags ? book.tags.split(',') : []
      form.note = book.note || { excerpts: '', reflections: '', content: '' }
      form.links = book.links || []
      timeMode.value = book.note?.note_date ? 'custom' : 'auto'
    }
  }

  // 记录初始快照，并尝试恢复上次未保存的草稿
  loadedSnapshot = JSON.stringify(form)
  restoreDraft()

  window.addEventListener('keydown', handleCtrlS)
  // beforeunload 时 visibilityState 仍是 visible，必须直接落盘
  window.addEventListener('beforeunload', flushDraft)
  document.addEventListener('visibilitychange', handlePageHide)
})

onUnmounted(() => {
  // 离开页面前立即落盘草稿，不等防抖定时器
  flushDraft()
  if (draftTimer) clearTimeout(draftTimer)
  window.removeEventListener('keydown', handleCtrlS)
  window.removeEventListener('beforeunload', flushDraft)
  document.removeEventListener('visibilitychange', handlePageHide)
})

function handleCtrlS(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    saveBook()
  }
}

function flushDraft() {
  if (draftTimer) { clearTimeout(draftTimer); draftTimer = null }
  try {
    const current = JSON.stringify(form)
    if (current === loadedSnapshot) {
      // 表单与初始状态一致，无需保留草稿
      localStorage.removeItem(draftKey)
      return
    }
    try {
      localStorage.setItem(draftKey, current)
    } catch (e) {
      // 封面过大超出 localStorage 限制时，去掉封面只保文字内容
      const data = JSON.parse(current)
      data.cover = ''
      localStorage.setItem(draftKey, JSON.stringify(data))
    }
  } catch (e) {
    console.error('保存草稿失败:', e)
  }
}

// 页面切到后台（如切去添加分类）或窗口关闭前，立即保存草稿
function handlePageHide() {
  if (document.visibilityState === 'hidden') flushDraft()
}

function restoreDraft() {
  try {
    const saved = localStorage.getItem(draftKey)
    if (!saved) return
    const draft = JSON.parse(saved)
    if (JSON.stringify(draft) === loadedSnapshot) {
      localStorage.removeItem(draftKey)
      return
    }
    applyDraft(draft)
    draftRestored.value = true
  } catch (e) {
    console.error('恢复草稿失败:', e)
  }
}

function applyDraft(d) {
  if (!d || typeof d !== 'object') return
  if (typeof d.title === 'string') form.title = d.title
  if (typeof d.author === 'string') form.author = d.author
  if (d.cover) form.cover = d.cover
  if (d.category_id !== undefined && d.category_id !== null) form.category_id = d.category_id
  if (typeof d.status === 'string') form.status = d.status
  if (typeof d.progress === 'number') form.progress = d.progress
  if (typeof d.read_date === 'string') form.read_date = d.read_date
  if (Array.isArray(d.tags)) form.tags = d.tags
  if (d.note && typeof d.note === 'object') {
    if (typeof d.note.excerpts === 'string') form.note.excerpts = d.note.excerpts
    if (typeof d.note.reflections === 'string') form.note.reflections = d.note.reflections
    if (typeof d.note.content === 'string') form.note.content = d.note.content
    if (d.note.note_date) {
      form.note.note_date = d.note.note_date
      timeMode.value = 'custom'
    }
  }
  if (Array.isArray(d.links)) form.links = d.links
}

function discardDraft() {
  try {
    const original = JSON.parse(loadedSnapshot)
    Object.assign(form, original)
    timeMode.value = original.note?.note_date ? 'custom' : 'auto'
  } catch (e) {
    console.error('放弃草稿失败:', e)
  }
  localStorage.removeItem(draftKey)
  draftRestored.value = false
}

function clearDrafts(bookId) {
  try {
    localStorage.removeItem(draftKey)
    localStorage.removeItem('bnotes-draft-book-new')
    if (bookId) localStorage.removeItem(`bnotes-draft-book-${bookId}`)
  } catch (e) { /* 忽略 */ }
  draftRestored.value = false
}

function addTag() {
  addTagName(tagInput.value)
  tagInput.value = ''
}

function addTagName(name) {
  const tag = (name || '').trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
  }
}

function removeTag(index) {
  form.tags.splice(index, 1)
}

// 快速新建分类并选中（无需跳转分类管理页）
async function addCategory() {
  const name = categoryInput.value.trim()
  if (!name) return
  const existing = categories.value.find(c => c.name === name)
  if (existing) {
    form.category_id = existing.id
    categoryInput.value = ''
    return
  }
  const result = await bookStore.saveCategory({ name })
  if (result && (result.code === 200 || result.code === 201) && result.data?.id) {
    form.category_id = result.data.id
    categoryInput.value = ''
  } else {
    alert(result?.message || '新建分类失败，请重试')
  }
}

function handleCoverUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 7 * 1024 * 1024) {
    alert('封面图片不能超过7MB')
    return
  }
  const reader = new FileReader()
  reader.onload = (event) => {
    form.cover = event.target.result
  }
  reader.readAsDataURL(file)
}

function removeCover() {
  form.cover = ''
}

async function searchBooks() {
  if (linkSearch.value.trim()) {
    const result = await bookStore.searchBooks(linkSearch.value)
    if (result.code === 200) {
      searchResults.value = result.data.filter(b => b.id !== route.params.id)
    }
  } else {
    searchResults.value = []
  }
}

function addLink(book) {
  if (!form.links.find(l => l.target_book_id === book.id)) {
    form.links.push({ target_book_id: book.id, keyword: book.title })
  }
  linkSearch.value = ''
  searchResults.value = []
}

function removeLink(index) {
  form.links.splice(index, 1)
}

function getBookTitle(bookId) {
  const book = searchResults.value.find(b => b.id === bookId)
  return book ? book.title : bookId
}

async function saveBook() {
  // 自动记录模式下清空自定义时间
  if (timeMode.value === 'auto') {
    form.note.note_date = null
  }

  const data = {
    ...form,
    id: isNew.value ? undefined : route.params.id
  }

  const result = await bookStore.saveBook(data)
  if (result.code === 409) {
    alert('书名已存在，请修改书名后重试')
    return
  }
  if (result.code === 200 || result.code === 201) {
    // 保存成功后清除草稿（新建时 id 刚生成，也要按新 id 清）
    const savedBookId = isNew.value ? result.data?.id : route.params.id
    clearDrafts(savedBookId)
    // 保存后回到书籍详情（新建时也直接打开新书详情，避免出现空白页）
    const bookId = isNew.value ? result.data?.id : route.params.id
    if (bookId) router.replace(`/books/${bookId}`)
    else router.replace('/')
  } else {
    alert(result.message || '保存失败，请重试')
  }
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.book-edit {
  max-width: 800px;
}

.book-edit h1 {
  font-size: 24px;
  margin: 0 0 30px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.form-section {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
}

.form-section h2 {
  font-size: 16px;
  margin: 0 0 20px;
  color: var(--primary-color);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.form-group input[type="text"],
.form-group input[type="date"],
.form-group input[type="datetime-local"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-row .form-group {
  flex: 1;
}

.progress-input {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-input input[type="range"] {
  flex: 1;
}

.tag-input-row {
  display: flex;
  gap: 8px;
}

.tag-input-row input {
  flex: 1;
  min-width: 0;
}

.btn-add-tag {
  flex-shrink: 0;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: var(--primary-color);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.category-input-row {
  margin-top: 10px;
}

.draft-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: 8px;
  font-size: 13px;
}

.draft-banner button {
  flex-shrink: 0;
  padding: 4px 12px;
  border: none;
  border-radius: 6px;
  background: var(--primary-color);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

.tag-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.tag-suggestion {
  padding: 4px 10px;
  border: 1px dashed var(--border-color);
  border-radius: 12px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.tag-suggestion:active {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.tags-display,
.links-display {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: 12px;
  font-size: 12px;
}

.tag button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--primary-color);
  padding: 0;
  font-size: 14px;
  line-height: 1;
}

.link-search {
  position: relative;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 12px var(--shadow-color);
}

.search-result {
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.search-result:hover {
  background: var(--hover-bg);
}

.link-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--tag-bg);
  border-radius: 6px;
}

.link-item input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 12px;
}

.link-item button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 16px;
}

.hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 6px;
}

.md-tabs {
  display: inline-flex;
  gap: 2px;
  background: var(--hover-bg);
  padding: 2px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.md-tab {
  padding: 4px 14px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  background: transparent;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.md-tab.active {
  background: var(--card-bg);
  color: var(--text-color);
  box-shadow: 0 1px 3px var(--shadow-color);
}

.md-preview {
  min-height: 60px;
  padding: 12px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
  line-height: 1.8;
  word-break: break-word;
}

.md-preview :deep(h1),
.md-preview :deep(h2),
.md-preview :deep(h3) {
  margin: 0.8em 0 0.4em;
  color: var(--primary-color);
}

.md-preview :deep(p) {
  margin: 0.4em 0;
}

.md-preview :deep(ul),
.md-preview :deep(ol) {
  padding-left: 1.5em;
  margin: 0.4em 0;
}

.md-preview :deep(blockquote) {
  margin: 0.4em 0;
  padding: 0.2em 1em;
  border-left: 3px solid var(--primary-color);
  background: var(--primary-light);
  color: var(--text-secondary);
}

.md-preview :deep(code) {
  padding: 0.15em 0.4em;
  background: var(--tag-bg);
  border-radius: 4px;
  font-size: 0.9em;
}

.md-preview :deep(pre) {
  padding: 12px;
  background: var(--tag-bg);
  border-radius: 8px;
  overflow-x: auto;
}

.md-preview :deep(pre code) {
  background: none;
  padding: 0;
}

.md-preview :deep(a) {
  color: var(--primary-color);
}

.form-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-secondary {
  background: var(--tag-bg);
  color: var(--text-color);
}

.time-mode {
  display: flex;
  gap: 20px;
  margin-bottom: 8px;
}

.radio-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-color);
  cursor: pointer;
}

.radio-label input[type="radio"] {
  accent-color: var(--primary-color);
}

.cover-upload {
  position: relative;
  width: 180px;
  height: 240px;
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}

.cover-upload:hover {
  border-color: var(--primary-color);
}

.cover-preview {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--primary-light);
  color: var(--text-secondary);
}

.cover-placeholder span {
  font-size: 48px;
}

.cover-placeholder p {
  margin: 8px 0 0;
  font-size: 13px;
}

.cover-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.cover-upload .btn-small {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 4px 10px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cover-upload .btn-danger {
  background: #ffebee;
  color: #c62828;
}

@media (max-width: 600px) {
  .book-edit {
    padding: 0 14px 16px;
  }

  .book-edit h1 {
    font-size: 20px;
    margin-bottom: 18px;
  }

  .edit-form {
    gap: 18px;
  }

  .form-section {
    padding: 16px;
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
