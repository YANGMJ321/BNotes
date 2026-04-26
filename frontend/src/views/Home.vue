<template>
  <div class="home">
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
        <button class="btn btn-small" @click="batchMove">批量移动</button>
        <button class="btn btn-small" @click="batchExport">批量导出</button>
        <button class="btn btn-small btn-text" @click="clearSelection">取消</button>
      </div>
    </div>

    <div class="book-grid" :class="{ 'cover-mode': viewMode === 'cover' }">
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
        <div class="book-cover" v-else>
          <span class="book-emoji">📖</span>
        </div>

        <div class="book-info">
          <h3 class="book-title">{{ book.title }}</h3>
          <p class="book-author">{{ book.author || '未知作者' }}</p>
          <div class="book-meta">
            <span class="book-category">{{ book.category_name }}</span>
            <span class="book-status" :class="book.status">
              {{ statusText(book.status) }}
            </span>
          </div>
          <div class="book-tags" v-if="book.tags">
            <span class="tag" v-for="tag in book.tags.split(',')" :key="tag">{{ tag }}</span>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBookStore } from '../stores/books'

const router = useRouter()
const bookStore = useBookStore()

const selectedCategory = ref('')
const selectedStatus = ref('')
const selectedTag = ref('')
const selectedBooks = ref([])
const viewMode = ref('list')

const categories = computed(() => bookStore.categories)
const allTags = computed(() => bookStore.tags)
const filteredBooks = computed(() => bookStore.filteredBooks)

onMounted(async () => {
  bookStore.fetchBooks()
  try {
    const mode = await bookStore.getSetting('view_mode')
    if (mode) {
      viewMode.value = JSON.parse(mode)
    }
  } catch (e) {
    // ignore
  }
})

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
}

async function batchDelete() {
  if (confirm(`确定删除选中的 ${selectedBooks.value.length} 本书吗？`)) {
    await bookStore.batchDelete(selectedBooks.value)
    clearSelection()
  }
}

async function batchMove() {
  const categoryId = prompt('请输入目标分类ID：')
  if (categoryId) {
    await bookStore.batchMove(selectedBooks.value, parseInt(categoryId))
    clearSelection()
  }
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
.filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.book-grid.cover-mode {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.book-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px var(--shadow-color);
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

.cover-mode .book-cover {
  height: 200px;
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
  margin: 0 0 8px;
  color: var(--text-color);
}

.book-author {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 12px;
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
