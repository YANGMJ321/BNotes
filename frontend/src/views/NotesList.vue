<template>
  <div class="notes-list">
    <div class="notes-header">
      <h1>笔记</h1>
      <div class="view-modes">
        <button
          v-for="mode in modes"
          :key="mode.key"
          class="mode-btn"
          :class="{ active: viewMode === mode.key }"
          @click="switchMode(mode.key)"
        >
          {{ mode.label }}
        </button>
      </div>
    </div>

    <!-- 详情：只展示对应标签下的内容（如只显示金句） -->
    <div v-if="detailItem" class="note-detail">
      <div class="detail-top">
        <button class="back-btn" @click="detailItem = null">‹ 返回</button>
        <span class="detail-label">{{ detailItem.label }}</span>
      </div>
      <h2 class="detail-title">{{ detailItem.bookTitle }}</h2>
      <p class="detail-author">{{ detailItem.author || '未知作者' }}</p>
      <p class="detail-date" v-if="detailItem.date">{{ formatDate(detailItem.date) }}</p>
      <div class="detail-content" v-html="renderMarkdown(detailItem.text)"></div>
      <button class="btn-book" @click="goToBook(detailItem.bookId)">查看书籍详情</button>
    </div>

    <template v-else>
      <!-- 书籍：只显示书名、关键信息和笔记标签 -->
      <div v-if="viewMode === 'books'" class="notes-grid">
        <div
          v-for="book in booksWithNotes"
          :key="book.id"
          class="note-card book-note-card"
          @click="goToBook(book.id)"
        >
          <div class="card-head">
            <h3>{{ book.title }}</h3>
            <span class="status-badge" :class="book.status">{{ statusText(book.status) }}</span>
          </div>
          <p class="key-info">
            {{ book.author || '未知作者' }}
            <span v-if="book.category_name">· {{ book.category_name }}</span>
            <span v-if="noteDate(book)">· {{ formatDate(noteDate(book)) }}</span>
          </p>
          <div class="note-tags">
            <button
              v-for="tag in noteTags(book)"
              :key="tag.key"
              class="tag"
              :class="tag.class"
              @click.stop="openDetail(book, tag.key)"
            >{{ tag.label }}</button>
          </div>
          <div class="note-preview">
            <p>{{ previewText(book) }}</p>
          </div>
        </div>
      </div>

      <!-- 金句 / 读后感 / 笔记：只展示该标签下的内容 -->
      <div v-else class="notes-grid">
        <div
          v-for="item in currentItems"
          :key="item.key"
          class="note-card content-card"
          @click="openDetail(item.book, viewMode)"
        >
          <div class="card-label" :class="labelClass(viewMode)">{{ labelText(viewMode) }}</div>
          <div class="card-content" v-html="renderMarkdown(truncate(item.text, 220))"></div>
          <div class="card-footer">
            <span class="book-title">{{ item.book.title }}</span>
            <span class="author">{{ item.book.author || '未知作者' }}</span>
          </div>
        </div>
      </div>

      <div v-if="isEmpty" class="empty-state">
        <p>{{ emptyText }}</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBookStore } from '../stores/books'
import { renderMarkdown } from '../utils/markdown'

const router = useRouter()
const bookStore = useBookStore()
const viewMode = ref('books')
const detailItem = ref(null)

const modes = [
  { key: 'books', label: '书籍' },
  { key: 'excerpts', label: '金句' },
  { key: 'reflections', label: '读后感' },
  { key: 'content', label: '笔记' }
]

const booksWithNotes = computed(() => {
  return bookStore.books.filter(book => book.excerpts || book.reflections || book.content)
})

const currentItems = computed(() => {
  if (viewMode.value === 'books') return []
  return booksWithNotes.value
    .filter(book => book[viewMode.value])
    .map(book => ({
      key: `${viewMode.value}-${book.id}`,
      book,
      text: book[viewMode.value]
    }))
})

const isEmpty = computed(() => {
  return viewMode.value === 'books' ? booksWithNotes.value.length === 0 : currentItems.value.length === 0
})

const emptyText = computed(() => {
  const map = {
    books: '还没有笔记，去书籍详情里写点什么吧',
    excerpts: '还没有金句摘抄',
    reflections: '还没有读后感',
    content: '还没有整理笔记'
  }
  return map[viewMode.value]
})

onMounted(() => {
  bookStore.fetchBooks()
})

function switchMode(key) {
  viewMode.value = key
  detailItem.value = null
}

