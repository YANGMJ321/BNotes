<template>
  <div class="stats-view">
    <div class="stats-header">
      <h1>阅读统计</h1>
      <div class="stats-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="stats-tab"
          :class="{ active: currentTab === tab.key }"
          @click="currentTab = tab.key"
        >{{ tab.label }}</button>
      </div>
    </div>

    <!-- 概览 -->
    <div v-if="currentTab === 'overview'" class="overview-grid">
      <div
        v-for="card in overviewCards"
        :key="card.label"
        class="stat-card"
        :class="{ clickable: card.to }"
        @click="goCard(card)"
      >
        <div class="stat-value">{{ card.value }}</div>
        <div class="stat-label">{{ card.label }}</div>
      </div>
    </div>

    <!-- 状态分布 -->
    <div v-else-if="currentTab === 'status'" class="status-view">
      <template v-if="totalBooks > 0">
        <svg class="donut" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="70" fill="none" stroke="var(--hover-bg)" stroke-width="28" />
          <circle
            v-for="seg in donutSegments"
            :key="seg.key"
            cx="100"
            cy="100"
            r="70"
            fill="none"
            :stroke="seg.color"
            stroke-width="28"
            :stroke-dasharray="`${seg.len} ${CIRC}`"
            :stroke-dashoffset="seg.offset"
            transform="rotate(-90 100 100)"
          />
          <text x="100" y="102" text-anchor="middle" class="donut-total">{{ totalBooks }}</text>
          <text x="100" y="122" text-anchor="middle" class="donut-caption">总藏书</text>
        </svg>
        <div class="status-legend">
          <div v-for="item in statusLegend" :key="item.key" class="legend-item">
            <span class="legend-dot" :style="{ background: item.color }"></span>
            <span class="legend-label">{{ item.label }}</span>
            <span class="legend-count">{{ item.count }}</span>
            <span class="legend-pct">{{ item.percent }}%</span>
          </div>
        </div>
      </template>
      <p v-else class="empty">还没有书籍数据</p>
    </div>

    <!-- 阅读趋势 -->
    <div v-else class="trend-view">
      <div class="year-selector">
        <button
          class="year-btn"
          :class="{ active: selectedYear === null }"
          @click="selectedYear = null"
        >全部</button>
        <button
          v-for="y in years"
          :key="y"
          class="year-btn"
          :class="{ active: selectedYear === y }"
          @click="selectedYear = y"
        >{{ y }}</button>
      </div>
      <template v-if="trendData.length">
        <svg class="bar-chart" viewBox="0 0 560 260">
          <!-- 网格线 -->
          <line
            v-for="g in gridLines"
            :key="g.y"
            :x1="PAD_L" :x2="W - PAD_R" :y1="g.y" :y2="g.y"
            class="grid-line"
          />
          <text v-for="g in gridLines" :key="'t' + g.y" :x="PAD_L - 6" :y="g.y + 4" text-anchor="end" class="axis-label">
            {{ g.label }}
          </text>
          <!-- 柱 -->
          <rect
            v-for="bar in bars"
            :key="bar.label"
            :x="bar.x" :y="bar.y" :width="bar.w" :height="bar.h"
            rx="3" class="bar"
            :style="{ fill: barColor }"
          />
          <text
            v-for="bar in bars"
            :key="'v' + bar.label"
            :x="bar.x + bar.w / 2" :y="bar.y - 5" text-anchor="middle" class="value-label"
          >{{ bar.count }}</text>
          <text
            v-for="bar in bars"
            :key="'x' + bar.label"
            :x="bar.x + bar.w / 2" :y="H - PAD_B + 18" text-anchor="middle" class="axis-label"
          >{{ bar.label }}</text>
        </svg>
        <p class="trend-hint">{{ selectedYear === null ? '各年度已读数量' : `${selectedYear}年每月已读数量` }}</p>
      </template>
      <p v-else class="empty">暂无已读记录（请将书籍标记为"已读"并填写阅读日期）</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBookStore } from '../stores/books'

const router = useRouter()
const bookStore = useBookStore()

const tabs = [
  { key: 'overview', label: '概览' },
  { key: 'status', label: '状态分布' },
  { key: 'trend', label: '阅读趋势' }
]
const currentTab = ref('overview')
const selectedYear = ref(null)

// 图表常量
const W = 560
const H = 260
const PAD_L = 40
const PAD_R = 20
const PAD_T = 20
const PAD_B = 40
const CIRC = 2 * Math.PI * 70

const books = computed(() => bookStore.books)

const totalBooks = computed(() => books.value.length)

const statusCounts = computed(() => {
  const map = { want: 0, reading: 0, done: 0 }
  books.value.forEach((b) => { if (b.status in map) map[b.status]++ })
  return map
})

const noteCount = computed(() =>
  books.value.reduce((sum, b) => sum + (b.content ? 1 : 0) + (b.excerpts ? 1 : 0) + (b.reflections ? 1 : 0), 0)
)

const overviewCards = computed(() => [
  { label: '总藏书', value: totalBooks.value, to: '/' },
  { label: '想读', value: statusCounts.value.want, to: '/', status: 'want' },
  { label: '在读', value: statusCounts.value.reading, to: '/', status: 'reading' },
  { label: '已读', value: statusCounts.value.done, to: '/', status: 'done' },
  { label: '笔记条数', value: noteCount.value, to: '/notes' }
])

