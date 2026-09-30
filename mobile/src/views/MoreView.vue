<template>
  <div class="more-view">
    <div class="more-list">
      <router-link to="/import-export" class="more-item">
        <span class="more-icon">📦</span>
        <span class="more-text">导入导出</span>
        <span class="more-arrow">›</span>
      </router-link>

      <button class="more-item" @click="backupDatabase">
        <span class="more-icon">💾</span>
        <span class="more-text">备份数据库</span>
        <span class="more-arrow">›</span>
      </button>

      <button class="more-item" @click="restoreDatabase">
        <span class="more-icon">📥</span>
        <span class="more-text">恢复备份</span>
        <span class="more-arrow">›</span>
      </button>

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

      <input ref="restoreInput" type="file" accept=".db" class="hidden-input" @change="handleRestoreFile" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useBookStore } from '../stores/books'
import db from '../database'

const bookStore = useBookStore()
const isDark = ref(document.documentElement.classList.contains('dark'))
const restoreInput = ref(null)
const busy = ref(false)

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

// Uint8Array -> base64（分段编码，避免大文件栈溢出）
function uint8ToBase64(bytes) {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

// 备份：导出整个数据库为 .db 文件并分享
async function backupDatabase() {
  if (busy.value) return
  busy.value = true
  try {
    await db.init()
    const bytes = db.export()
    if (!bytes) {
      alert('数据库为空，无法备份')
      return
    }

    const filename = `bnotes-backup-${new Date().toISOString().slice(0, 10)}.db`

    // 优先使用 Capacitor 原生分享（真机）
    const Capacitor = (await import('@capacitor/core')).Capacitor
    if (Capacitor.isNativePlatform()) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      const { Share } = await import('@capacitor/share')
      const base64 = uint8ToBase64(bytes)
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache
      })
      await Share.share({ files: [result.uri], title: 'BNotes 数据库备份' })
    } else {
      // Web 环境降级：浏览器下载
      const blob = new Blob([bytes], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  } catch (e) {
    alert('备份失败：' + (e.message || '未知错误'))
  } finally {
    busy.value = false
  }
}

// 恢复：选择 .db 备份文件并替换当前数据库
function restoreDatabase() {
  restoreInput.value?.click()
}

async function handleRestoreFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.db')) {
    alert('请选择 .db 备份文件')
    return
  }
  if (!confirm(`将用 "${file.name}" 替换当前全部数据，确定继续吗？`)) return

  busy.value = true
  try {
    const buffer = await file.arrayBuffer()
    await db.import(new Uint8Array(buffer))
    // 恢复后刷新页面数据
    await bookStore.fetchBooks()
    await bookStore.fetchCategories()
    await bookStore.fetchTags()
    alert('备份恢复成功')
  } catch (e) {
    alert('恢复失败：' + (e.message || '未知错误'))
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.more-view {
  padding: 16px;
}

.hidden-input {
  display: none;
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
