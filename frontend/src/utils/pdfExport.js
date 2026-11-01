// 使用 Canvas 绘制中文笔记，再转成 PDF。
// Markdown 按「预览模式」的样式渲染（标题 / 加粗 / 列表 / 引用 / 代码块 / 分隔线），
// 而非编辑器里的原文；排版阶段按页断行，内容不会被页边界从中间截断。
// 这样不依赖 PDF 内置字体，中文不会乱码；安卓端生成后可分享/保存。

const PAGE_W = 1240 // A4 @150dpi
const PAGE_H = 1754
const MARGIN = 80
const CONTENT_W = PAGE_W - MARGIN * 2
const FONT_FAMILY = '"Noto Sans SC", "Microsoft YaHei", "PingFang SC", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
const CODE_FONT = '"Consolas", "Courier New", monospace'

const STATUS_MAP = { want: '想读', reading: '在读', done: '已读' }

// ---------- 行内 Markdown：**加粗** 与 `代码` ----------

function parseInline(text) {
  const runs = []
  const regex = /(\*\*([^*]+)\*\*)|(`([^`]+)`)/g
  let last = 0
  let m
  while ((m = regex.exec(text))) {
    if (m.index > last) runs.push({ text: text.slice(last, m.index) })
    if (m[2] !== undefined) runs.push({ text: m[2], bold: true })
    else runs.push({ text: m[4], code: true })
    last = m.index + m[0].length
  }
  if (last < text.length) runs.push({ text: text.slice(last) })
  return runs
}

function fontFor(base, run) {
  if (run.code) {
    const size = parseInt(base.match(/(\d+)px/)[1], 10)
    return `${Math.round(size * 0.9)}px ${CODE_FONT}`
  }
  if (run.bold && !base.startsWith('bold ')) return 'bold ' + base
  return base
}

// 将混排样式的行内容按宽度折行，输出每行的 run 列表（同字体的相邻字符合并）
function wrapStyled(ctx, runs, baseFont, maxWidth) {
  const lines = []
  let current = []
  let w = 0
  const pushLine = () => {
    if (!current.length) return
    const merged = []
    for (const item of current) {
      const lastRun = merged[merged.length - 1]
      if (lastRun && lastRun.font === item.font) lastRun.text += item.ch
      else merged.push({ text: item.ch, font: item.font })
    }
    lines.push(merged)
    current = []
    w = 0
  }
  for (const run of runs) {
    const font = fontFor(baseFont, run)
    ctx.font = font
    for (const ch of run.text) {
      const cw = ctx.measureText(ch).width
      if (w + cw > maxWidth && current.length) pushLine()
      current.push({ ch, font })
      w += cw
    }
  }
  pushLine()
  return lines
}

// 纯文本折行（书名、元信息等无样式文本用）
function wrapLines(ctx, text, maxWidth) {
  const result = []
  const paragraphs = String(text || '').split('\n')
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
  const CONTENT_BOTTOM = PAGE_H - MARGIN
  let page = 0
  let y = MARGIN

  // keep：标题类内容需要与后续正文保持的最小空间，不足则整体换页，避免孤行
  const newPage = () => { page += 1; y = MARGIN }
  // 空间不足时换页（用于分隔线、代码行等不可拆元素）
  const ensureSpace = (h) => { if (y + h > CONTENT_BOTTOM) newPage() }

  const addText = (text, font, color, lineHeight, maxWidth = CONTENT_W, x = MARGIN, keep = 0) => {
    ctx.font = font
    const lines = wrapLines(ctx, text, maxWidth)
    for (let i = 0; i < lines.length; i++) {
      const need = lineHeight + (i === 0 ? keep : 0)
      if (y + need > CONTENT_BOTTOM) newPage()
      ops.push({ text: lines[i], font, color, x, y, page })
      y += lineHeight
    }
  }

  // 混排样式文本：runs 含加粗/代码字体；opts.h 为行高（引用条用），opts.barMark 画左侧引用竖条
  const addRich = (text, font, color, lineHeight, x = MARGIN, keep = 0, opts = {}) => {
    const runs = parseInline(text)
    const lines = wrapStyled(ctx, runs, font, CONTENT_W - (x - MARGIN))
    for (let i = 0; i < lines.length; i++) {
      const need = lineHeight + (i === 0 ? keep : 0)
      if (y + need > CONTENT_BOTTOM) newPage()
      ops.push({ runs: lines[i], color, x, y, page, h: lineHeight, barMark: opts.barMark })
      y += lineHeight
    }
  }

  // 列表项：悬挂缩进，标记符与正文分列
  const addListItem = (content, marker, font, color, lineHeight) => {
    ensureSpace(lineHeight)
    ctx.font = font
    ops.push({ text: marker, font, color, x: MARGIN + 6, y, page })
    addRich(content, font, color, lineHeight, MARGIN + 36)
  }

  // Markdown 块级渲染：标题/列表/引用/代码块/分隔线，单换行即换行（与预览 breaks:true 一致）
  const addMarkdown = (raw, baseFont, baseColor, baseLineHeight) => {
    const lines = String(raw || '').split('\n')
    let inCode = false

    for (const rawLine of lines) {
      const line = rawLine.replace(/\s+$/, '')

      if (/^\s*```/.test(line)) {
        inCode = !inCode
        continue
      }
      if (inCode) {
        const lh = Math.round(baseLineHeight * 0.9)
        ensureSpace(lh)
        const codeFont = `${Math.round(parseInt(baseFont.match(/(\d+)px/)[1], 10) * 0.82)}px ${CODE_FONT}`
        ops.push({ rectbg: true, x: MARGIN, y, w: CONTENT_W, h: lh, page, color: '#f2f2f0' })
        ops.push({ text: line || ' ', font: codeFont, color: '#4a4a4a', x: MARGIN + 12, y, page })
        y += lh
        continue
      }

      // 标题
      const heading = line.match(/^(#{1,6})\s+(.*)/)
      if (heading && heading[2].trim()) {
        const level = heading[1].length
        const size = level === 1 ? 36 : level === 2 ? 32 : 28
        addRich(heading[2].trim(), `bold ${size}px ${FONT_FAMILY}`, '#7B8FA1', Math.round(size * 1.5), MARGIN, 100)
        continue
      }

      // 分隔线
      if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
        ensureSpace(44)
        ops.push({ line: true, y, color: '#d8d8d8', page })
        y += 44
        continue
      }

      // 引用块：左侧竖条 + 灰字缩进
      const quote = line.match(/^\s*>\s?(.*)/)
      if (quote && quote[1].trim()) {
        addRich(quote[1], `26px ${FONT_FAMILY}`, '#6a6a6a', 44, MARGIN + 20, 20, { barMark: true })
        continue
      }

      // 无序列表
      const li = line.match(/^\s*[-*+]\s+(.*)/)
      if (li && li[1].trim()) {
        addListItem(li[1], '•', baseFont, baseColor, baseLineHeight)
        continue
      }

      // 有序列表
      const ol = line.match(/^\s*(\d+)[.、]\s+(.*)/)
      if (ol && ol[2].trim()) {
        addListItem(ol[2], `${ol[1]}.`, baseFont, baseColor, baseLineHeight)
        continue
      }

      // 空行留白
      if (!line.trim()) {
        y += Math.round(baseLineHeight * 0.5)
        continue
      }

      // 普通段落
      addRich(line, baseFont, baseColor, baseLineHeight, MARGIN)
    }
  }

  books.forEach((book, index) => {
    if (index > 0) y += 30

    addText(book.title || '未命名书籍', `bold 44px ${FONT_FAMILY}`, '#2f2f2f', 58, CONTENT_W, MARGIN, 150)

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
      // 标题至少与两行正文同页，防止标题孤悬页尾
      addText(section.title, `bold 32px ${FONT_FAMILY}`, '#7B8FA1', 46, CONTENT_W, MARGIN, 110)
      addMarkdown(section.content, `28px ${FONT_FAMILY}`, '#3a3a3a', 46)
      y += 26
    }

    if (!hasContent) {
      addText('（暂无笔记内容）', `26px ${FONT_FAMILY}`, '#aaaaaa', 40)
      y += 20
    }

    if (index < books.length - 1) {
      ensureSpace(30)
      ops.push({ line: true, y, color: '#e3e3e3', page })
      y += 26
    }
  })

  return { ops, lastPage: page }
}

