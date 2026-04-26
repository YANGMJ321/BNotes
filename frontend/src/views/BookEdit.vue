<template>
  <div class="book-edit">
    <h1>{{ isNew ? '新建书籍' : '编辑书籍' }}</h1>

    <form @submit.prevent="saveBook" class="edit-form">
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
          <input
            type="text"
            v-model="tagInput"
            @keydown.enter.prevent="addTag"
            placeholder="输入标签后按回车添加，支持多个标签"
          />
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
          <textarea
            v-model="form.note.excerpts"
            rows="5"
            placeholder="记录书中的精彩段落..."
          ></textarea>
          <p class="hint">提示：输入书名或关键词后添加关联书籍</p>
        </div>

        <div class="form-group">
          <label>读后感</label>
          <textarea
            v-model="form.note.reflections"
            rows="5"
            placeholder="写下你的感想和心得..."
          ></textarea>
        </div>

        <div class="form-group">
          <label>笔记整理</label>
          <textarea
            v-model="form.note.content"
            rows="10"
            placeholder="整理书籍的核心内容和笔记..."
          ></textarea>
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
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBookStore } from '../stores/books'

const route = useRoute()
const router = useRouter()
const bookStore = useBookStore()

const isNew = computed(() => route.params.id === 'new')
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
const linkSearch = ref('')
const searchResults = ref([])
const timeMode = ref('auto')

onMounted(async () => {
  await bookStore.fetchCategories()

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

  window.addEventListener('keydown', handleCtrlS)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleCtrlS)
})

function handleCtrlS(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    saveBook()
  }
}

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
  }
  tagInput.value = ''
}

function removeTag(index) {
  form.tags.splice(index, 1)
}

function handleCoverUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    alert('封面图片不能超过2MB')
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
    router.push(isNew.value ? '/' : `/books/${route.params.id}`)
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
</style>
