const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const { initDatabase, queryAll, queryOne, run } = require('./database')

const app = express()
const PORT = process.env.BNOTES_PORT || 18765

app.use(cors())
app.use(express.json())

// 静态文件服务（生产环境提供前端页面）
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))

// ========== 书籍 API ==========

app.get('/api/books', (_req, res) => {
  try {
    const books = queryAll(`
      SELECT b.*, c.name as category_name,
             GROUP_CONCAT(DISTINCT t.name) as tags,
             GROUP_CONCAT(DISTINCT t.id) as tag_ids,
             n.content, n.excerpts, n.reflections, n.note_date
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN book_tags bt ON b.id = bt.book_id
      LEFT JOIN tags t ON bt.tag_id = t.id
      LEFT JOIN notes n ON b.id = n.book_id
      GROUP BY b.id
      ORDER BY b.updated_at DESC
    `)
    res.json({ code: 200, data: books })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

app.get('/api/books/:id', (req, res) => {
  try {
    const book = queryOne(`
      SELECT b.*, c.name as category_name,
             GROUP_CONCAT(DISTINCT t.name) as tags,
             GROUP_CONCAT(DISTINCT t.id) as tag_ids
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN book_tags bt ON b.id = bt.book_id
      LEFT JOIN tags t ON bt.tag_id = t.id
      WHERE b.id = ?
      GROUP BY b.id
    `, [req.params.id])

    if (!book) {
      return res.json({ code: 404, message: 'Book not found' })
    }

    const note = queryOne('SELECT * FROM notes WHERE book_id = ?', [req.params.id])
    book.note = note || null

    if (note) {
      book.links = queryAll(`
        SELECT nl.*, b.title as target_book_title
        FROM note_links nl
        JOIN books b ON nl.target_book_id = b.id
        WHERE nl.source_note_id = ?
      `, [note.id])
    } else {
      book.links = []
    }

    res.json({ code: 200, data: book })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

function checkTitleExists(title, excludeId) {
  if (excludeId) {
    return queryOne('SELECT id FROM books WHERE title = ? AND id != ?', [title, excludeId]) !== null
  }
  return queryOne('SELECT id FROM books WHERE title = ?', [title]) !== null
}

app.post('/api/books', (req, res) => {
  try {
    const data = req.body
    if (checkTitleExists(data.title || '')) {
      return res.json({ code: 409, message: '书名已存在' })
    }

    const result = run(`
      INSERT INTO books (title, author, category_id, status, progress, read_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [data.title || '', data.author || '', data.category_id || 1, data.status || 'want', data.progress || 0, data.read_date || null])

    const bookId = result.lastInsertRowid
    run('INSERT INTO notes (book_id) VALUES (?)', [bookId])

    if (data.tags && data.tags.length > 0) {
      saveTags(bookId, data.tags)
    }

    res.json({ code: 201, message: 'Book created', data: { id: bookId } })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

app.put('/api/books/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const data = req.body

    if (data.title && checkTitleExists(data.title, id)) {
      return res.json({ code: 409, message: '书名已存在' })
    }

    const fields = []
    const params = []
    const allowedFields = ['title', 'author', 'category_id', 'status', 'progress', 'read_date', 'cover']

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`)
        params.push(data[field])
      }
    }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP')
      params.push(id)
      run(`UPDATE books SET ${fields.join(', ')} WHERE id = ?`, params)
    }

    if (data.tags !== undefined) {
      run('DELETE FROM book_tags WHERE book_id = ?', [id])
      saveTags(id, data.tags)
    }

    if (data.note) {
      const noteData = data.note
      const noteFields = []
      const noteParams = []
      const allowedNoteFields = ['content', 'excerpts', 'reflections', 'note_date']

      for (const field of allowedNoteFields) {
        if (noteData[field] !== undefined) {
          noteFields.push(`${field} = ?`)
          noteParams.push(noteData[field])
        }
      }

      if (noteFields.length > 0) {
        noteFields.push('updated_at = CURRENT_TIMESTAMP')
        noteParams.push(id)
        run(`UPDATE notes SET ${noteFields.join(', ')} WHERE book_id = ?`, noteParams)
      }
    }

    if (data.links !== undefined) {
      run('DELETE FROM note_links WHERE source_note_id = (SELECT id FROM notes WHERE book_id = ?)', [id])
      for (const link of data.links) {
        run(`INSERT INTO note_links (source_note_id, target_book_id, keyword)
          VALUES ((SELECT id FROM notes WHERE book_id = ?), ?, ?)`, [id, link.target_book_id, link.keyword || ''])
      }
    }

    res.json({ code: 200, message: 'Book updated' })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

app.delete('/api/books/:id', (req, res) => {
  try {
    run('DELETE FROM books WHERE id = ?', [req.params.id])
    res.json({ code: 200, message: 'Book deleted' })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

function saveTags(bookId, tags) {
  for (const tagName of tags) {
    const name = (tagName || '').trim()
    if (!name) continue
    run('INSERT OR IGNORE INTO tags (name) VALUES (?)', [name])
    const tag = queryOne('SELECT id FROM tags WHERE name = ?', [name])
    if (tag) {
      run('INSERT OR IGNORE INTO book_tags (book_id, tag_id) VALUES (?, ?)', [bookId, tag.id])
    }
  }
}

// ========== 笔记 API ==========

app.get('/api/notes', (req, res) => {
  try {
    const bookId = req.query.book_id
    if (bookId) {
      const note = queryOne('SELECT * FROM notes WHERE book_id = ?', [bookId])
      return res.json({ code: 200, data: note })
    }
    const notes = queryAll(`
      SELECT n.*, b.title as book_title, b.author as book_author
      FROM notes n
      JOIN books b ON n.book_id = b.id
      ORDER BY n.updated_at DESC
    `)
    res.json({ code: 200, data: notes })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

app.get('/api/notes/:id', (req, res) => {
  try {
    const note = queryOne(`
      SELECT n.*, b.title as book_title, b.author as book_author
      FROM notes n
      JOIN books b ON n.book_id = b.id
      WHERE n.id = ?
    `, [req.params.id])
    res.json(note ? { code: 200, data: note } : { code: 404, message: 'Note not found' })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

app.post('/api/notes', (req, res) => {
  try {
    const data = req.body
    const result = run(`
      INSERT INTO notes (book_id, content, excerpts, reflections, note_date)
      VALUES (?, ?, ?, ?, ?)
    `, [data.book_id, data.content || '', data.excerpts || '', data.reflections || '', data.note_date || null])
    res.json({ code: 201, message: 'Note created', data: { id: result.lastInsertRowid } })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

app.put('/api/notes/:id', (req, res) => {
  try {
    const data = req.body
    const fields = []
    const params = []
    const allowedFields = ['content', 'excerpts', 'reflections', 'note_date']

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`)
        params.push(data[field])
      }
    }

    if (fields.length === 0) {
      return res.json({ code: 400, message: 'No fields to update' })
    }

    fields.push('updated_at = CURRENT_TIMESTAMP')
    params.push(req.params.id)
    run(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`, params)
    res.json({ code: 200, message: 'Note updated' })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

app.delete('/api/notes/:id', (req, res) => {
  try {
    run('DELETE FROM notes WHERE id = ?', [req.params.id])
    res.json({ code: 200, message: 'Note deleted' })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

// ========== 分类 API ==========

app.get('/api/categories', (_req, res) => {
  try {
    res.json({ code: 200, data: queryAll('SELECT * FROM categories ORDER BY id') })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

app.post('/api/categories', (req, res) => {
  try {
    const result = run('INSERT INTO categories (name, parent_id) VALUES (?, ?)', [req.body.name, req.body.parent_id || 0])
    res.json({ code: 201, message: 'Category created', data: { id: result.lastInsertRowid } })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

app.put('/api/categories/:id', (req, res) => {
  try {
    run('UPDATE categories SET name = ? WHERE id = ?', [req.body.name, req.params.id])
    res.json({ code: 200, message: 'Category updated' })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

app.delete('/api/categories/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const fallback = queryOne('SELECT id FROM categories WHERE id != ? ORDER BY id LIMIT 1', [id])
    if (!fallback) {
      return res.json({ code: 400, message: '无法删除最后一个分类' })
    }
    run('UPDATE books SET category_id = ? WHERE category_id = ?', [fallback.id, id])
    run('DELETE FROM categories WHERE id = ?', [id])
    res.json({ code: 200, message: 'Category deleted' })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

app.get('/api/categories/:id/books', (req, res) => {
  try {
    const books = queryAll(`
      SELECT b.*, c.name as category_name,
             GROUP_CONCAT(DISTINCT t.name) as tags
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN book_tags bt ON b.id = bt.book_id
      LEFT JOIN tags t ON bt.tag_id = t.id
      WHERE b.category_id = ?
      GROUP BY b.id
      ORDER BY b.updated_at DESC
    `, [req.params.id])
    res.json({ code: 200, data: books })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

// ========== 标签 API ==========

app.get('/api/tags', (_req, res) => {
  try {
    res.json({ code: 200, data: queryAll('SELECT * FROM tags ORDER BY id') })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

app.post('/api/tags', (req, res) => {
  try {
    const result = run('INSERT INTO tags (name, group_name) VALUES (?, ?)', [req.body.name, req.body.group_name || ''])
    res.json({ code: 201, message: 'Tag created', data: { id: result.lastInsertRowid } })
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.json({ code: 409, message: '标签已存在' })
    }
    res.json({ code: 500, message: e.message })
  }
})

app.put('/api/tags/:id', (req, res) => {
  try {
    const data = req.body
    const fields = []
    const params = []
    const allowedFields = ['name', 'group_name']

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`)
        params.push(data[field])
      }
    }

    if (fields.length > 0) {
      params.push(req.params.id)
      run(`UPDATE tags SET ${fields.join(', ')} WHERE id = ?`, params)
    }
    res.json({ code: 200, message: 'Tag updated' })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

app.delete('/api/tags/:id', (req, res) => {
  try {
    run('DELETE FROM tags WHERE id = ?', [req.params.id])
    res.json({ code: 200, message: 'Tag deleted' })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

app.get('/api/tags/:id/books', (req, res) => {
  try {
    const books = queryAll(`
      SELECT b.*, c.name as category_name,
             GROUP_CONCAT(DISTINCT t.name) as tags
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      JOIN book_tags bt ON b.id = bt.book_id
      LEFT JOIN tags t2 ON bt.tag_id = t2.id
      LEFT JOIN book_tags bt2 ON b.id = bt2.book_id
      LEFT JOIN tags t ON bt2.tag_id = t.id
      WHERE bt.tag_id = ?
      GROUP BY b.id
      ORDER BY b.updated_at DESC
    `, [req.params.id])
    res.json({ code: 200, data: books })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

// ========== 反馈 API ==========

app.post('/api/feedback', (req, res) => {
  try {
    const { type, content, image } = req.body
    if (!content && !image) {
      return res.json({ code: 400, message: '文字和图片至少填写一项' })
    }
    run('INSERT INTO feedback (type, content, image) VALUES (?, ?, ?)', [type || 'bug', content || '', image || ''])
    res.json({ code: 201, message: '反馈已提交，感谢！' })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

// ========== 设置 API ==========

app.get('/api/settings/:key', (req, res) => {
  try {
    const setting = queryOne('SELECT * FROM settings WHERE key = ?', [req.params.key])
    res.json({ code: 200, data: setting ? setting.value : null })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

app.put('/api/settings/:key', (req, res) => {
  try {
    run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [req.params.key, JSON.stringify(req.body.value)])
    res.json({ code: 200, message: 'Setting saved' })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

// ========== 健康检查 API ==========

app.get('/api/health', (_req, res) => {
  res.json({ code: 200, message: 'ok', timestamp: Date.now() })
})

// ========== 搜索 API ==========

app.get('/api/search', (req, res) => {
  try {
    const keyword = req.query.keyword || ''
    const like = `%${keyword}%`
    const books = queryAll(`
      SELECT b.*, c.name as category_name,
             GROUP_CONCAT(DISTINCT t.name) as tags
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN book_tags bt ON b.id = bt.book_id
      LEFT JOIN tags t ON bt.tag_id = t.id
      LEFT JOIN notes n ON b.id = n.book_id
      WHERE b.title LIKE ? OR b.author LIKE ? OR n.content LIKE ? OR n.excerpts LIKE ?
      GROUP BY b.id
      ORDER BY b.updated_at DESC
    `, [like, like, like, like])
    res.json({ code: 200, data: books })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

// ========== 批量操作 API ==========

app.post('/api/batch/delete', (req, res) => {
  try {
    const { ids, type } = req.body
    const placeholders = ids.map(() => '?').join(',')
    if (type === 'books') {
      run(`DELETE FROM books WHERE id IN (${placeholders})`, ids)
    } else {
      run(`DELETE FROM notes WHERE id IN (${placeholders})`, ids)
    }
    res.json({ code: 200, message: 'Deleted' })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

app.post('/api/batch/move', (req, res) => {
  try {
    const { ids, category_id } = req.body
    const placeholders = ids.map(() => '?').join(',')
    run(`UPDATE books SET category_id = ? WHERE id IN (${placeholders})`, [category_id, ...ids])
    res.json({ code: 200, message: 'Moved' })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

// ========== 导出 API ==========

app.post('/api/export/html', (req, res) => {
  try {
    const { book_ids } = req.body
    if (!book_ids || book_ids.length === 0) {
      return res.json({ code: 400, message: '请选择要导出的书籍' })
    }
    const placeholders = book_ids.map(() => '?').join(',')
    const books = queryAll(`
      SELECT b.*, c.name as category_name,
             GROUP_CONCAT(DISTINCT t.name) as tags,
             n.content, n.excerpts, n.reflections
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN book_tags bt ON b.id = bt.book_id
      LEFT JOIN tags t ON bt.tag_id = t.id
      LEFT JOIN notes n ON b.id = n.book_id
      WHERE b.id IN (${placeholders})
      GROUP BY b.id
    `, book_ids)

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>BNotes 导出</title>
    <style>body{font-family:'Noto Sans SC',sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#333}
    .book{margin-bottom:40px;padding:24px;border:1px solid #ddd;border-radius:8px;page-break-inside:avoid}
    h1{color:#7B8FA1;font-size:22px;margin:0 0 12px}h2{color:#8b7355;font-size:16px;margin-top:16px}
    p{line-height:1.8;white-space:pre-wrap}.meta{color:#999;font-size:13px;margin-bottom:12px}
    .tags span{display:inline-block;padding:2px 8px;background:#f0f0f0;border-radius:10px;font-size:12px;margin-right:4px}
    @media print{body{padding:0}.book{border:1px solid #ccc}}</style></head><body>`

    for (const book of books) {
      html += `<div class="book"><h1>${book.title}</h1>`
      html += `<div class="meta">`
      if (book.author) html += `作者: ${book.author} `
      if (book.category_name) html += `| 分类: ${book.category_name} `
      const statusMap = { want: '想读', reading: '在读', done: '已读' }
      html += `| 状态: ${statusMap[book.status] || book.status}`
      html += `</div>`
      if (book.tags) {
        html += `<div class="tags">${book.tags.split(',').map(t => `<span>${t}</span>`).join('')}</div>`
      }
      if (book.excerpts) html += `<h2>金句摘录</h2><p>${escapeHtml(book.excerpts)}</p>`
      if (book.reflections) html += `<h2>读后感</h2><p>${escapeHtml(book.reflections)}</p>`
      if (book.content) html += `<h2>笔记内容</h2><p>${escapeHtml(book.content)}</p>`
      html += `</div>`
    }
    html += `</body></html>`

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
}

app.use('/exports', express.static(process.env.BNOTES_EXPORTS_DIR || path.join(__dirname, '..', 'exports')))

// ========== BNotes 导出/导入 API ==========

app.post('/api/export/bnotes', (req, res) => {
  try {
    const { book_ids } = req.body
    if (!book_ids || !Array.isArray(book_ids) || book_ids.length === 0) {
      return res.json({ code: 400, message: '请选择要导出的书籍' })
    }

    const placeholders = book_ids.map(() => '?').join(',')

    // 查询书籍及其笔记、标签信息
    const books = queryAll(`
      SELECT b.*, c.name as category_name, c.id as category_id_export,
             GROUP_CONCAT(DISTINCT t.name) as tags,
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
    `, book_ids)

    // 查询涉及的所有分类
    const categoryIds = [...new Set(books.map(b => b.category_id_export).filter(Boolean))]
    let exportCategories = []
    if (categoryIds.length > 0) {
      const catPlaceholders = categoryIds.map(() => '?').join(',')
      exportCategories = queryAll(`SELECT * FROM categories WHERE id IN (${catPlaceholders})`, categoryIds)
    }

    // 查询涉及的所有标签
    const allTagNames = []
    books.forEach(b => {
      if (b.tags) {
        b.tags.split(',').forEach(t => {
          const name = t.trim()
          if (name && !allTagNames.includes(name)) allTagNames.push(name)
        })
      }
    })
    let exportTags = []
    if (allTagNames.length > 0) {
      const tagPlaceholders = allTagNames.map(() => '?').join(',')
      exportTags = queryAll(`SELECT * FROM tags WHERE name IN (${tagPlaceholders})`, allTagNames)
    }

    // 组装导出数据
    const exportData = {
      version: '1.3.0',
      type: 'bnotes-export',
      exported_at: new Date().toISOString(),
      books: books.map(b => ({
        title: b.title,
        author: b.author,
        category_name: b.category_name,
        status: b.status,
        progress: b.progress,
        read_date: b.read_date,
        cover: b.cover || '',
        tags: b.tags ? b.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
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

    const filename = `bnotes-export-${Date.now()}.json`
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    res.json(exportData)
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

app.post('/api/import/bnotes', (req, res) => {
  try {
    const { data, mode } = req.body

    if (!data || data.type !== 'bnotes-export') {
      return res.json({ code: 400, message: '无效的 BNotes 导出文件' })
    }

    if (!mode || !['local', 'imported', 'none'].includes(mode)) {
      return res.json({ code: 400, message: '无效的导入模式' })
    }

    const importBooks = data.books || []
    const importCategories = data.categories || []
    const importTags = data.tags || []

    // 仅预览模式
    if (mode === 'none') {
      return res.json({
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
      })
    }

    // 获取本地已有书名列表
    const localBooks = queryAll('SELECT title FROM books')
    const localTitles = new Set(localBooks.map(b => b.title))

    // 导入分类（按名称去重，不存在则创建）
    const categoryMap = {}
    const existingCategories = queryAll('SELECT * FROM categories')
    const existingCategoryNames = new Map(existingCategories.map(c => [c.name, c.id]))

    for (const cat of importCategories) {
      if (existingCategoryNames.has(cat.name)) {
        categoryMap[cat.name] = existingCategoryNames.get(cat.name)
      } else {
        const result = run('INSERT INTO categories (name, parent_id) VALUES (?, ?)', [cat.name, cat.parent_id || 0])
        categoryMap[cat.name] = result.lastInsertRowid
        existingCategoryNames.set(cat.name, result.lastInsertRowid)
      }
    }

    // 导入标签（按名称去重，不存在则创建）
    const tagMap = {}
    const existingTags = queryAll('SELECT * FROM tags')
    const existingTagNames = new Map(existingTags.map(t => [t.name, t.id]))

    for (const tag of importTags) {
      if (existingTagNames.has(tag.name)) {
        tagMap[tag.name] = existingTagNames.get(tag.name)
      } else {
        const result = run('INSERT OR IGNORE INTO tags (name, group_name) VALUES (?, ?)', [tag.name, tag.group_name || ''])
        const tagRow = queryOne('SELECT id FROM tags WHERE name = ?', [tag.name])
        tagMap[tag.name] = tagRow ? tagRow.id : result.lastInsertRowid
        existingTagNames.set(tag.name, tagMap[tag.name])
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
        // 确保重命名后也不重复
        let suffix = 1
        while (localTitles.has(finalTitle)) {
          finalTitle = `${book.title} (导入${suffix})`
          suffix++
        }
        renamed++
      }

      // 查找分类 ID
      let categoryId = 1 // 默认"未分类"
      if (book.category_name && categoryMap[book.category_name]) {
        categoryId = categoryMap[book.category_name]
      }

      // 创建书籍
      const result = run(`
        INSERT INTO books (title, author, category_id, status, progress, read_date, cover)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [finalTitle, book.author || '', categoryId, book.status || 'want', book.progress || 0, book.read_date || null, book.cover || ''])

      const bookId = result.lastInsertRowid
      localTitles.add(finalTitle)

      // 创建笔记
      if (book.note) {
        run(`
          INSERT INTO notes (book_id, content, excerpts, reflections, note_date)
          VALUES (?, ?, ?, ?, ?)
        `, [bookId, book.note.content || '', book.note.excerpts || '', book.note.reflections || '', book.note.note_date || null])
      } else {
        run('INSERT INTO notes (book_id) VALUES (?)', [bookId])
      }

      // 关联标签
      if (book.tags && Array.isArray(book.tags)) {
        for (const tagName of book.tags) {
          const name = (tagName || '').trim()
          if (!name) continue
          const tagId = tagMap[name]
          if (tagId) {
            run('INSERT OR IGNORE INTO book_tags (book_id, tag_id) VALUES (?, ?)', [bookId, tagId])
          }
        }
      }

      imported++
    }

    res.json({
      code: 200,
      data: {
        mode,
        imported,
        skipped,
        renamed,
        total: importBooks.length
      }
    })
  } catch (e) {
    res.json({ code: 500, message: e.message })
  }
})

// SPA 回退
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'))
  }
})

// 启动服务器
async function start() {
  await initDatabase()

  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      console.log(`[BNotes] 后端服务已启动: http://localhost:${PORT}`)
      resolve(server)
    })

    server.on('error', (err) => {
      console.error('[BNotes] 服务器错误:', err)
      reject(err)
    })
  })
}

// 仅在直接运行时自动启动（被 require 时不自动启动）
if (require.main === module) {
  start().catch(err => {
    console.error('[BNotes] 启动失败:', err)
    process.exit(1)
  })
}

module.exports = { start, app }
