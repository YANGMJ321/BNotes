import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE = import.meta.env.DEV ? 'http://localhost:18765/api' : '/api'

export const useBookStore = defineStore('books', () => {
  const books = ref([])
  const categories = ref([])
  const tags = ref([])
  const currentBook = ref(null)
  const filters = ref({ category: '', status: '', tag: '' })

  const filteredBooks = computed(() => {
    return books.value.filter(book => {
      if (filters.value.category && book.category_id != filters.value.category) return false
      if (filters.value.status && book.status !== filters.value.status) return false
      if (filters.value.tag && !book.tag_ids?.split(',').includes(filters.value.tag.toString())) return false
      return true
    })
  })

  async function fetchBooks() {
    try {
      const res = await fetch(`${API_BASE}/books`)
      const data = await res.json()
      if (data.code === 200) {
        books.value = data.data
      }
    } catch (e) {
      console.error('Failed to fetch books:', e)
    }
  }

  async function fetchBook(id) {
    try {
      const res = await fetch(`${API_BASE}/books/${id}`)
      const data = await res.json()
      if (data.code === 200) {
        currentBook.value = data.data
      }
      return data
    } catch (e) {
      console.error('Failed to fetch book:', e)
    }
  }

  async function saveBook(bookData) {
    try {
      const method = bookData.id ? 'PUT' : 'POST'
      const url = bookData.id ? `${API_BASE}/books/${bookData.id}` : `${API_BASE}/books`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData)
      })
      const data = await res.json()
      if (data.code === 200 || data.code === 201) {
        await fetchBooks()
      }
      return data
    } catch (e) {
      console.error('Failed to save book:', e)
    }
  }

  async function deleteBook(id) {
    try {
      const res = await fetch(`${API_BASE}/books/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.code === 200) {
        await fetchBooks()
      }
      return data
    } catch (e) {
      console.error('Failed to delete book:', e)
    }
  }

  async function batchDelete(ids) {
    try {
      const res = await fetch(`${API_BASE}/batch/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, type: 'books' })
      })
      const data = await res.json()
      if (data.code === 200) {
        await fetchBooks()
      }
      return data
    } catch (e) {
      console.error('Failed to batch delete:', e)
    }
  }

  async function batchMove(ids, categoryId) {
    try {
      const res = await fetch(`${API_BASE}/batch/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, category_id: categoryId })
      })
      const data = await res.json()
      if (data.code === 200) {
        await fetchBooks()
      }
      return data
    } catch (e) {
      console.error('Failed to batch move:', e)
    }
  }

  async function batchExport(ids) {
    try {
      const res = await fetch(`${API_BASE}/export/html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_ids: ids })
      })
      const contentType = res.headers.get('Content-Type') || ''
      if (contentType.includes('text/html')) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `BNotes导出-${new Date().toLocaleDateString('zh-CN')}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        return { code: 200 }
      }
      const data = await res.json()
      return data
    } catch (e) {
      console.error('Failed to export:', e)
    }
  }

  async function searchBooks(keyword) {
    try {
      const res = await fetch(`${API_BASE}/search?keyword=${encodeURIComponent(keyword)}`)
      const data = await res.json()
      return data
    } catch (e) {
      console.error('Failed to search:', e)
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch(`${API_BASE}/categories`)
      const data = await res.json()
      if (data.code === 200) {
        categories.value = data.data
      }
    } catch (e) {
      console.error('Failed to fetch categories:', e)
    }
  }

  async function saveCategory(catData) {
    try {
      const method = catData.id ? 'PUT' : 'POST'
      const url = catData.id ? `${API_BASE}/categories/${catData.id}` : `${API_BASE}/categories`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catData)
      })
      const data = await res.json()
      if (data.code === 200 || data.code === 201) {
        await fetchCategories()
      }
      return data
    } catch (e) {
      console.error('Failed to save category:', e)
    }
  }

  async function deleteCategory(id) {
    try {
      const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.code === 200) {
        await fetchCategories()
      }
      return data
    } catch (e) {
      console.error('Failed to delete category:', e)
    }
  }

  async function fetchTags() {
    try {
      const res = await fetch(`${API_BASE}/tags`)
      const data = await res.json()
      if (data.code === 200) {
        tags.value = data.data
      }
    } catch (e) {
      console.error('Failed to fetch tags:', e)
    }
  }

  async function saveTag(tagData) {
    try {
      const method = tagData.id ? 'PUT' : 'POST'
      const url = tagData.id ? `${API_BASE}/tags/${tagData.id}` : `${API_BASE}/tags`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tagData)
      })
      const data = await res.json()
      if (data.code === 200 || data.code === 201) {
        await fetchTags()
      }
      return data
    } catch (e) {
      console.error('Failed to save tag:', e)
    }
  }

  async function deleteTag(id) {
    try {
      const res = await fetch(`${API_BASE}/tags/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.code === 200) {
        await fetchTags()
      }
      return data
    } catch (e) {
      console.error('Failed to delete tag:', e)
    }
  }

  function setFilter(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function saveCurrentBook() {
    if (currentBook.value) {
      saveBook(currentBook.value)
    }
  }

  async function fetchCategoryBooks(categoryId) {
    const res = await fetch(`${API_BASE}/categories/${categoryId}/books`)
    return await res.json()
  }

  async function fetchTagBooks(tagId) {
    const res = await fetch(`${API_BASE}/tags/${tagId}/books`)
    return await res.json()
  }

  async function submitFeedback(data) {
    const res = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return await res.json()
  }

  async function getSetting(key) {
    const res = await fetch(`${API_BASE}/settings/${key}`)
    const data = await res.json()
    return data.data
  }

  async function saveSetting(key, value) {
    const res = await fetch(`${API_BASE}/settings/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
    })
    return await res.json()
  }

  async function exportBnotes(bookIds) {
    try {
      const res = await fetch(`${API_BASE}/export/bnotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_ids: bookIds })
      })
      const data = await res.json()
      if (data.type === 'bnotes-export') {
        // Pack into ZIP file
        const JSZip = (await import('jszip')).default
        const zip = new JSZip()
        const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')
        zip.file(`bnotes-export-${dateStr}.json`, JSON.stringify(data, null, 2))
        const blob = await zip.generateAsync({ type: 'blob' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `书记导出-${dateStr}.zip`
        a.click()
        URL.revokeObjectURL(url)
        return { code: 200 }
      }
      return data
    } catch (e) {
      console.error('Failed to export bnotes:', e)
      return { code: 500, message: e.message }
    }
  }

  async function importBnotes(data, mode) {
    try {
      const res = await fetch(`${API_BASE}/import/bnotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, mode })
      })
      const result = await res.json()
      if (result.code === 200 && mode !== 'none') {
        await fetchBooks()
        await fetchCategories()
        await fetchTags()
      }
      return result
    } catch (e) {
      console.error('Failed to import bnotes:', e)
      return { code: 500, message: e.message }
    }
  }

  return {
    books,
    categories,
    tags,
    currentBook,
    filters,
    filteredBooks,
    fetchBooks,
    fetchBook,
    saveBook,
    deleteBook,
    batchDelete,
    batchMove,
    batchExport,
    searchBooks,
    fetchCategories,
    saveCategory,
    deleteCategory,
    fetchTags,
    saveTag,
    deleteTag,
    setFilter,
    saveCurrentBook,
    fetchCategoryBooks,
    fetchTagBooks,
    submitFeedback,
    getSetting,
    saveSetting,
    exportBnotes,
    importBnotes
  }
})
