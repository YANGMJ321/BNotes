<template>
  <div class="search-result">
    <h1>搜索结果: "{{ keyword }}"</h1>

    <div class="results-count" v-if="results.length">
      找到 {{ results.length }} 个结果
    </div>

    <div class="results-list">
      <div
        v-for="book in results"
        :key="book.id"
        class="result-item"
        @click="goToBook(book.id)"
      >
        <h3>{{ book.title }}</h3>
        <p class="author">{{ book.author || '未知作者' }}</p>
        <div class="match-info" v-if="getMatchInfo(book)">
          <span class="match-label">{{ getMatchInfo(book).label }}:</span>
          <span class="match-text">{{ getMatchInfo(book).text }}</span>
        </div>
        <div class="result-meta">
          <span class="category">{{ book.category_name }}</span>
          <span class="status-badge" :class="book.status">{{ statusText(book.status) }}</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      搜索中...
    </div>

    <div v-else-if="results.length === 0 && !loading" class="empty-state">
      <p>没有找到匹配的结果</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBookStore } from '../stores/books'

const route = useRoute()
const router = useRouter()
const bookStore = useBookStore()

const results = ref([])
const loading = ref(false)
const keyword = ref('')

onMounted(() => {
  keyword.value = route.query.q || ''
  if (keyword.value) {
    search()
  }
})

watch(() => route.query.q, (newQ) => {
  keyword.value = newQ || ''
  if (keyword.value) {
    search()
  }
})

async function search() {
  if (!keyword.value.trim()) {
    results.value = []
    return
  }

  loading.value = true
  const data = await bookStore.searchBooks(keyword.value)
  if (data.code === 200) {
    results.value = data.data
  }
  loading.value = false
}

function statusText(status) {
  const map = { want: '想读', reading: '在读', done: '已读' }
  return map[status] || status
}

function getMatchInfo(book) {
  const k = keyword.value.toLowerCase()
  if (book.title?.toLowerCase().includes(k)) {
    return { label: '书名', text: book.title }
  }
  if (book.author?.toLowerCase().includes(k)) {
    return { label: '作者', text: book.author }
  }
  if (book.content?.toLowerCase().includes(k)) {
    return { label: '笔记', text: truncate(book.content) }
  }
  if (book.excerpts?.toLowerCase().includes(k)) {
    return { label: '金句', text: truncate(book.excerpts) }
  }
  return null
}

function truncate(text, length = 80) {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

function goToBook(id) {
  router.push(`/books/${id}`)
}
</script>

<style scoped>
.search-result h1 {
  font-size: 24px;
  margin: 0 0 16px;
}

.results-count {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  padding: 20px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.result-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px var(--shadow-color);
}

.result-item h3 {
  font-size: 18px;
  margin: 0 0 8px;
}

.author {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 12px;
}

.match-info {
  font-size: 13px;
  margin-bottom: 12px;
  padding: 10px;
  background: var(--tag-bg);
  border-radius: 6px;
}

.match-label {
  color: var(--primary-color);
  font-weight: 500;
  margin-right: 8px;
}

.match-text {
  color: var(--text-secondary);
}

.result-meta {
  display: flex;
  gap: 12px;
}

.category {
  font-size: 12px;
  padding: 4px 10px;
  background: var(--tag-bg);
  border-radius: 4px;
  color: var(--text-secondary);
}

.status-badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
}

.status-badge.want { background: #e3f2fd; color: #1976d2; }
.status-badge.reading { background: #fff3e0; color: #f57c00; }
.status-badge.done { background: #e8f5e9; color: #388e3c; }

.loading,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}
</style>
