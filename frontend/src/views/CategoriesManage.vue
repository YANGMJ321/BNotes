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
      <div v-for="cat in categories" :key="cat.id" class="category-item">
        <span class="category-name">{{ cat.name }}</span>
        <div class="category-actions">
          <button class="btn btn-small" @click="editCategory(cat)">编辑</button>
          <button
            class="btn btn-small btn-danger"
            @click="deleteCategory(cat.id)"
            :disabled="cat.id === 1"
          >
            删除
          </button>
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

const bookStore = useBookStore()
const categories = ref([])

const newCategoryName = ref('')
const editingCategory = ref(null)

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

async function deleteCategory(id) {
  if (id === 1) return
  if (confirm('确定删除该分类吗？')) {
    await bookStore.deleteCategory(id)
    await bookStore.fetchCategories()
    categories.value = bookStore.categories
  }
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

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.category-name {
  font-size: 14px;
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

.btn-danger {
  background: #ffebee;
  color: #c62828;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