function noteTags(book) {
  const tags = []
  if (book.excerpts) tags.push({ key: 'excerpts', label: '金句', class: 'excerpt-tag' })
  if (book.reflections) tags.push({ key: 'reflections', label: '读后感', class: 'reflection-tag' })
  if (book.content) tags.push({ key: 'content', label: '笔记', class: 'content-tag' })
  return tags
}

function previewText(book) {
  const text = book.excerpts || book.reflections || book.content || ''
  return truncate(text, 100)
}

function noteDate(book) {
  return book.note_updated_at || book.note_date || book.updated_at
}

function openDetail(book, field) {
  detailItem.value = {
    bookId: book.id,
    bookTitle: book.title,
    author: book.author,
    date: noteDate(book),
    label: labelText(field),
    text: book[field] || ''
  }
}

function labelText(field) {
  const map = { excerpts: '金句', reflections: '读后感', content: '笔记' }
  return map[field] || ''
}

function labelClass(field) {
  const map = { excerpts: 'excerpt-label', reflections: 'reflection-label', content: 'content-label' }
  return map[field] || ''
}

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
  margin-bottom: 18px;
  flex-wrap: wrap;
  gap: 10px;
}

.notes-header h1 {
  font-size: 22px;
  margin: 0;
}

.view-modes {
  display: flex;
  gap: 4px;
  background: var(--hover-bg);
  padding: 4px;
  border-radius: 10px;
  overflow-x: auto;
}

.mode-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  background: transparent;
  color: var(--text-secondary);
  transition: all 0.2s;
  white-space: nowrap;
}

.mode-btn.active {
  background: var(--card-bg);
  color: var(--text-color);
  box-shadow: 0 1px 4px var(--shadow-color);
}

.notes-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.note-card:hover {
  border-color: var(--primary-color);
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.note-card h3 {
  font-size: 16px;
  margin: 0 0 4px;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.key-info {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 8px;
}

.author {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

.note-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.tag {
  font-size: 11px;
  padding: 3px 10px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
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
}

.note-preview p {
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.status-badge {
  flex-shrink: 0;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
}

.status-badge.want { background: #e3f2fd; color: #1976d2; }
.status-badge.reading { background: #fff3e0; color: #f57c00; }
.status-badge.done { background: #e8f5e9; color: #388e3c; }

.card-label {
  display: inline-block;
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 4px;
  margin-bottom: 8px;
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
  line-height: 1.7;
  color: var(--text-color);
  margin-bottom: 10px;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-content :deep(h1),
.card-content :deep(h2),
.card-content :deep(h3) {
  font-size: 1.05em;
  margin: 0.4em 0 0.2em;
  color: var(--primary-color);
}

.card-content :deep(p) {
  margin: 0.2em 0;
}

.card-content :deep(blockquote) {
  margin: 0.2em 0;
  padding: 0.1em 0.8em;
  border-left: 3px solid var(--primary-color);
  background: var(--primary-light);
  color: var(--text-secondary);
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}

.book-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary-color);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

/* 详情页 */
.note-detail {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
}

.detail-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.back-btn {
  border: none;
  background: none;
  color: var(--primary-color);
  font-size: 15px;
  padding: 4px 2px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.detail-label {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 10px;
  background: var(--primary-light);
  color: var(--primary-color);
}

.detail-title {
  font-size: 19px;
  margin: 0 0 4px;
}

.detail-author,
.detail-date {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 4px;
}

.detail-content {
  margin-top: 14px;
  font-size: 15px;
  line-height: 1.9;
  color: var(--text-color);
  word-break: break-word;
}

.detail-content :deep(h1),
.detail-content :deep(h2),
.detail-content :deep(h3) {
  font-size: 1.1em;
  margin: 0.7em 0 0.3em;
  color: var(--primary-color);
}

.detail-content :deep(p) {
  margin: 0.4em 0;
}

.detail-content :deep(blockquote) {
  margin: 0.4em 0;
  padding: 0.2em 1em;
  border-left: 3px solid var(--primary-color);
  background: var(--primary-light);
  color: var(--text-secondary);
}

.btn-book {
  margin-top: 18px;
  padding: 10px 18px;
  border: 1px solid var(--primary-color);
  border-radius: 8px;
  background: var(--primary-light);
  color: var(--primary-color);
  font-size: 14px;
  cursor: pointer;
}

@media (max-width: 600px) {
  .notes-list {
    padding: 0 14px 16px;
  }
}
</style>
