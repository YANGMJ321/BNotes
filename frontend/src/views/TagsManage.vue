<template>
  <div class="tags-manage">
    <h1>标签管理</h1>

    <div class="add-form">
      <input
        type="text"
        v-model="newTagName"
        placeholder="新标签名称"
        @keydown.enter="addTag"
      />
      <button class="btn btn-primary" @click="addTag">添加标签</button>
    </div>

    <div class="tags-cloud">
      <div v-for="tag in tags" :key="tag.id" class="tag-item">
        <span class="tag-name">{{ tag.name }}</span>
        <button class="btn-delete" @click="deleteTag(tag.id)">×</button>
      </div>
    </div>

    <div v-if="tags.length === 0" class="empty-state">
      <p>还没有标签</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useBookStore } from '../stores/books'

const bookStore = useBookStore()
const tags = ref([])

const newTagName = ref('')

onMounted(async () => {
  await bookStore.fetchTags()
  tags.value = bookStore.tags
})

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
</script>

<style scoped>
.tags-manage {
  max-width: 800px;
}

.tags-manage h1 {
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
  flex-wrap: wrap;
  gap: 12px;
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}
</style>
