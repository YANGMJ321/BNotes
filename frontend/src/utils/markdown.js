import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: false, // 不渲染原始 HTML，保证安全
  linkify: true, // 自动识别链接
  breaks: true // 换行渲染为 <br>，兼容原有纯文本换行习惯
})

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 在 HTML 的文本节点中高亮关联书籍关键词（跳过标签本身，避免破坏结构）
 * @param {string} html
 * @param {Array<{keyword: string, target_book_id: number}>} links
 * @returns {string}
 */
function highlightLinks(html, links) {
  if (!links || !links.length) return html
  return html.replace(/<[^>]*>|[^<]+/g, (match) => {
    if (match.startsWith('<')) return match
    let text = match
    links.forEach((link) => {
      if (link.keyword) {
        const regex = new RegExp(`(${escapeRegExp(link.keyword)})`, 'g')
        text = text.replace(
          regex,
          `<a href="#/books/${link.target_book_id}" class="note-link">$1</a>`
        )
      }
    })
    return text
  })
}

/**
 * 将 Markdown 文本渲染为 HTML
 * @param {string} text 原始文本（可为空）
 * @param {Array<{keyword: string, target_book_id: number}>} [links] 关联书籍关键词
 * @returns {string} 渲染后的 HTML
 */
export function renderMarkdown(text, links) {
  if (!text) return ''
  return highlightLinks(md.render(text), links)
}
