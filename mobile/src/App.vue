<template>
  <div class="mobile-layout">
    <header class="mobile-header">
      <h1 class="app-title">书记</h1>
      <div class="header-actions">
        <router-link to="/books/new" class="btn-add">+</router-link>
      </div>
    </header>

    <div class="mobile-search" v-if="showSearch">
      <input type="text" placeholder="搜索书籍、笔记..." v-model="searchKeyword" @input="handleSearch" />
    </div>

    <main class="mobile-content">
      <router-view />
    </main>

    <nav class="mobile-nav">
      <router-link to="/" class="nav-tab" :class="{ active: $route.path === '/' }">
        <span class="tab-icon">📚</span>
        <span class="tab-label">书架</span>
      </router-link>
      <router-link to="/notes" class="nav-tab" :class="{ active: $route.path === '/notes' }">
        <span class="tab-icon">📝</span>
        <span class="tab-label">笔记</span>
      </router-link>
      <router-link to="/categories" class="nav-tab" :class="{ active: $route.path === '/categories' }">
        <span class="tab-icon">📁</span>
        <span class="tab-label">分类</span>
      </router-link>
      <router-link to="/tags" class="nav-tab" :class="{ active: $route.path === '/tags' }">
        <span class="tab-icon">🏷️</span>
        <span class="tab-label">标签</span>
      </router-link>
      <router-link to="/more" class="nav-tab" :class="{ active: isMoreActive }">
        <span class="tab-icon">⋯</span>
        <span class="tab-label">更多</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useBookStore } from './stores/books'
import { useRoute, useRouter } from 'vue-router'

const bookStore = useBookStore()
const route = useRoute()
const router = useRouter()

const searchKeyword = ref('')
const showSearch = computed(() => {
  return route.path === '/' || route.path === '/notes'
})
const isDark = ref(document.documentElement.classList.contains('dark'))

const isMoreActive = computed(() => {
  return ['/more', '/import-export', '/feedback', '/theme'].includes(route.path)
})

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

  await bookStore.fetchBooks()
  await bookStore.fetchCategories()
  await bookStore.fetchTags()
})

watch(() => route.path, () => {
  isDark.value = document.documentElement.classList.contains('dark')
})
</script>

<style scoped>
.mobile-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
}

.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  background: var(--sidebar-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 100;
}

.app-title {
  font-size: 20px;
  margin: 0;
  color: var(--primary-color);
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
}

.btn-add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  min-width: 44px;
  min-height: 44px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  font-size: 22px;
  text-decoration: none;
  transition: background 0.2s;
}

.btn-add:active {
  background: var(--primary-dark);
}

.mobile-search {
  position: fixed;
  top: 52px;
  left: 0;
  right: 0;
  padding: 8px 16px;
  background: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
  z-index: 99;
}

.mobile-search input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
  min-height: 44px;
  transition: border-color 0.2s;
}

.mobile-search input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.mobile-content {
  flex: 1;
  margin-top: 52px;
  margin-bottom: 56px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--sidebar-bg);
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.nav-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.nav-tab.active {
  color: var(--primary-color);
}

.nav-tab:active {
  opacity: 0.7;
}

.tab-icon {
  font-size: 20px;
  line-height: 1;
}

.tab-label {
  font-size: 10px;
  margin-top: 2px;
}
</style>
