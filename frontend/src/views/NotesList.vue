<template>
  <div class="notes-list">
    <div class="notes-header">
      <h1>所有笔记</h1>
      <div class="view-modes">
        <button
          v-for="mode in modes"
          :key="mode.key"
          class="mode-btn"
          :class="{ active: viewMode === mode.key }"
          @click="viewMode = mode.key"
        >
          {{ mode.label }}
        </button>
      </div>
    </div>

    <!-- 按书籍模式 -->
    <div v-if="viewMode === 'books'" class="notes-grid">
      <div
        v-for="book in booksWithNotes"
        :key="book.id"
        class="note-card"
        @click="goToBook(book.id)"
      >
        <h3>{{ book.title }}</h3>
        <p class="author">{{ book.author }}</p>
        <div class="note-tags">
          <span v-if="book.note?.excerpts" class="tag excerpt-tag">金句</span>
          <span v-if="book.note?.reflections" class="tag reflection-tag">读后感</span>
          <span v-if="book.note?.content" class="tag content-tag">笔记</span>
        </div>
        <div class="note-preview" v-if="book.note">
          <p v-if="book.note.excerpts">{{ truncate(book.note.excerpts) }}</p>
          <p v-else-if="book.note.reflections">{{ truncate(book.note.reflections) }}</p>
          <p v-else-if="book.note.content">{{ truncate(book.note.content) }}</p>
        </div>
        <div class="note-meta">
          <span class="date">{{ formatDate(book.note?.updated_at) }}</span>
          <span class="status-badge" :class="book.status">{{ statusText(book.status) }}</span>
        </div>
      </div>
    </div>

    <!-- 按金句模式 -->
    <div v-if="viewMode === 'excerpts'" class="notes-grid">
      <div
        v-for="item in excerptItems"
        :key="'e-' + item.bookId"
        class="note-card excerpt-card"
        @click="goToBook(item.bookId)"
      >
        <div class="card-label excerpt-label">金句</div>
        <p class="card-content">{{ item.text }}</p>
        <div class="card-footer">
          <span class="book-title">{{ item.bookTitle }}</span>
          <span class="author">{{ item.author }}</span>
        </div>
      </div>
    </div>

    <!-- 按读后感模式 -->
    <div v-if="viewMode === 'reflections'" class="notes-grid">
      <div
        v-for="item in reflectionItems"
        :key="'r-' + item.bookId"
        class="note-card reflection-card"
        @click="goToBook(item.bookId)"
      >
        <div class="card-label reflection-label">读后感</div>
        <p class="card-content">{{ item.text }}</p>
        <div class="card-footer">
          <span class="book-title">{{ item.bookTitle }}</span>
          <span class="author">{{ item.author }}</span>
        </div>
      </div>
    </div>

    <!-- 按笔记模式 -->
    <div v-if="viewMode === 'content'" class="notes-grid">
      <div
        v-for="item in contentItems"
        :key="'c-' + item.bookId"
        class="note-card content-card"
        @click="goToBook(item.bookId)"
      >
        <div class="card-label content-label">笔记</div>
        <p class="card-content">{{ item.text }}</p>
        <div class="card-footer">
          <span class="book-title">{{ item.bookTitle }}</span>
          <span class="author">{{ item.author }}</span>
        </div>
      </div>
    </div>

    <div v-if="currentItems.length === 0" class="empty-state">
      <p>{{ emptyText }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBookStore } from '../stores/books'

const router = useRouter()
const bookStore = useBookStore()
const viewMode = ref('books')

const modes = [
  { key: 'books', label: '按书籍' },
  { key: 'excerpts', label: '按金句' },
  { key: 'reflections', label: '按读后感' },
  { key: 'content', label: '按笔记' }
]

const booksWithNotes = computed(() => {
  return bookStore.books.filter(book => {
    const note = book.note || book
    return note && (note.content || note.excerpts || note.reflections)
  })
})

function buildItems(field) {
  return booksWithNotes.value
    .filter(book => {
      const note = book.note || book
      return note && note[field]
    })
    .map(book => {
      const note = book.note || book
      return {
        bookId: book.id,
        bookTitle: book.title,
        author: book.author,
        text: note[field]
      }
    })
}

const excerptItems = computed(() => buildItems('excerpts'))
const reflectionItems = computed(() => buildItems('reflections'))
const contentItems = computed(() => buildItems('content'))

const currentItems = computed(() => {
  const map = {
    books: booksWithNotes,
    excerpts: excerptItems,
    reflections: reflectionItems,
    content: contentItems
  }
  return map[viewMode.value].value
})

const emptyText = computed(() => {
  const map = {
    books: '还没有笔记内容',
    excerpts: '还没有金句摘抄',
    reflections: '还没有读后感',
    content: '还没有整理笔记'
  }
  return map[viewMode.value]
})

onMounted(() => {
  bookStore.fetchBooks()
})

function truncate(text, length = 120) {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

function statusText(status) {
  const map = { want: '想读', reading: '在读', done: '已读' }
  return map[status] || status
}

function goToBook(id) {
  router.push(`/books/${id}`)
}
</script>

<style scoped>
.notes-list {
  max-width: 1000px;
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.notes-header h1 {
  font-size: 24px;
  margin: 0;
}

.view-modes {
  display: flex;
  gap: 6px;
  background: var(--hover-bg);
  padding: 4px;
  border-radius: 10px;
}

.mode-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  background: transparent;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.mode-btn:hover {
  color: var(--text-color);
}

.mode-btn.active {
  background: var(--card-bg);
  color: var(--text-color);
  box-shadow: 0 1px 4px var(--shadow-color);
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.note-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.note-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px var(--shadow-color);
}

.note-card h3 {
  font-size: 16px;
  margin: 0 0 8px;
  color: var(--text-color);
}

.author {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.note-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}

.excerpt-tag {
  background: #e8ddd3;
  color: #8b7355;
}

.reflection-tag {
  background: #d3dde8;
  color: #55708b;
}

.content-tag {
  background: #d8e3d5;
  color: #5b7a55;
}

.note-preview {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 12px;
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date {
  font-size: 12px;
  color: var(--text-secondary);
}

.status-badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
}

.status-badge.want { background: #e3f2fd; color: #1976d2; }
.status-badge.reading { background: #fff3e0; color: #f57c00; }
.status-badge.done { background: #e8f5e9; color: #388e3c; }

/* 分类卡片样式 */
.card-label {
  display: inline-block;
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 4px;
  margin-bottom: 12px;
}

.excerpt-label {
  background: #e8ddd3;
  color: #8b7355;
}

.reflection-label {
  background: #d3dde8;
  color: #55708b;
}

.content-label {
  background: #d8e3d5;
  color: #5b7a55;
}

.card-content {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-color);
  margin-bottom: 16px;
  white-space: pre-wrap;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border-color);
  padding-top: 12px;
}

.book-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .notes-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .notes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
