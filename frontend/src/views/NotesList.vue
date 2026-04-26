<template>
  <div class="notes-list">
    <h1>所有笔记</h1>

    <div class="notes-grid">
      <div
        v-for="book in booksWithNotes"
        :key="book.id"
        class="note-card"
        @click="goToBook(book.id)"
      >
        <h3>{{ book.title }}</h3>
        <p class="author">{{ book.author }}</p>
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

    <div v-if="booksWithNotes.length === 0" class="empty-state">
      <p>还没有笔记内容</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBookStore } from '../stores/books'

const router = useRouter()
const bookStore = useBookStore()

const booksWithNotes = computed(() => {
  return bookStore.books.filter(book => {
    const note = book.note || book
    return note && (note.content || note.excerpts || note.reflections)
  })
})

onMounted(() => {
  bookStore.fetchBooks()
})

function truncate(text, length = 100) {
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

.notes-list h1 {
  font-size: 24px;
  margin: 0 0 24px;
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
  margin: 0 0 12px;
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}
</style>