function drawOps(ctx, ops) {
  ctx.textBaseline = 'top'
  for (const op of ops) {
    if (op.rectbg) {
      ctx.fillStyle = op.color
      ctx.fillRect(op.x, op.y, op.w, op.h)
      continue
    }
    if (op.line) {
      ctx.strokeStyle = op.color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(MARGIN, op.y)
      ctx.lineTo(PAGE_W - MARGIN, op.y)
      ctx.stroke()
      continue
    }
    if (op.barMark) {
      ctx.fillStyle = '#7B8FA1'
      ctx.fillRect(MARGIN, op.y, 4, op.h)
    }
    if (op.runs) {
      let cx = op.x
      ctx.fillStyle = op.color
      for (const run of op.runs) {
        ctx.font = run.font
        ctx.fillText(run.text, cx, op.y)
        cx += ctx.measureText(run.text).width
      }
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
  const { ops, lastPage } = buildLayout(measureCtx, books)

  // 排版阶段已按页分组（op.page），逐页绘制，保证行内容不会被页边界从中间截断
  const result = []
  for (let i = 0; i <= lastPage; i++) {
    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = PAGE_W
    pageCanvas.height = PAGE_H
    const ctx = pageCanvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, PAGE_W, PAGE_H)
    drawOps(ctx, ops.filter(op => op.page === i))
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
  // 文件名自动生成：单本导出用「书名-日期」，多本合并导出用「书记笔记-日期」
  const safeTitle = String(books[0].title || '').replace(/[\\/:*?"<>|]/g, '').trim() || '未命名书籍'
  const filename = books.length === 1 ? `${safeTitle}-${dateStr}.pdf` : `书记笔记-${dateStr}.pdf`

  try {
    const saved = await savePdf(doc, filename)
    return { code: 200, data: { filename, ...saved } }
  } catch (e) {
    console.error('Failed to save PDF:', e)
    return { code: 500, message: e.message || '保存 PDF 失败' }
  }
}
