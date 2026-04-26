<template>
  <div class="categories-manage">
    <h1>分类管理</h1>

    <div class="add-form">
      <input
        type="text"
        v-model="newCategoryName"
        placeholder="新分类名称"
        @keydown.enter="addCategory"
      />
      <button class="btn btn-primary" @click="addCategory">添加分类</button>
    </div>

    <div class="categories-list">
      <div v-for="cat in categories" :key="cat.id" class="category-wrapper">
        <div class="category-item">
          <div class="category-info">
            <span class="category-name">{{ cat.name }}</span>
            <span class="book-count-badge">{{ getCategoryBookCount(cat.id) }}</span>
          </div>
          <div class="category-actions">
            <button class="btn btn-small btn-info" @click="toggleCategoryBooks(cat.id)">查看书籍</button>
            <button class="btn btn-small" @click="editCategory(cat)">编辑</button>
            <button
              class="btn btn-small btn-danger"
              @click="deleteCategory(cat.id, categories.length)"
              :disabled="categories.length <= 1"
            >
              删除
            </button>
          </div>
        </div>
        <div v-if="expandedCategoryId === cat.id" class="category-books-section">
          <div v-if="categoryBooksLoading" class="books-loading">加载中...</div>
          <div v-else-if="categoryBooks.length === 0" class="books-empty">该分类下暂无书籍</div>
          <div v-else class="books-list">
            <div
              v-for="book in categoryBooks"
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

    <div v-if="editingCategory" class="edit-modal">
      <div class="modal-content">
        <h3>编辑分类</h3>
        <input
          type="text"
          v-model="editingCategory.name"
          placeholder="分类名称"
          @keydown.enter="saveEdit"
        />
        <div class="modal-actions">
          <button class="btn btn-primary" @click="saveEdit">保存</button>
          <button class="btn btn-secondary" @click="cancelEdit">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useBookStore } from '../stores/books'
import { useRouter } from 'vue-router'

const bookStore = useBookStore()
const router = useRouter()
const categories = ref([])

const newCategoryName = ref('')
const editingCategory = ref(null)
const expandedCategoryId = ref(null)
const categoryBooks = ref([])
const categoryBooksLoading = ref(false)
const categoryBookCounts = ref({})

onMounted(async () => {
  await bookStore.fetchCategories()
  categories.value = bookStore.categories
})

async function addCategory() {
  if (!newCategoryName.value.trim()) return
  await bookStore.saveCategory({ name: newCategoryName.value })
  await bookStore.fetchCategories()
  categories.value = bookStore.categories
  newCategoryName.value = ''
}

function editCategory(cat) {
  editingCategory.value = { ...cat }
}

async function saveEdit() {
  if (!editingCategory.value.name.trim()) return
  await bookStore.saveCategory(editingCategory.value)
  await bookStore.fetchCategories()
  categories.value = bookStore.categories
  editingCategory.value = null
}

function cancelEdit() {
  editingCategory.value = null
}

async function deleteCategory(id, total) {
  if (total <= 1) {
    alert('无法删除最后一个分类')
    return
  }
  if (confirm('确定删除该分类吗？该分类下的书籍将移至其他分类')) {
    await bookStore.deleteCategory(id)
    await bookStore.fetchCategories()
    categories.value = bookStore.categories
  }
}

async function toggleCategoryBooks(categoryId) {
  if (expandedCategoryId.value === categoryId) {
    expandedCategoryId.value = null
    categoryBooks.value = []
    return
  }
  expandedCategoryId.value = categoryId
  categoryBooksLoading.value = true
  try {
    const data = await bookStore.fetchCategoryBooks(categoryId)
    if (data.code === 200) {
      categoryBooks.value = data.data
      categoryBookCounts.value[categoryId] = data.data.length
    }
  } catch (e) {
    console.error('Failed to fetch category books:', e)
    categoryBooks.value = []
  }
  categoryBooksLoading.value = false
}

function getCategoryBookCount(categoryId) {
  return categoryBookCounts.value[categoryId] ?? '...'
}

function goToBook(bookId) {
  router.push(`/books/${bookId}`)
}
</script>

<style scoped>
.categories-manage {
  max-width: 600px;
}

.categories-manage h1 {
  font-size: 24px;
  margin: 0 0 24px;
}

.add-form {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.add-form input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-wrapper {
  display: flex;
  flex-direction: column;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-name {
  font-size: 14px;
}

.book-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.category-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-secondary {
  background: var(--tag-bg);
  color: var(--text-color);
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-info {
  background: var(--primary-light);
  color: var(--primary-color);
}

.btn-info:hover {
  background: var(--primary-color);
  color: white;
}

.btn-danger {
  background: #ffebee;
  color: #c62828;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.category-books-section {
  margin-top: 4px;
  padding: 12px 16px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
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

.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--card-bg);
  padding: 24px;
  border-radius: 12px;
  width: 300px;
}

.modal-content h3 {
  margin: 0 0 16px;
}

.modal-content input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
  box-sizing: border-box;
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