// 点击概览卡跳转：状态卡会带上对应筛选条件
function goCard(card) {
  if (!card.to) return
  if (card.status) {
    bookStore.setFilter({ status: card.status, category: '', tag: '' })
  } else if (card.to === '/') {
    bookStore.setFilter({ status: '', category: '', tag: '' })
  }
  router.push(card.to)
}

const STATUS_META = [
  { key: 'want', label: '想读', color: '#1976d2' },
  { key: 'reading', label: '在读', color: '#f57c00' },
  { key: 'done', label: '已读', color: '#388e3c' }
]

const statusLegend = computed(() =>
  STATUS_META.map((s) => {
    const count = statusCounts.value[s.key]
    return {
      ...s,
      count,
      percent: totalBooks.value ? Math.round((count / totalBooks.value) * 100) : 0
    }
  })
)

// 环形图分段：按顺时针累计偏移
const donutSegments = computed(() => {
  let offset = 0
  return STATUS_META.map((s) => {
    const count = statusCounts.value[s.key]
    const len = totalBooks.value ? (count / totalBooks.value) * CIRC : 0
    const seg = { key: s.key, color: s.color, len, offset: -offset }
    offset += len
    return seg
  })
})

// 已读书籍（按阅读日期统计）
const readBooks = computed(() =>
  books.value.filter((b) => b.read_date && b.status === 'done')
)

const years = computed(() => {
  const set = new Set()
  readBooks.value.forEach((b) => set.add(b.read_date.slice(0, 4)))
  return [...set].sort()
})

const trendData = computed(() => {
  if (selectedYear.value === null) {
    // 全部：按年汇总
    const map = {}
    readBooks.value.forEach((b) => {
      const y = b.read_date.slice(0, 4)
      map[y] = (map[y] || 0) + 1
    })
    return years.value.map((y) => ({ label: y, count: map[y] || 0 }))
  }
  // 指定年份：12 个月
  const map = {}
  readBooks.value.forEach((b) => {
    if (b.read_date.slice(0, 4) === selectedYear.value) {
      const m = parseInt(b.read_date.slice(5, 7), 10)
      map[m] = (map[m] || 0) + 1
    }
  })
  return Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}月`, count: map[i + 1] || 0 }))
})

const maxCount = computed(() => Math.max(...trendData.value.map((d) => d.count), 1))

const gridLines = computed(() => {
  const lines = []
  for (let i = 0; i <= 4; i++) {
    const ratio = i / 4
    const y = PAD_T + (H - PAD_T - PAD_B) * (1 - ratio)
    lines.push({ y, label: Math.round(maxCount.value * ratio) })
  }
  return lines
})

const bars = computed(() => {
  const n = trendData.value.length
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const slot = plotW / n
  const barW = Math.max(slot * 0.55, 8)
  const gap = (slot - barW) / 2
  return trendData.value.map((d, i) => ({
    label: d.label,
    count: d.count,
    x: PAD_L + i * slot + gap,
    y: PAD_T + plotH - (d.count / maxCount.value) * plotH,
    w: barW,
    h: (d.count / maxCount.value) * plotH
  }))
})

const barColor = 'var(--primary-color)'

onMounted(() => {
  bookStore.fetchBooks()
})
</script>

<style scoped>
.stats-view {
  max-width: 800px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.stats-header h1 {
  font-size: 24px;
  margin: 0;
}

.stats-tabs {
  display: flex;
  gap: 6px;
  background: var(--hover-bg);
  padding: 4px;
  border-radius: 10px;
}

.stats-tab {
  padding: 6px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  background: transparent;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.stats-tab:hover {
  color: var(--text-color);
}

.stats-tab.active {
  background: var(--card-bg);
  color: var(--text-color);
  box-shadow: 0 1px 4px var(--shadow-color);
}

/* 概览数字卡 */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 16px;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: all 0.2s;
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card.clickable:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px var(--shadow-color);
  transform: translateY(-2px);
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: var(--primary-color);
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 8px;
}

/* 状态分布 */
.status-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 30px 20px;
}

.donut {
  width: 220px;
  max-width: 100%;
}

.donut-total {
  font-size: 34px;
  font-weight: 600;
  fill: var(--text-color);
}

.donut-caption {
  font-size: 13px;
  fill: var(--text-secondary);
}

.status-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 280px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text-color);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-label {
  flex: 1;
  text-align: left;
}

.legend-count {
  font-weight: 600;
}

.legend-pct {
  color: var(--text-secondary);
  font-size: 12px;
  min-width: 40px;
  text-align: right;
}

/* 阅读趋势 */
.trend-view {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
}

.year-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.year-btn {
  padding: 5px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  background: transparent;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.year-btn.active {
  border-color: var(--primary-color);
  background: var(--primary-light);
  color: var(--primary-color);
}

.bar-chart {
  width: 100%;
  height: auto;
}

.grid-line {
  stroke: var(--border-color);
  stroke-width: 1;
}

.axis-label {
  font-size: 11px;
  fill: var(--text-secondary);
}

.value-label {
  font-size: 12px;
  font-weight: 600;
  fill: var(--text-color);
}

.bar {
  transition: fill 0.2s;
}

.trend-hint {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  margin: 12px 0 0;
}

.empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .stats-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
