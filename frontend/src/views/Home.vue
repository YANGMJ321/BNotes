<template>
  <div class="home">
    <div class="shelf-header">
      <div class="shelf-title-wrap">
        <input
          v-if="editingShelfName"
          ref="shelfNameInput"
          v-model="shelfNameDraft"
          class="shelf-name-input"
          type="text"
          maxlength="20"
          @blur="saveShelfName"
          @keydown.enter.prevent="saveShelfName"
        />
        <button v-else class="shelf-name" @click="startEditShelfName">{{ shelfName }}</button>
        <span v-if="!shelfNameEdited && !editingShelfName" class="shelf-hint">可自定义编辑</span>
      </div>
      <router-link to="/books/new" class="shelf-add" aria-label="新建书籍">+</router-link>
    </div>

    <div class="filters">
      <div class="filter-group">
        <select v-model="selectedCategory" class="filter-select" @change="filterBooks">
          <option value="">全部分类</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>

        <select v-model="selectedStatus" class="filter-select" @change="filterBooks">
          <option value="">全部状态</option>
          <option value="want">想读</option>
          <option value="reading">在读</option>
          <option value="done">已读</option>
        </select>

        <select v-model="selectedTag" class="filter-select" @change="filterBooks">
          <option value="">全部标签</option>
          <option v-for="tag in allTags" :key="tag.id" :value="tag.id">{{ tag.name }}</option>
        </select>

        <button class="btn btn-view-toggle" @click="toggleViewMode">
          {{ viewMode === 'cover' ? '📋 列表' : '🖼️ 封面' }}
        </button>
      </div>

      <div class="batch-actions" v-if="selectedBooks.length > 0">
        <span>已选择 {{ selectedBooks.length }} 本书</span>
        <button class="btn btn-small" @click="batchDelete">批量删除</button>
        <select v-model="moveCategory" class="filter-select batch-move-select" title="选择目标分类">
          <option value="">选择分类…</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <button class="btn btn-small" @click="batchMove">批量移动</button>
        <button class="btn btn-small" @click="batchExport">批量导出</button>
        <button class="btn btn-small btn-text" @click="clearSelection">取消</button>
      </div>
    </div>

    <div class="book-grid" :class="viewMode === 'cover' ? 'cover-mode' : 'list-mode'">
      <div
        v-for="book in filteredBooks"
        :key="book.id"
        class="book-card"
        :class="{ selected: selectedBooks.includes(book.id) }"
        @click="goToBook(book.id)"
      >
        <div class="book-checkbox" @click.stop>
          <input
            type="checkbox"
            :checked="selectedBooks.includes(book.id)"
            @change="toggleSelect(book.id)"
          />
        </div>

        <div class="book-cover" v-if="viewMode === 'cover'">
          <img v-if="book.cover" :src="book.cover" alt="封面" class="cover-img" />
          <span v-else class="book-emoji">📖</span>
        </div>

        <div class="book-info">
          <div class="book-title-row">
            <h3 class="book-title">{{ book.title }}</h3>
            <span class="book-status" :class="book.status">{{ statusText(book.status) }}</span>
          </div>
          <p class="book-author">
            {{ book.author || '未知作者' }}
            <span v-if="book.category_name" class="book-category">{{ book.category_name }}</span>
          </p>
          <div class="book-tags" v-if="bookTags(book).length">
            <span class="tag" v-for="tag in bookTags(book)" :key="tag">{{ tag }}</span>
          </div>
          <div class="book-progress" v-if="book.status === 'reading'">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: book.progress + '%' }"></div>
            </div>
            <span class="progress-text">{{ book.progress }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredBooks.length === 0" class="empty-state">
      <p>还没有书籍，点击右上角"新建书籍"开始添加</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useBookStore } from '../stores/books'

const router = useRouter()
const bookStore = useBookStore()

const selectedCategory = ref('')
const selectedStatus = ref('')
const selectedTag = ref('')
const selectedBooks = ref([])
const viewMode = ref('list')
const moveCategory = ref('')

// 书架自定义名称（默认“书架”，编辑一次后不再显示提示小字）
const shelfName = ref('书架')
const shelfNameEdited = ref(false)
const editingShelfName = ref(false)
const shelfNameDraft = ref('')
const shelfNameInput = ref(null)

const categories = computed(() => bookStore.categories)
const allTags = computed(() => bookStore.tags)
const filteredBooks = computed(() => bookStore.filteredBooks)

function parseSetting(value) {
  if (value == null) return null
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch (e) {
    return value
  }
}

onMounted(async () => {
  bookStore.fetchBooks()
  try {
    const mode = await bookStore.getSetting('view_mode')
    if (mode) {
      viewMode.value = parseSetting(mode)
    }
    const name = await bookStore.getSetting('shelf_name')
    if (name) shelfName.value = parseSetting(name) || '书架'
    const edited = await bookStore.getSetting('shelf_name_edited')
    shelfNameEdited.value = parseSetting(edited) === true
  } catch (e) {
    // ignore
  }
})

async function startEditShelfName() {
  shelfNameDraft.value = shelfName.value
  editingShelfName.value = true
  await nextTick()
  shelfNameInput.value?.focus()
  shelfNameInput.value?.select()
}

