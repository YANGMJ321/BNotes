<template>
  <div class="more-view">
    <div class="more-list">
      <router-link to="/import-export" class="more-item">
        <span class="more-icon">📦</span>
        <span class="more-text">导入导出</span>
        <span class="more-arrow">›</span>
      </router-link>

      <router-link to="/theme" class="more-item">
        <span class="more-icon">🎨</span>
        <span class="more-text">主题设置</span>
        <span class="more-arrow">›</span>
      </router-link>

      <router-link to="/feedback" class="more-item">
        <span class="more-icon">💬</span>
        <span class="more-text">反馈</span>
        <span class="more-arrow">›</span>
      </router-link>

      <button class="more-item" @click="toggleTheme">
        <span class="more-icon">{{ isDark ? '☀️' : '🌙' }}</span>
        <span class="more-text">{{ isDark ? '浅色模式' : '深色模式' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useBookStore } from '../stores/books'

const bookStore = useBookStore()
const isDark = ref(document.documentElement.classList.contains('dark'))

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
</script>

<style scoped>
.more-view {
  padding: 16px;
}

.more-list {
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px var(--shadow-color);
}

.more-item {
  display: flex;
  align-items: center;
  padding: 16px;
  min-height: 56px;
  color: var(--text-color);
  text-decoration: none;
  background: none;
  border: none;
  width: 100%;
  font-size: 15px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.15s;
}

.more-item:last-child {
  border-bottom: none;
}

.more-item:active {
  background: var(--hover-bg);
}

.more-icon {
  font-size: 20px;
  margin-right: 14px;
  flex-shrink: 0;
}

.more-text {
  flex: 1;
  text-align: left;
}

.more-arrow {
  color: var(--text-secondary);
  font-size: 18px;
  margin-left: 8px;
}
</style>
