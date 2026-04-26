<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">
        <h1>BNotes</h1>
        <span class="subtitle">读书笔记</span>
      </div>

      <nav class="nav">
        <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
          <span class="icon">📚</span>
          <span>书架</span>
        </router-link>
        <router-link to="/notes" class="nav-item" :class="{ active: $route.path === '/notes' }">
          <span class="icon">📝</span>
          <span>笔记</span>
        </router-link>
        <router-link to="/categories" class="nav-item" :class="{ active: $route.path === '/categories' }">
          <span class="icon">📁</span>
          <span>分类</span>
        </router-link>
        <router-link to="/tags" class="nav-item" :class="{ active: $route.path === '/tags' }">
          <span class="icon">🏷️</span>
          <span>标签</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <router-link to="/import-export" class="nav-item" :class="{ active: $route.path === '/import-export' }">
          <span class="icon">📦</span>
          <span>导入导出</span>
        </router-link>
        <router-link to="/feedback" class="nav-item" :class="{ active: $route.path === '/feedback' }">
          <span class="icon">💬</span>
          <span>反馈</span>
        </router-link>
        <router-link to="/theme" class="nav-item" :class="{ active: $route.path === '/theme' }">
          <span class="icon">🎨</span>
          <span>主题</span>
        </router-link>
        <button class="theme-toggle" @click="toggleTheme" title="切换主题">
          <span>{{ isDark ? '☀️' : '🌙' }}</span>
        </button>
      </div>
    </aside>

    <main class="main-content">
      <header class="header">
        <div class="search-box">
          <input
            type="text"
            class="search-input"
            placeholder="搜索书籍、笔记... (Ctrl+F)"
            v-model="searchKeyword"
            @input="handleSearch"
          />
        </div>
        <div class="header-actions">
          <router-link to="/books/new" class="btn btn-primary">
            <span>+</span> 新建书籍
          </router-link>
        </div>
      </header>

      <div class="content-area">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useBookStore } from './stores/books'
import { useRoute, useRouter } from 'vue-router'

const bookStore = useBookStore()
const route = useRoute()
const router = useRouter()

const searchKeyword = ref('')
const isDark = ref(document.documentElement.classList.contains('dark'))

function handleSearch() {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/search', query: { q: searchKeyword.value } })
  } else {
    router.push('/')
  }
}

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  try {
    const saved = JSON.parse(localStorage.getItem('bnotes-theme') || '{}')
    saved.darkMode = isDark.value
    localStorage.setItem('bnotes-theme', JSON.stringify(saved))
    bookStore.saveSetting('theme', saved).catch(() => {})
  } catch (e) {}
}

onMounted(async () => {
  try {
    const value = await bookStore.getSetting('theme')
    if (value) {
      const settings = typeof value === 'string' ? JSON.parse(value) : value
      const root = document.documentElement
      root.classList.remove('theme-rose', 'theme-sage', 'theme-sand', 'theme-lavender', 'theme-slate')
      if (settings.preset && settings.preset !== 'custom') {
        root.classList.add(`theme-${settings.preset}`)
        root.style.removeProperty('--theme-hue')
      } else if (settings.preset === 'custom' && settings.customHue != null) {
        root.style.setProperty('--theme-hue', String(settings.customHue))
      }
      root.classList.toggle('dark', !!settings.darkMode)
      isDark.value = !!settings.darkMode
      localStorage.setItem('bnotes-theme', JSON.stringify(settings))
    }
  } catch (e) {}
})

watch(() => route.path, () => {
  isDark.value = document.documentElement.classList.contains('dark')
})
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: var(--sidebar-bg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
  position: fixed;
  height: 100vh;
  overflow-y: auto;
}

.logo {
  padding: 10px 0 30px;
  text-align: center;
}

.logo h1 {
  font-size: 24px;
  margin: 0;
  color: var(--primary-color);
}

.logo .subtitle {
  font-size: 12px;
  color: var(--text-secondary);
}

.nav {
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: var(--text-color);
  text-decoration: none;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.2s;
}

.nav-item:hover,
.nav-item.active {
  background: var(--primary-color);
  color: white;
}

.nav-item .icon {
  margin-right: 10px;
  font-size: 18px;
}

.sidebar-footer {
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.theme-toggle {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
}

.theme-toggle:hover {
  background: var(--hover-bg);
}

.main-content {
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 20px 30px;
  background: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.search-box {
  flex: 1;
  max-width: 500px;
}

.search-input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.header-actions {
  margin-left: 20px;
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.content-area {
  flex: 1;
  padding: 30px;
}
</style>