async function saveShelfName() {
  if (!editingShelfName.value) return
  editingShelfName.value = false
  const name = shelfNameDraft.value.trim() || '书架'
  shelfName.value = name
  try {
    await bookStore.saveSetting('shelf_name', name)
    if (!shelfNameEdited.value) {
      shelfNameEdited.value = true
      await bookStore.saveSetting('shelf_name_edited', true)
    }
  } catch (e) {
    // ignore
  }
}

function bookTags(book) {
  const raw = book.tags || book.tag_names || ''
  return raw ? raw.split(',').map(t => t.trim()).filter(Boolean) : []
}

function filterBooks() {
  bookStore.setFilter({
    category: selectedCategory.value,
    status: selectedStatus.value,
    tag: selectedTag.value
  })
}

function statusText(status) {
  const map = { want: '想读', reading: '在读', done: '已读' }
  return map[status] || status
}

function goToBook(id) {
  router.push(`/books/${id}`)
}

function toggleSelect(id) {
  const index = selectedBooks.value.indexOf(id)
  if (index > -1) {
    selectedBooks.value.splice(index, 1)
  } else {
    selectedBooks.value.push(id)
  }
}

function clearSelection() {
  selectedBooks.value = []
  moveCategory.value = ''
}

async function batchDelete() {
  if (confirm(`确定删除选中的 ${selectedBooks.value.length} 本书吗？`)) {
    await bookStore.batchDelete(selectedBooks.value)
    clearSelection()
  }
}

async function batchMove() {
  if (!moveCategory.value) {
    alert('请先在下拉框中选择目标分类')
    return
  }
  await bookStore.batchMove(selectedBooks.value, parseInt(moveCategory.value))
  clearSelection()
}

async function batchExport() {
  await bookStore.batchExport(selectedBooks.value)
}

async function toggleViewMode() {
  viewMode.value = viewMode.value === 'cover' ? 'list' : 'cover'
  try {
    await bookStore.saveSetting('view_mode', viewMode.value)
  } catch (e) {
    // ignore
  }
}
</script>

<style scoped>
.shelf-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.shelf-title-wrap {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.shelf-name {
  border: none;
  background: none;
  padding: 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--text-color);
  cursor: pointer;
  line-height: 1.2;
  -webkit-tap-highlight-color: transparent;
}

.shelf-name-input {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-color);
  background: var(--input-bg);
  border: 1px solid var(--primary-color);
  border-radius: 8px;
  padding: 2px 8px;
  width: 160px;
  max-width: 55vw;
}

.shelf-hint {
  font-size: 11px;
  color: var(--text-secondary);
  opacity: 0.75;
  white-space: nowrap;
}

.shelf-add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--primary-color);
  color: #fff;
  font-size: 20px;
  line-height: 1;
  text-decoration: none;
  flex-shrink: 0;
}

.shelf-add:hover {
  text-decoration: none;
  background: var(--primary-dark);
}

.filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
  cursor: pointer;
}

.batch-move-select {
  max-width: 140px;
  padding: 6px 8px;
}

.btn-view-toggle {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view-toggle:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: var(--primary-light);
  border-radius: 8px;
  color: var(--primary-color);
}

.batch-actions .btn-small {
  padding: 6px 12px;
  font-size: 12px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.batch-actions .btn-text {
  background: transparent;
  color: var(--text-secondary);
}

.book-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.book-grid.cover-mode {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.book-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 12px 44px 12px 14px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.book-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 14px var(--shadow-color);
}

/* 列表模式：细长横向条目，不显示书本占位图 */
.book-grid:not(.cover-mode) .book-info {
  min-width: 0;
}

.book-grid:not(.cover-mode) .book-title-row {
  align-items: center;
}

.book-grid:not(.cover-mode) .book-title {
  font-size: 16px;
}

.book-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 3px;
}

.book-grid:not(.cover-mode) .book-card:hover {
  transform: none;
}

.book-grid:not(.cover-mode) .book-checkbox {
  top: 50%;
  transform: translateY(-50%);
}

.book-card.selected {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.book-checkbox {
  position: absolute;
  top: 12px;
  right: 12px;
}

.book-cover {
  width: 100%;
  height: 120px;
  background: var(--primary-light);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  overflow: hidden;
}

.cover-mode .book-card {
  padding: 12px;
}

.cover-mode .book-cover {
  height: 170px;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.book-emoji {
  font-size: 48px;
}

.book-title {
  font-size: 18px;
  margin: 0;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.book-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.book-category {
  font-size: 12px;
  padding: 4px 8px;
  background: var(--tag-bg);
  border-radius: 4px;
  color: var(--text-secondary);
}

.book-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.book-status.want {
  background: #e3f2fd;
  color: #1976d2;
}

.book-status.reading {
  background: #fff3e0;
  color: #f57c00;
}

.book-status.done {
  background: #e8f5e9;
  color: #388e3c;
}

.book-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.tag {
  font-size: 11px;
  padding: 3px 8px;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: 12px;
}

.book-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--border-color);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 36px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}
</style>
