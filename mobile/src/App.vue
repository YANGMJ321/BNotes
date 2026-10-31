<template>
  <div class="mobile-layout">
    <!-- 左上角圆形搜索入口，点击后展开搜索面板 -->
    <button v-if="showSearchFab" class="search-fab" @click="openSearch" aria-label="搜索">
      <span class="search-icon">🔍</span>
    </button>

    <div v-if="searchOpen" class="search-overlay">
      <div class="search-panel">
        <input
          ref="searchInput"
          type="text"
          placeholder="搜索书籍、笔记..."
          v-model="searchKeyword"
          @keydown.enter="doSearch"
        />
        <button class="search-confirm" @click="doSearch">搜索</button>
        <button class="search-cancel" @click="closeSearch">取消</button>
      </div>
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
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useBookStore } from './stores/books'
import { useRoute, useRouter } from 'vue-router'

const bookStore = useBookStore()
const route = useRoute()
const router = useRouter()

const searchKeyword = ref('')
const searchOpen = ref(false)
const searchInput = ref(null)
const isDark = ref(document.documentElement.classList.contains('dark'))

// 只在书架和笔记页显示搜索入口，避免遮挡其他页面内容
const showSearchFab = computed(() => route.path === '/' || route.path === '/notes')

const isMoreActive = computed(() => {
  return ['/more', '/import-export', '/feedback', '/theme', '/usage-guide', '/donate', '/profile', '/stats'].includes(route.path)
})

async function openSearch() {
  searchOpen.value = true
  await nextTick()
  searchInput.value?.focus()
}

function closeSearch() {
  searchOpen.value = false
  searchKeyword.value = ''
}

// 仅在点击“搜索”或回车时触发，删除输入内容不会误触发搜索
function doSearch() {
  const keyword = searchKeyword.value.trim()
  if (!keyword) return
  searchOpen.value = false
  router.push({ path: '/search', query: { q: keyword } })
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
  searchOpen.value = false
  searchKeyword.value = ''
})
</script>

<style scoped>
.mobile-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
}

.search-fab {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 10px);
  left: 12px;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-color);
  border-radius: 50%;
  background: var(--sidebar-bg);
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 120;
  cursor: pointer;
  box-shadow: 0 2px 8px var(--shadow-color);
  -webkit-tap-highlight-color: transparent;
}

.search-fab:active {
  background: var(--hover-bg);
}

.search-icon {
  font-size: 18px;
  line-height: 1;
}

.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: calc(env(safe-area-inset-top, 0px) + 10px) 12px 10px;
  background: var(--sidebar-bg);
  border-bottom: 1px solid var(--border-color);
  z-index: 130;
  box-shadow: 0 4px 16px var(--shadow-color);
}

.search-panel {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-panel input {
  flex: 1;
  min-width: 0;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
  min-height: 40px;
  box-sizing: border-box;
}

.search-panel input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.search-confirm {
  border: none;
  border-radius: 18px;
  padding: 9px 14px;
  background: var(--primary-color);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.search-cancel {
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 13px;
  padding: 9px 4px;
  cursor: pointer;
  white-space: nowrap;
}

.mobile-content {
  flex: 1;
  margin-top: 0;
  padding-top: calc(env(safe-area-inset-top, 0px) + 58px);
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
