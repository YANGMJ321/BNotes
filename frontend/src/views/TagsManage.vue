<template>
  <div class="tags-manage">
    <div class="tags-header">
      <h1>标签管理</h1>
      <button class="btn btn-manage-toggle" :class="{ active: manageMode }" @click="manageMode = !manageMode">
        {{ manageMode ? '退出管理模式' : '管理模式' }}
      </button>
    </div>

    <div class="add-form">
      <input
        type="text"
        v-model="newTagName"
        placeholder="新标签名称"
        @keydown.enter="addTag"
      />
      <button class="btn btn-primary" @click="addTag">添加标签</button>
    </div>

    <div v-if="!manageMode" class="tags-cloud">
      <div
        v-for="(groupTags, groupName) in displayGroups"
        :key="groupName"
        class="tag-group"
        :class="{ naked: !hasGroups }"
      >
        <div class="group-header" v-if="hasGroups">{{ groupName }}</div>
        <div class="group-tags" :class="{ naked: !hasGroups }">
          <div v-for="tag in groupTags" :key="tag.id" class="tag-wrapper">
            <div
              class="tag-item"
              :class="{ expanded: expandedTagId === tag.id }"
              @click="toggleTagBooks(tag.id)"
            >
              <span class="tag-name">{{ tag.name }}</span>
              <span class="tag-count">{{ tagCount(tag) }}</span>
              <button class="btn-delete" @click.stop="deleteTag(tag.id)">×</button>
            </div>
            <div v-if="expandedTagId === tag.id" class="tag-books-section">
              <div v-if="tagBooksLoading" class="books-loading">加载中...</div>
              <div v-else-if="tagBooks.length === 0" class="books-empty">该标签下暂无书籍</div>
              <div v-else class="books-list">
                <div
                  v-for="book in tagBooks"
                  :key="book.id"
                  class="book-item"
                  @click="goToBook(book.id)"
                >
                  <span class="book-title">{{ book.title }}</span>
                  <span class="book-author">{{ book.author || '未知作者' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="tags-manage-list">
      <div v-for="(groupTags, groupName) in displayGroups" :key="groupName" class="tag-group">
        <div class="group-header">{{ groupName }}</div>
        <div class="group-tags">
          <div v-for="tag in groupTags" :key="tag.id" class="tag-manage-item">
            <span class="tag-name" @click="toggleTagBooks(tag.id)">{{ tag.name }} ({{ tagCount(tag) }})</span>
            <div class="tag-manage-actions">
              <input
                type="text"
                class="group-input"
                :value="tag.group_name || ''"
                @change="updateTagGroup(tag.id, $event.target.value)"
                placeholder="分组名称"
              />
              <button class="btn-delete" @click="deleteTag(tag.id)">×</button>
            </div>
            <div v-if="expandedTagId === tag.id" class="tag-books-section">
              <div v-if="tagBooksLoading" class="books-loading">加载中...</div>
              <div v-else-if="tagBooks.length === 0" class="books-empty">该标签下暂无书籍</div>
              <div v-else class="books-list">
                <div
                  v-for="book in tagBooks"
                  :key="book.id"
                  class="book-item"
                  @click="goToBook(book.id)"
                >
                  <span class="book-title">{{ book.title }}</span>
                  <span class="book-author">{{ book.author }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="tags.length === 0" class="empty-state">
      <p>还没有标签</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBookStore } from '../stores/books'
import { useRouter } from 'vue-router'

const bookStore = useBookStore()
const router = useRouter()
const tags = ref([])

const newTagName = ref('')
const manageMode = ref(false)
const expandedTagId = ref(null)
const tagBooks = ref([])
const tagBooksLoading = ref(false)

// 是否有人设置过分组：从未分过组时平铺显示，不出现组标题
const hasGroups = computed(() => tags.value.some(tag => (tag.group_name || '').trim()))

const displayGroups = computed(() => {
  // 无分组时返回单一假分组（不渲染标题），视觉上等同原平铺云
  if (!hasGroups.value) return { '': tags.value }
  const groups = {}
  const ungrouped = []
  tags.value.forEach(tag => {
    const name = (tag.group_name || '').trim()
    if (!name) {
      ungrouped.push(tag)
      return
    }
    if (!groups[name]) groups[name] = []
    groups[name].push(tag)
  })
  // 未分组的标签放在最后
  if (ungrouped.length) groups['未分组'] = ungrouped
  return groups
})

onMounted(async () => {
  await bookStore.fetchTags()
  await bookStore.fetchBooks()
  tags.value = bookStore.tags
})

function tagCount(tag) {
  return bookStore.books.filter(book => {
    const ids = (book.tag_ids || '').toString().split(',').filter(Boolean)
    return ids.includes(String(tag.id))
  }).length
}

async function addTag() {
  if (!newTagName.value.trim()) return
  await bookStore.saveTag({ name: newTagName.value })
  await bookStore.fetchTags()
  tags.value = bookStore.tags
  newTagName.value = ''
}

async function deleteTag(id) {
  if (confirm('确定删除该标签吗？')) {
    await bookStore.deleteTag(id)
    await bookStore.fetchTags()
    tags.value = bookStore.tags
  }
}

async function toggleTagBooks(tagId) {
  if (expandedTagId.value === tagId) {
    expandedTagId.value = null
    tagBooks.value = []
    return
  }
  expandedTagId.value = tagId
  tagBooksLoading.value = true
  try {
    const data = await bookStore.fetchTagBooks(tagId)
    if (data.code === 200) {
      tagBooks.value = data.data
    }
  } catch (e) {
    console.error('Failed to fetch tag books:', e)
    tagBooks.value = []
  }
  tagBooksLoading.value = false
}

async function updateTagGroup(tagId, groupName) {
  try {
    await bookStore.saveTag({ id: tagId, group_name: groupName })
    await bookStore.fetchTags()
    tags.value = bookStore.tags
  } catch (e) {
    console.error('Failed to update tag group:', e)
  }
}

function goToBook(bookId) {
  router.push(`/books/${bookId}`)
}
</script>

<style scoped>
.tags-manage {
  max-width: 800px;
}

.tags-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.tags-header h1 {
  font-size: 24px;
  margin: 0;
}

.btn-manage-toggle {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--card-bg);
  color: var(--text-color);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-manage-toggle.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.add-form {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.add-form input {
  flex: 1;
  max-width: 300px;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.tags-cloud {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 无分组时的平铺形态：去掉组容器外观 */
.tag-group.naked {
  border: none;
  background: none;
}

.group-tags.naked {
  padding: 0;
}

.tags-cloud .group-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 600px) {
  .tags-cloud .group-tags {
    flex-direction: column;
    gap: 10px;
  }
}

.tag-wrapper {
  display: flex;
  flex-direction: column;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.tag-item.expanded {
  outline: 1px solid var(--primary-color);
}

.tag-count {
  min-width: 18px;
  padding: 0 6px;
  border-radius: 9px;
  background: var(--card-bg);
  color: var(--text-secondary);
  font-size: 11px;
  text-align: center;
  line-height: 18px;
}

.btn-view-books {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  line-height: 1;
  opacity: 0.7;
}

.btn-view-books:hover {
  opacity: 1;
}

.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--primary-color);
  font-size: 18px;
  padding: 0;
  line-height: 1;
  opacity: 0.7;
}

.btn-delete:hover {
  opacity: 1;
}

.tag-books-section {
  margin-top: 6px;
  padding: 12px 16px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  min-width: 260px;
  width: 100%;
}

.books-loading,
.books-empty {
  text-align: center;
  padding: 16px;
  color: var(--text-secondary);
  font-size: 13px;
}

.books-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.book-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.book-item:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.book-title {
  font-size: 13px;
  font-weight: 500;
}

.book-author {
  font-size: 12px;
  color: var(--text-secondary);
}

.tags-manage-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tag-group {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.group-header {
  padding: 10px 16px;
  background: var(--primary-light);
  color: var(--primary-color);
  font-size: 14px;
  font-weight: 600;
}

.group-tags {
  padding: 8px 12px;
}

.tag-manage-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.tag-manage-item:last-child {
  border-bottom: none;
}

.tag-manage-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-input {
  width: 120px;
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.tag-name {
  cursor: pointer;
}

@media (max-width: 600px) {
  .tags-manage {
    padding: 0 14px 16px;
  }

  .add-form input {
    max-width: none;
  }

  .tag-wrapper {
    width: 100%;
  }

  .tag-item {
    width: 100%;
    justify-content: space-between;
    box-sizing: border-box;
  }

  .tags-cloud {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
