<template>
  <div class="theme-settings">
    <h1>主题设置</h1>

    <div class="settings-card">
      <h3 class="card-title">外观模式</h3>
      <div class="mode-toggle">
        <button
          class="mode-btn"
          :class="{ active: !darkMode }"
          @click="setDarkMode(false)"
        >
          ☀️ 浅色
        </button>
        <button
          class="mode-btn"
          :class="{ active: darkMode }"
          @click="setDarkMode(true)"
        >
          🌙 深色
        </button>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="card-title">预设色系</h3>
      <p class="card-desc">莫兰迪风格，低饱和度柔和色调</p>
      <div class="preset-list">
        <div
          v-for="p in presets"
          :key="p.name"
          class="preset-item"
          :class="{ active: currentPreset === p.name }"
          @click="applyPreset(p)"
        >
          <div class="preset-swatch" :style="{ background: p.color }"></div>
          <span class="preset-label">{{ p.label }}</span>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="card-title">自定义主色</h3>
      <p class="card-desc">选择任意颜色，自动提取色相生成莫兰迪风格主题</p>
      <div class="custom-color-row">
        <input
          type="color"
          class="color-picker"
          :value="pickerColor"
          @input="onCustomColor"
        />
        <div class="color-info">
          <div class="color-preview" :style="{ background: previewPrimary }"></div>
          <span class="color-hex">{{ previewPrimary }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBookStore } from '../stores/books'

const bookStore = useBookStore()

const presets = [
  { name: 'slate', label: '石板蓝', hue: 210, color: '#7B8FA1' },
  { name: 'rose', label: '玫瑰', hue: 350, color: '#A17B8B' },
  { name: 'sage', label: '鼠尾草', hue: 140, color: '#8BA17B' },
  { name: 'sand', label: '沙色', hue: 35, color: '#A1977B' },
  { name: 'lavender', label: '薰衣草', hue: 270, color: '#8B7BA1' },
]

const darkMode = ref(false)
const currentPreset = ref('slate')
const customHue = ref(210)

onMounted(() => {
  const root = document.documentElement
  darkMode.value = root.classList.contains('dark')

  const themeClasses = ['theme-rose', 'theme-sage', 'theme-sand', 'theme-lavender', 'theme-slate']
  let found = false
  for (const cls of themeClasses) {
    if (root.classList.contains(cls)) {
      currentPreset.value = cls.replace('theme-', '')
      found = true
      break
    }
  }

  const hueStyle = root.style.getPropertyValue('--theme-hue')
  if (hueStyle && !found) {
    currentPreset.value = 'custom'
    customHue.value = parseInt(hueStyle) || 210
  }

  if (!found && !hueStyle) {
    try {
      const saved = JSON.parse(localStorage.getItem('bnotes-theme') || '{}')
      if (saved.preset) currentPreset.value = saved.preset
      if (saved.darkMode !== undefined) darkMode.value = saved.darkMode
      if (saved.customHue != null) customHue.value = saved.customHue
    } catch (e) {}
  }
})

const currentHue = computed(() => {
  if (currentPreset.value === 'custom') return customHue.value
  const p = presets.find(item => item.name === currentPreset.value)
  return p ? p.hue : 210
})

const pickerColor = computed(() => hueToHex(currentHue.value))
const previewPrimary = computed(() => hueToHex(currentHue.value))

function hueToHex(hue) {
  const s = 0.17, l = 0.56
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((hue / 60) % 2 - 1))
  const m = l - c / 2
  let r, g, b
  if (hue >= 0 && hue < 60) { r = c; g = x; b = 0 }
  else if (hue >= 60 && hue < 120) { r = x; g = c; b = 0 }
  else if (hue >= 120 && hue < 180) { r = 0; g = c; b = x }
  else if (hue >= 180 && hue < 240) { r = 0; g = x; b = c }
  else if (hue >= 240 && hue < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  const toHex = v => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function hexToHue(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max === min) return 0
  const d = max - min
  let h
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return Math.round(h * 360)
}

function setDarkMode(value) {
  darkMode.value = value
  document.documentElement.classList.toggle('dark', value)
  saveTheme()
}

function applyPreset(preset) {
  currentPreset.value = preset.name
  const root = document.documentElement
  root.classList.remove('theme-rose', 'theme-sage', 'theme-sand', 'theme-lavender', 'theme-slate')
  root.classList.add(`theme-${preset.name}`)
  root.style.removeProperty('--theme-hue')
  saveTheme()
}

function onCustomColor(event) {
  const hex = event.target.value
  const hue = hexToHue(hex)
  customHue.value = hue
  currentPreset.value = 'custom'
  const root = document.documentElement
  root.classList.remove('theme-rose', 'theme-sage', 'theme-sand', 'theme-lavender', 'theme-slate')
  root.style.setProperty('--theme-hue', String(hue))
  saveTheme()
}

function saveTheme() {
  const settings = {
    preset: currentPreset.value,
    darkMode: darkMode.value,
    customHue: currentPreset.value === 'custom' ? customHue.value : null
  }
  localStorage.setItem('bnotes-theme', JSON.stringify(settings))
  bookStore.saveSetting('theme', settings).catch(() => {})
}
</script>

<style scoped>
.theme-settings {
  max-width: 600px;
}

.theme-settings h1 {
  font-size: 24px;
  margin: 0 0 24px;
}

.settings-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 8px;
  color: var(--text-color);
}

.card-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 16px;
}

.mode-toggle {
  display: flex;
  gap: 8px;
}

.mode-btn {
  flex: 1;
  padding: 10px 20px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--card-bg);
  color: var(--text-color);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.mode-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.mode-btn:hover:not(.active) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.preset-list {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.preset-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 12px;
  transition: all 0.2s;
}

.preset-item:hover {
  background: var(--hover-bg);
}

.preset-item.active .preset-swatch {
  box-shadow: 0 0 0 3px var(--primary-light), 0 0 0 5px var(--primary-color);
}

.preset-swatch {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  transition: all 0.2s;
}

.preset-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.preset-item.active .preset-label {
  color: var(--primary-color);
  font-weight: 500;
}

.custom-color-row {
  display: flex;
  align-items: center;
  gap: 20px;
}

.color-picker {
  width: 56px;
  height: 56px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  padding: 4px;
  background: var(--card-bg);
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 8px;
}

.color-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-preview {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.color-hex {
  font-size: 14px;
  color: var(--text-secondary);
  font-family: monospace;
}
</style>
