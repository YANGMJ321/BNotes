<template>
  <div class="book-detail" v-if="book">
    <div class="book-header">
      <div class="book-cover-large">
        <img v-if="book.cover" :src="book.cover" alt="封面" class="cover-img" />
        <span v-else class="book-emoji">📖</span>
      </div>
      <div class="book-info">
        <h1>{{ book.title }}</h1>
        <p class="author">{{ book.author || '未知作者' }}</p>
        <div class="meta-tags">
          <span class="category">{{ book.category_name }}</span>
          <span class="status-badge" :class="book.status">{{ statusText(book.status) }}</span>
          <span class="tag" v-for="tag in book.tags?.split(',')" :key="tag">{{ tag }}</span>
        </div>
        <div class="progress-section" v-if="book.status === 'reading'">
          <label>阅读进度</label>
          <div class="progress-control">
            <input
              type="range"
              min="0"
              max="100"
              :value="book.progress"
              @input="updateProgress"
            />
            <span>{{ book.progress }}%</span>
          </div>
        </div>
        <div class="actions">
          <router-link :to="`/books/${book.id}/edit`" class="btn btn-primary">编辑</router-link>
          <button class="btn btn-secondary" @click="exportPdf">导出</button>
          <button class="btn btn-danger" @click="deleteBook">删除</button>
        </div>
      </div>
    </div>

    <div class="note-section" v-if="note">
      <div class="note-time-info">
        <span v-if="note.note_date">笔记时间：{{ formatDate(note.note_date) }}</span>
        <span v-else>笔记时间：{{ formatDate(note.created_at) }}</span>
        <span v-if="note.updated_at && note.updated_at !== note.created_at" class="updated-hint">（最后编辑：{{ formatDate(note.updated_at) }}）</span>
      </div>

      <div class="section" v-if="note.excerpts">
        <h2>金句摘录</h2>
        <div class="content" v-html="highlightLinks(note.excerpts)"></div>
      </div>

      <div class="section" v-if="note.reflections">
        <h2>读后感</h2>
        <div class="content" v-html="highlightLinks(note.reflections)"></div>
      </div>

      <div class="section" v-if="note.content">
        <h2>笔记内容</h2>
        <div class="content" v-html="highlightLinks(note.content)"></div>
      </div>

      <div class="links-section" v-if="book.links?.length">
        <h2>关联书籍</h2>
        <div class="links-list">
          <router-link
            v-for="link in book.links"
            :key="link.id"
            :to="`/books/${link.target_book_id}`"
            class="link-item"
          >
            <span class="link-icon">📚</span>
            <span class="link-keyword">{{ link.keyword }}</span>
            <span class="link-title">{{ link.target_book_title }}</span>
          </router-link>
        </div>
      </div>
    </div>

    <div v-else class="empty-note">
      <p>还没有笔记内容</p>
      <router-link :to="`/books/${book.id}/edit`" class="btn btn-primary">添加笔记</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBookStore } from '../stores/books'

const route = useRoute()
const router = useRouter()
const bookStore = useBookStore()

const book = ref(null)
const note = ref(null)

onMounted(async () => {
  const id = route.params.id
  const result = await bookStore.fetchBook(id)
  if (result.code === 200) {
    book.value = result.data
    note.value = result.data.note
  }
})

function statusText(status) {
  const map = { want: '想读', reading: '在读', done: '已读' }
  return map[status] || status
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function highlightLinks(text) {
  if (!text) return ''
  let html = text

  book.value?.links?.forEach(link => {
    if (link.keyword) {
      const regex = new RegExp(`(${link.keyword})`, 'g')
      html = html.replace(regex, `<a href="#/books/${link.target_book_id}" class="note-link">$1</a>`)
    }
  })

  return html.replace(/\n/g, '<br>')
}

function updateProgress(e) {
  book.value.progress = parseInt(e.target.value)
  bookStore.saveBook({
    id: book.value.id,
    progress: book.value.progress
  })
}

async function exportPdf() {
  await bookStore.batchExport([book.value.id])
}

async function deleteBook() {
  if (confirm('确定删除这本书吗？')) {
    await bookStore.deleteBook(book.value.id)
    router.push('/')
  }
}
</script>

<style scoped>
.book-detail {
  max-width: 900px;
}

.book-header {
  display: flex;
  gap: 30px;
  padding-bottom: 30px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 30px;
}

.book-cover-large {
  width: 180px;
  height: 240px;
  background: var(--primary-light);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.book-emoji {
  font-size: 72px;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

.book-info h1 {
  font-size: 28px;
  margin: 0 0 8px;
}

.author {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 16px;
}

.meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.category {
  font-size: 12px;
  padding: 4px 12px;
  background: var(--tag-bg);
  border-radius: 4px;
  color: var(--text-secondary);
}

.status-badge {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 4px;
}

.status-badge.want { background: #e3f2fd; color: #1976d2; }
.status-badge.reading { background: #fff3e0; color: #f57c00; }
.status-badge.done { background: #e8f5e9; color: #388e3c; }

.tag {
  font-size: 11px;
  padding: 3px 8px;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: 12px;
}

.progress-section {
  margin-bottom: 20px;
}

.progress-section label {
  font-size: 14px;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 8px;
}

.progress-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-control input[type="range"] {
  flex: 1;
  max-width: 200px;
}

.actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  text-decoration: none;
}

.btn-primary { background: var(--primary-color); color: white; }
.btn-secondary { background: var(--tag-bg); color: var(--text-color); }
.btn-danger { background: #ffebee; color: #c62828; }

.note-section {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.note-time-info {
  font-size: 13px;
  color: var(--text-secondary);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.updated-hint {
  color: var(--text-secondary);
  opacity: 0.7;
}

.section h2 {
  font-size: 18px;
  margin: 0 0 16px;
  color: var(--primary-color);
}

.content {
  line-height: 1.8;
  white-space: pre-wrap;
  color: var(--text-color);
}

.links-section {
  padding-top: 30px;
  border-top: 1px solid var(--border-color);
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-color);
  transition: all 0.2s;
}

.link-item:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.link-icon {
  font-size: 20px;
}

.link-keyword {
  font-weight: 500;
  color: var(--primary-color);
}

.link-title {
  color: var(--text-secondary);
  margin-left: auto;
}

.empty-note {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-note .btn {
  margin-top: 16px;
}
</style>
