// 使用 Canvas 绘制中文笔记，再转成 PDF。
// 这样不依赖 PDF 内置字体，中文不会乱码；安卓端生成后可分享/保存。

const PAGE_W = 1240 // A4 @150dpi
const PAGE_H = 1754
const MARGIN = 80
const CONTENT_W = PAGE_W - MARGIN * 2
const FONT_FAMILY = '"Noto Sans SC", "Microsoft YaHei", "PingFang SC", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'

const STATUS_MAP = { want: '想读', reading: '在读', done: '已读' }

function stripMarkdown(text) {
  return String(text || '')
    .replace(/```[^\n]*\n?/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^>\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

function wrapLines(ctx, text, maxWidth) {
  const result = []
  const paragraphs = stripMarkdown(text).split('\n')
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      result.push('')
      continue
    }
    let line = ''
    for (const char of paragraph) {
      const next = line + char
      if (ctx.measureText(next).width > maxWidth && line) {
        result.push(line)
        line = char
      } else {
        line = next
      }
    }
    if (line) result.push(line)
  }
  return result
}

function buildLayout(ctx, books) {
  const ops = []
  let y = MARGIN

  const addText = (text, font, color, lineHeight, maxWidth = CONTENT_W, x = MARGIN) => {
    ctx.font = font
    const lines = wrapLines(ctx, text, maxWidth)
    for (const line of lines) {
      ops.push({ text: line, font, color, x, y })
      y += lineHeight
    }
  }

  books.forEach((book, index) => {
    if (index > 0) y += 30

    addText(book.title || '未命名书籍', `bold 44px ${FONT_FAMILY}`, '#2f2f2f', 58)

    const meta = []
    if (book.author) meta.push(`作者：${book.author}`)
    if (book.category_name) meta.push(`分类：${book.category_name}`)
    if (book.progress != null && book.status === 'reading') meta.push(`进度：${book.progress}%`)
    meta.push(`状态：${STATUS_MAP[book.status] || book.status || '想读'}`)
    addText(meta.join('    '), `26px ${FONT_FAMILY}`, '#8a8a8a', 40)

    const tags = (book.tags || book.tag_names || '')
      .toString()
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    if (tags.length) {
      addText(`标签：${tags.join('、')}`, `24px ${FONT_FAMILY}`, '#9a8f80', 36)
    }
    y += 24

    const note = book.note || book
    const sections = [
      { title: '金句摘录', content: note.excerpts },
      { title: '读后感', content: note.reflections },
      { title: '笔记内容', content: note.content }
    ]

    let hasContent = false
    for (const section of sections) {
      if (!section.content || !String(section.content).trim()) continue
      hasContent = true
      addText(section.title, `bold 32px ${FONT_FAMILY}`, '#7B8FA1', 46)
      addText(section.content, `28px ${FONT_FAMILY}`, '#3a3a3a', 46)
      y += 26
    }

    if (!hasContent) {
      addText('（暂无笔记内容）', `26px ${FONT_FAMILY}`, '#aaaaaa', 40)
      y += 20
    }

    if (index < books.length - 1) {
      ops.push({ line: true, y, color: '#e3e3e3' })
      y += 26
    }
  })

  return { ops, height: y + MARGIN }
}

function drawOps(ctx, ops) {
  ctx.textBaseline = 'top'
  for (const op of ops) {
    if (op.line) {
      ctx.strokeStyle = op.color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(MARGIN, op.y)
      ctx.lineTo(PAGE_W - MARGIN, op.y)
      ctx.stroke()
      continue
    }
    ctx.font = op.font
    ctx.fillStyle = op.color
    ctx.fillText(op.text, op.x, op.y)
  }
}

async function renderPageCanvases(books) {
  // 先在不落盘的画布上测量并排版
  const measureCanvas = document.createElement('canvas')
  measureCanvas.width = PAGE_W
  measureCanvas.height = 100
  const measureCtx = measureCanvas.getContext('2d')
  const { ops, height } = buildLayout(measureCtx, books)

  // 按页裁剪绘制，避免超出画布高度导致后续页面空白或内容丢失
  const pageCount = Math.max(1, Math.ceil(height / PAGE_H))
  const result = []
  for (let i = 0; i < pageCount; i++) {
    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = PAGE_W
    pageCanvas.height = PAGE_H
    const ctx = pageCanvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, PAGE_W, PAGE_H)
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, PAGE_W, PAGE_H)
    ctx.clip()
    ctx.translate(0, -i * PAGE_H)
    drawOps(ctx, ops)
    ctx.restore()
    result.push(pageCanvas)
  }
  return result
}

function isNativePlatform() {
  const cap = window.Capacitor
  return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform())
}

async function savePdf(doc, filename) {
  if (isNativePlatform()) {
    const native = window.__bnotesNative
    const Filesystem = native?.Filesystem || window.Capacitor.Plugins?.Filesystem
    const Share = native?.Share || window.Capacitor.Plugins?.Share
    if (Filesystem && Share) {
      const dataUrl = doc.output('datauristring')
      const base64 = dataUrl.substring(dataUrl.indexOf(',') + 1)
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: 'CACHE'
      })
      await Share.share({ title: filename, files: [result.uri] })
      return { shared: true }
    }
  }

  doc.save(filename)
  return { shared: false }
}

export async function exportBooksToPdf(books) {
  if (!books || books.length === 0) {
    return { code: 400, message: '请选择要导出的书籍' }
  }

  const { jsPDF } = await import('jspdf')
  const pages = await renderPageCanvases(books)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  pages.forEach((canvas, index) => {
    if (index > 0) doc.addPage()
    doc.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 210, 297)
  })

  const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')
  const filename = `书记笔记-${dateStr}.pdf`

  try {
    const saved = await savePdf(doc, filename)
    return { code: 200, data: { filename, ...saved } }
  } catch (e) {
    console.error('Failed to save PDF:', e)
    return { code: 500, message: e.message || '保存 PDF 失败' }
  }
}
