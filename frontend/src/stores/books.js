import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE = 'http://localhost/api'

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
      const res = await fetch(`${API_BASE}/export/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_ids: ids })
      })
      const data = await res.json()
      if (data.code === 200) {
        window.open(data.data.path, '_blank')
      }
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
    saveCurrentBook
  }
})
