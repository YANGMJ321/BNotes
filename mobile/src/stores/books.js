import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import db from '../database'

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

  // ========== Books ==========

  async function fetchBooks() {
    try {
      await db.init()
      const rows = db.queryAll(`
        SELECT b.*, c.name as category_name,
               GROUP_CONCAT(DISTINCT t.id) as tag_ids,
               GROUP_CONCAT(DISTINCT t.name) as tag_names
        FROM books b
        LEFT JOIN categories c ON b.category_id = c.id
        LEFT JOIN book_tags bt ON b.id = bt.book_id
        LEFT JOIN tags t ON bt.tag_id = t.id
        GROUP BY b.id
        ORDER BY b.updated_at DESC
      `)
      books.value = rows
    } catch (e) {
      console.error('Failed to fetch books:', e)
    }
  }

  async function fetchBook(id) {
    try {
      await db.init()
      const book = db.queryOne(`
        SELECT b.*, c.name as category_name,
               GROUP_CONCAT(DISTINCT t.id) as tag_ids,
               GROUP_CONCAT(DISTINCT t.name) as tag_names,
               n.content as note_content, n.excerpts, n.reflections,
               n.id as note_id, n.time_mode
        FROM books b
        LEFT JOIN categories c ON b.category_id = c.id
        LEFT JOIN book_tags bt ON b.id = bt.book_id
        LEFT JOIN tags t ON bt.tag_id = t.id
        LEFT JOIN notes n ON b.id = n.book_id
        WHERE b.id = ?
        GROUP BY b.id
      `, [id])

      if (!book) {
        return { code: 404, message: 'Book not found' }
      }

      book.note = book.note_id
        ? { id: book.note_id, content: book.note_content, excerpts: book.excerpts, reflections: book.reflections, time_mode: book.time_mode }
        : null

      delete book.note_content
      delete book.note_id
      delete book.time_mode

      currentBook.value = book
      return { code: 200, data: book }
    } catch (e) {
      console.error('Failed to fetch book:', e)
      return { code: 500, message: e.message }
    }
  }

  async function saveBook(bookData) {
    try {
      await db.init()

      if (bookData.id) {
        // UPDATE
        const fields = []
        const params = []
        const allowedFields = ['title', 'author', 'category_id', 'status', 'progress', 'read_date', 'cover']

        for (const field of allowedFields) {
          if (bookData[field] !== undefined) {
            fields.push(`${field} = ?`)
            params.push(bookData[field])
          }
        }

        if (fields.length > 0) {
          fields.push('updated_at = CURRENT_TIMESTAMP')
          params.push(bookData.id)
          db.run(`UPDATE books SET ${fields.join(', ')} WHERE id = ?`, params)
        }

        // UPSERT notes
        if (bookData.note) {
          const existingNote = db.queryOne('SELECT id FROM notes WHERE book_id = ?', [bookData.id])
          const noteData = bookData.note
          const noteFields = []
          const noteParams = []
          const allowedNoteFields = ['content', 'excerpts', 'reflections', 'note_date', 'time_mode']

          for (const field of allowedNoteFields) {
            if (noteData[field] !== undefined) {
              noteFields.push(`${field} = ?`)
              noteParams.push(noteData[field])
            }
          }

          if (existingNote) {
            if (noteFields.length > 0) {
              noteFields.push('updated_at = CURRENT_TIMESTAMP')
              noteParams.push(bookData.id)
              db.run(`UPDATE notes SET ${noteFields.join(', ')} WHERE book_id = ?`, noteParams)
            }
          } else {
            const cols = ['book_id', ...allowedNoteFields.filter(f => noteData[f] !== undefined)]
            const vals = [bookData.id, ...cols.slice(1).map(f => noteData[f])]
            const placeholders = cols.map(() => '?').join(',')
            db.run(`INSERT INTO notes (${cols.join(',')}) VALUES (${placeholders})`, vals)
          }
        }

        // DELETE + INSERT book_tags
        if (bookData.tags !== undefined) {
          db.run('DELETE FROM book_tags WHERE book_id = ?', [bookData.id])
          saveTags(bookData.id, bookData.tags)
        }

        await db.save()
        await fetchBooks()
        return { code: 200, message: 'Book updated' }
      } else {
        // INSERT
        const result = db.run(`
          INSERT INTO books (title, author, category_id, status, progress, read_date, cover)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [bookData.title || '', bookData.author || '', bookData.category_id || 1, bookData.status || 'want', bookData.progress || 0, bookData.read_date || null, bookData.cover || ''])

        const bookId = result.lastInsertRowid

        // INSERT notes
        if (bookData.note) {
          const noteData = bookData.note
          db.run(`
            INSERT INTO notes (book_id, content, excerpts, reflections, note_date, time_mode)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [bookId, noteData.content || '', noteData.excerpts || '', noteData.reflections || '', noteData.note_date || null, noteData.time_mode || null])
        } else {
          db.run('INSERT INTO notes (book_id) VALUES (?)', [bookId])
        }

        // INSERT book_tags
        if (bookData.tags && bookData.tags.length > 0) {
          saveTags(bookId, bookData.tags)
        }

        await db.save()
        await fetchBooks()
        return { code: 201, message: 'Book created', data: { id: bookId } }
      }
    } catch (e) {
      console.error('Failed to save book:', e)
      return { code: 500, message: e.message }
    }
  }

  function saveTags(bookId, tagNames) {
    for (const tagName of tagNames) {
      const name = (tagName || '').trim()
      if (!name) continue
      db.run('INSERT OR IGNORE INTO tags (name) VALUES (?)', [name])
      const tag = db.queryOne('SELECT id FROM tags WHERE name = ?', [name])
      if (tag) {
        db.run('INSERT OR IGNORE INTO book_tags (book_id, tag_id) VALUES (?, ?)', [bookId, tag.id])
      }
    }
  }

  async function deleteBook(id) {
    try {
      await db.init()
      db.run('DELETE FROM book_tags WHERE book_id = ?', [id])
      db.run('DELETE FROM notes WHERE book_id = ?', [id])
      db.run('DELETE FROM note_links WHERE source_note_id IN (SELECT id FROM notes WHERE book_id = ?)', [id])
      db.run('DELETE FROM books WHERE id = ?', [id])
      await db.save()
      await fetchBooks()
      return { code: 200, message: 'Book deleted' }
    } catch (e) {
      console.error('Failed to delete book:', e)
      return { code: 500, message: e.message }
    }
  }

  async function batchDelete(ids) {
    try {
      await db.init()
      for (const id of ids) {
        db.run('DELETE FROM book_tags WHERE book_id = ?', [id])
        db.run('DELETE FROM notes WHERE book_id = ?', [id])
        db.run('DELETE FROM note_links WHERE source_note_id IN (SELECT id FROM notes WHERE book_id = ?)', [id])
        db.run('DELETE FROM books WHERE id = ?', [id])
      }
      await db.save()
      await fetchBooks()
      return { code: 200, message: 'Deleted' }
    } catch (e) {
      console.error('Failed to batch delete:', e)
      return { code: 500, message: e.message }
    }
  }

  async function batchMove(ids, categoryId) {
    try {
      await db.init()
      const placeholders = ids.map(() => '?').join(',')
      db.run(`UPDATE books SET category_id = ? WHERE id IN (${placeholders})`, [categoryId, ...ids])
      await db.save()
      await fetchBooks()
      return { code: 200, message: 'Moved' }
    } catch (e) {
      console.error('Failed to batch move:', e)
      return { code: 500, message: e.message }
    }
  }

  async function batchExport(ids) {
    try {
      await db.init()
      if (!ids || ids.length === 0) {
        return { code: 400, message: '请选择要导出的书籍' }
      }

      const placeholders = ids.map(() => '?').join(',')
      const exportBooks = db.queryAll(`
        SELECT b.*, c.name as category_name,
               GROUP_CONCAT(DISTINCT t.name) as tag_names,
               n.content as note_content, n.excerpts, n.reflections
        FROM books b
        LEFT JOIN categories c ON b.category_id = c.id
        LEFT JOIN book_tags bt ON b.id = bt.book_id
        LEFT JOIN tags t ON bt.tag_id = t.id
        LEFT JOIN notes n ON b.id = n.book_id
        WHERE b.id IN (${placeholders})
        GROUP BY b.id
      `, ids)

      let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>BNotes 导出</title>
      <style>body{font-family:'Noto Sans SC',sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#333}
      .book{margin-bottom:40px;padding:24px;border:1px solid #ddd;border-radius:8px;page-break-inside:avoid}
      h1{color:#7B8FA1;font-size:22px;margin:0 0 12px}h2{color:#8b7355;font-size:16px;margin-top:16px}
      p{line-height:1.8;white-space:pre-wrap}.meta{color:#999;font-size:13px;margin-bottom:12px}
      .tags span{display:inline-block;padding:2px 8px;background:#f0f0f0;border-radius:10px;font-size:12px;margin-right:4px}
      @media print{body{padding:0}.book{border:1px solid #ccc}}</style></head><body>`

      for (const book of exportBooks) {
        html += `<div class="book"><h1>${escapeHtml(book.title)}</h1>`
        html += `<div class="meta">`
        if (book.author) html += `作者: ${escapeHtml(book.author)} `
        if (book.category_name) html += `| 分类: ${escapeHtml(book.category_name)} `
        const statusMap = { want: '想读', reading: '在读', done: '已读' }
        html += `| 状态: ${statusMap[book.status] || book.status}`
        html += `</div>`
        if (book.tag_names) {
          html += `<div class="tags">${book.tag_names.split(',').map(t => `<span>${escapeHtml(t)}</span>`).join('')}</div>`
        }
        if (book.excerpts) html += `<h2>金句摘录</h2><p>${escapeHtml(book.excerpts)}</p>`
        if (book.reflections) html += `<h2>读后感</h2><p>${escapeHtml(book.reflections)}</p>`
        if (book.note_content) html += `<h2>笔记内容</h2><p>${escapeHtml(book.note_content)}</p>`
        html += `</div>`
      }
      html += `</body></html>`

      const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `BNotes导出-${new Date().toLocaleDateString('zh-CN')}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return { code: 200 }
    } catch (e) {
      console.error('Failed to export:', e)
      return { code: 500, message: e.message }
    }
  }

  function escapeHtml(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
  }

  async function searchBooks(keyword) {
    try {
      await db.init()
      const like = `%${keyword}%`
      const rows = db.queryAll(`
        SELECT b.*, c.name as category_name,
               GROUP_CONCAT(DISTINCT t.id) as tag_ids,
               GROUP_CONCAT(DISTINCT t.name) as tag_names
        FROM books b
        LEFT JOIN categories c ON b.category_id = c.id
        LEFT JOIN book_tags bt ON b.id = bt.book_id
        LEFT JOIN tags t ON bt.tag_id = t.id
        LEFT JOIN notes n ON b.id = n.book_id
        WHERE b.title LIKE ? OR b.author LIKE ? OR n.content LIKE ? OR n.excerpts LIKE ? OR n.reflections LIKE ?
        GROUP BY b.id
        ORDER BY b.updated_at DESC
      `, [like, like, like, like, like])
      return { code: 200, data: rows }
    } catch (e) {
      console.error('Failed to search:', e)
      return { code: 500, message: e.message }
    }
  }

  // ========== Categories ==========

  async function fetchCategories() {
    try {
      await db.init()
      const rows = db.queryAll('SELECT * FROM categories ORDER BY id')
      categories.value = rows
    } catch (e) {
      console.error('Failed to fetch categories:', e)
    }
  }

  async function saveCategory(catData) {
    try {
      await db.init()
      if (catData.id) {
        db.run('UPDATE categories SET name = ? WHERE id = ?', [catData.name, catData.id])
        await db.save()
        await fetchCategories()
        return { code: 200, message: 'Category updated' }
      } else {
        const result = db.run('INSERT INTO categories (name, parent_id) VALUES (?, ?)', [catData.name, catData.parent_id || 0])
        await db.save()
        await fetchCategories()
        return { code: 201, message: 'Category created', data: { id: result.lastInsertRowid } }
      }
    } catch (e) {
      console.error('Failed to save category:', e)
      return { code: 500, message: e.message }
    }
  }

  async function deleteCategory(id) {
    try {
      await db.init()
      const fallback = db.queryOne('SELECT id FROM categories WHERE id != ? ORDER BY id LIMIT 1', [id])
      if (!fallback) {
        return { code: 400, message: '无法删除最后一个分类' }
      }
      db.run('UPDATE books SET category_id = ? WHERE category_id = ?', [fallback.id, id])
      db.run('DELETE FROM categories WHERE id = ?', [id])
      await db.save()
      await fetchCategories()
      return { code: 200, message: 'Category deleted' }
    } catch (e) {
      console.error('Failed to delete category:', e)
      return { code: 500, message: e.message }
    }
  }

  async function fetchCategoryBooks(categoryId) {
    try {
      await db.init()
      const rows = db.queryAll(`
        SELECT b.* FROM books b WHERE b.category_id = ?
      `, [categoryId])
      return { code: 200, data: rows }
    } catch (e) {
      console.error('Failed to fetch category books:', e)
      return { code: 500, message: e.message }
    }
  }

  // ========== Tags ==========

  async function fetchTags() {
    try {
      await db.init()
      const rows = db.queryAll('SELECT * FROM tags ORDER BY id')
      tags.value = rows
    } catch (e) {
      console.error('Failed to fetch tags:', e)
    }
  }

  async function saveTag(tagData) {
    try {
      await db.init()
      if (tagData.id) {
        const fields = []
        const params = []
        const allowedFields = ['name', 'group_name']

        for (const field of allowedFields) {
          if (tagData[field] !== undefined) {
            fields.push(`${field} = ?`)
            params.push(tagData[field])
          }
        }

        if (fields.length > 0) {
          params.push(tagData.id)
          db.run(`UPDATE tags SET ${fields.join(', ')} WHERE id = ?`, params)
        }
        await db.save()
        await fetchTags()
        return { code: 200, message: 'Tag updated' }
      } else {
        const result = db.run('INSERT INTO tags (name, group_name) VALUES (?, ?)', [tagData.name, tagData.group_name || ''])
        await db.save()
        await fetchTags()
        return { code: 201, message: 'Tag created', data: { id: result.lastInsertRowid } }
      }
    } catch (e) {
      if (e.message && e.message.includes('UNIQUE')) {
        return { code: 409, message: '标签已存在' }
      }
      console.error('Failed to save tag:', e)
      return { code: 500, message: e.message }
    }
  }

  async function deleteTag(id) {
    try {
      await db.init()
      db.run('DELETE FROM book_tags WHERE tag_id = ?', [id])
      db.run('DELETE FROM tags WHERE id = ?', [id])
      await db.save()
      await fetchTags()
      return { code: 200, message: 'Tag deleted' }
    } catch (e) {
      console.error('Failed to delete tag:', e)
      return { code: 500, message: e.message }
    }
  }

  async function fetchTagBooks(tagId) {
    try {
      await db.init()
      const rows = db.queryAll(`
        SELECT b.*, c.name as category_name,
               GROUP_CONCAT(DISTINCT t.id) as tag_ids,
               GROUP_CONCAT(DISTINCT t.name) as tag_names
        FROM books b
        LEFT JOIN categories c ON b.category_id = c.id
        JOIN book_tags bt ON b.id = bt.book_id
        LEFT JOIN book_tags bt2 ON b.id = bt2.book_id
        LEFT JOIN tags t ON bt2.tag_id = t.id
        WHERE bt.tag_id = ?
        GROUP BY b.id
        ORDER BY b.updated_at DESC
      `, [tagId])
      return { code: 200, data: rows }
    } catch (e) {
      console.error('Failed to fetch tag books:', e)
      return { code: 500, message: e.message }
    }
  }

  // ========== Other ==========

  function setFilter(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function saveCurrentBook() {
    if (currentBook.value) {
      saveBook(currentBook.value)
    }
  }

  async function submitFeedback(data) {
    try {
      await db.init()
      if (!data.content && !data.image) {
        return { code: 400, message: '文字和图片至少填写一项' }
      }
      db.run('INSERT INTO feedback (type, content, image) VALUES (?, ?, ?)', [data.type || 'bug', data.content || '', data.image || ''])
      await db.save()
      return { code: 201, message: '反馈已提交，感谢！' }
    } catch (e) {
      console.error('Failed to submit feedback:', e)
      return { code: 500, message: e.message }
    }
  }

  async function getSetting(key) {
    try {
      await db.init()
      const setting = db.queryOne('SELECT value FROM settings WHERE key = ?', [key])
      return setting ? setting.value : null
    } catch (e) {
      console.error('Failed to get setting:', e)
      return null
    }
  }

  async function saveSetting(key, value) {
    try {
      await db.init()
      db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, JSON.stringify(value)])
      await db.save()
      return { code: 200, message: 'Setting saved' }
    } catch (e) {
      console.error('Failed to save setting:', e)
      return { code: 500, message: e.message }
    }
  }

  async function exportBnotes(bookIds) {
    try {
      await db.init()
      if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
        return { code: 400, message: '请选择要导出的书籍' }
      }

      const placeholders = bookIds.map(() => '?').join(',')

      const exportBooks = db.queryAll(`
        SELECT b.*, c.name as category_name, c.id as category_id_export,
               GROUP_CONCAT(DISTINCT t.name) as tag_names,
               n.content as note_content, n.excerpts as note_excerpts,
               n.reflections as note_reflections, n.note_date as note_date
        FROM books b
        LEFT JOIN categories c ON b.category_id = c.id
        LEFT JOIN book_tags bt ON b.id = bt.book_id
        LEFT JOIN tags t ON bt.tag_id = t.id
        LEFT JOIN notes n ON b.id = n.book_id
        WHERE b.id IN (${placeholders})
        GROUP BY b.id
        ORDER BY b.updated_at DESC
      `, bookIds)

      // 查询涉及的所有分类
      const categoryIds = [...new Set(exportBooks.map(b => b.category_id_export).filter(Boolean))]
      let exportCategories = []
      if (categoryIds.length > 0) {
        const catPlaceholders = categoryIds.map(() => '?').join(',')
        exportCategories = db.queryAll(`SELECT * FROM categories WHERE id IN (${catPlaceholders})`, categoryIds)
      }

      // 查询涉及的所有标签
      const allTagNames = []
      exportBooks.forEach(b => {
        if (b.tag_names) {
          b.tag_names.split(',').forEach(t => {
            const name = t.trim()
            if (name && !allTagNames.includes(name)) allTagNames.push(name)
          })
        }
      })
      let exportTags = []
      if (allTagNames.length > 0) {
        const tagPlaceholders = allTagNames.map(() => '?').join(',')
        exportTags = db.queryAll(`SELECT * FROM tags WHERE name IN (${tagPlaceholders})`, allTagNames)
      }

      // 组装导出数据
      const exportData = {
        version: '1.4.0',
        type: 'bnotes-export',
        exported_at: new Date().toISOString(),
        books: exportBooks.map(b => ({
          title: b.title,
          author: b.author,
          category_name: b.category_name,
          status: b.status,
          progress: b.progress,
          read_date: b.read_date,
          cover: b.cover || '',
          tags: b.tag_names ? b.tag_names.split(',').map(t => t.trim()).filter(Boolean) : [],
          note: {
            content: b.note_content || '',
            excerpts: b.note_excerpts || '',
            reflections: b.note_reflections || '',
            note_date: b.note_date || null
          }
        })),
        categories: exportCategories.map(c => ({
          name: c.name,
          parent_id: c.parent_id
        })),
        tags: exportTags.map(t => ({
          name: t.name,
          group_name: t.group_name || ''
        }))
      }

      // Pack into ZIP file
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')
      zip.file(`bnotes-export-${dateStr}.json`, JSON.stringify(exportData, null, 2))
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `书记导出-${dateStr}.zip`
      a.click()
      URL.revokeObjectURL(url)
      return { code: 200 }
    } catch (e) {
      console.error('Failed to export bnotes:', e)
      return { code: 500, message: e.message }
    }
  }

  async function importBnotes(data, mode) {
    try {
      await db.init()

      if (!data || data.type !== 'bnotes-export') {
        return { code: 400, message: '无效的 BNotes 导出文件' }
      }

      if (!mode || !['local', 'imported', 'none'].includes(mode)) {
        return { code: 400, message: '无效的导入模式' }
      }

      const importBooks = data.books || []
      const importCategories = data.categories || []
      const importTags = data.tags || []

      // 仅预览模式
      if (mode === 'none') {
        return {
          code: 200,
          data: {
            mode: 'none',
            preview: {
              book_count: importBooks.length,
              category_count: importCategories.length,
              tag_count: importTags.length,
              books: importBooks.map(b => ({ title: b.title, author: b.author }))
            }
          }
        }
      }

      // 获取本地已有书名列表
      const localBooks = db.queryAll('SELECT title FROM books')
      const localTitles = new Set(localBooks.map(b => b.title))

      // 导入分类（按名称去重，不存在则创建）
      const categoryMap = {}
      const existingCategories = db.queryAll('SELECT * FROM categories')
      const existingCategoryNames = new Map(existingCategories.map(c => [c.name, c.id]))

      for (const cat of importCategories) {
        if (existingCategoryNames.has(cat.name)) {
          categoryMap[cat.name] = existingCategoryNames.get(cat.name)
        } else {
          const result = db.run('INSERT INTO categories (name, parent_id) VALUES (?, ?)', [cat.name, cat.parent_id || 0])
          categoryMap[cat.name] = result.lastInsertRowid
          existingCategoryNames.set(cat.name, result.lastInsertRowid)
        }
      }

      // 导入标签（按名称去重，不存在则创建）
      const tagMap = {}
      const existingTags = db.queryAll('SELECT * FROM tags')
      const existingTagNames = new Map(existingTags.map(t => [t.name, t.id]))

      for (const tag of importTags) {
        if (existingTagNames.has(tag.name)) {
          tagMap[tag.name] = existingTagNames.get(tag.name)
        } else {
          db.run('INSERT OR IGNORE INTO tags (name, group_name) VALUES (?, ?)', [tag.name, tag.group_name || ''])
          const tagRow = db.queryOne('SELECT id FROM tags WHERE name = ?', [tag.name])
          tagMap[tag.name] = tagRow ? tagRow.id : null
          if (tagMap[tag.name]) {
            existingTagNames.set(tag.name, tagMap[tag.name])
          }
        }
      }

      let imported = 0
      let skipped = 0
      let renamed = 0

      for (const book of importBooks) {
        const titleExists = localTitles.has(book.title)

        if (mode === 'local' && titleExists) {
          skipped++
          continue
        }

        let finalTitle = book.title
        if (mode === 'imported' && titleExists) {
          finalTitle = `${book.title} (导入)`
          let suffix = 1
          while (localTitles.has(finalTitle)) {
            finalTitle = `${book.title} (导入${suffix})`
            suffix++
          }
          renamed++
        }

        // 查找分类 ID
        let categoryId = 1
        if (book.category_name && categoryMap[book.category_name]) {
          categoryId = categoryMap[book.category_name]
        }

        // 创建书籍
        const result = db.run(`
          INSERT INTO books (title, author, category_id, status, progress, read_date, cover)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [finalTitle, book.author || '', categoryId, book.status || 'want', book.progress || 0, book.read_date || null, book.cover || ''])

        const bookId = result.lastInsertRowid
        localTitles.add(finalTitle)

        // 创建笔记
        if (book.note) {
          db.run(`
            INSERT INTO notes (book_id, content, excerpts, reflections, note_date)
            VALUES (?, ?, ?, ?, ?)
          `, [bookId, book.note.content || '', book.note.excerpts || '', book.note.reflections || '', book.note.note_date || null])
        } else {
          db.run('INSERT INTO notes (book_id) VALUES (?)', [bookId])
        }

        // 关联标签
        if (book.tags && Array.isArray(book.tags)) {
          for (const tagName of book.tags) {
            const name = (tagName || '').trim()
            if (!name) continue
            const tagId = tagMap[name]
            if (tagId) {
              db.run('INSERT OR IGNORE INTO book_tags (book_id, tag_id) VALUES (?, ?)', [bookId, tagId])
            }
          }
        }

        imported++
      }

      await db.save()
      await fetchBooks()
      await fetchCategories()
      await fetchTags()

      return {
        code: 200,
        data: {
          mode,
          imported,
          skipped,
          renamed,
          total: importBooks.length
        }
      }
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
