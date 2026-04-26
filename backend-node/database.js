const initSqlJs = require('sql.js')
const path = require('path')
const fs = require('fs')

// 数据目录：优先使用环境变量，否则使用项目根目录下的 data
const DATA_DIR = process.env.BNOTES_DATA_DIR || path.join(__dirname, '..', 'data')
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const DB_PATH = path.join(DATA_DIR, 'bnotes.db')

// 如果旧数据存在（backend/data/bnotes.db），自动迁移
const OLD_DB_PATH = path.join(__dirname, '..', 'backend', 'data', 'bnotes.db')
if (!fs.existsSync(DB_PATH) && fs.existsSync(OLD_DB_PATH)) {
  fs.copyFileSync(OLD_DB_PATH, DB_PATH)
  console.log(`[BNotes] 已迁移旧数据库: ${OLD_DB_PATH} -> ${DB_PATH}`)
}

let db = null
let saveTimer = null

// 延迟保存（防抖，避免频繁写盘）
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    if (db) {
      const data = db.export()
      const buffer = Buffer.from(data)
      fs.writeFileSync(DB_PATH, buffer)
    }
  }, 300)
}

async function initDatabase() {
  const SQL = await initSqlJs()

  // 加载已有数据库或创建新的
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(fileBuffer)
    console.log(`[BNotes] 已加载数据库: ${DB_PATH}`)
  } else {
    db = new SQL.Database()
    console.log(`[BNotes] 已创建新数据库: ${DB_PATH}`)
  }

  // 初始化表结构
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT DEFAULT '',
      category_id INTEGER DEFAULT 0,
      status TEXT DEFAULT 'want' CHECK(status IN ('want', 'reading', 'done')),
      progress INTEGER DEFAULT 0,
      read_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      content TEXT DEFAULT '',
      excerpts TEXT DEFAULT '',
      reflections TEXT DEFAULT '',
      note_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS book_tags (
      book_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (book_id, tag_id)
    );
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS note_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_note_id INTEGER NOT NULL,
      target_book_id INTEGER NOT NULL,
      keyword TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)

  // 兼容已有数据库：添加 note_date 字段
  try {
    db.run('ALTER TABLE notes ADD COLUMN note_date DATETIME')
  } catch (e) {
    // 字段已存在则忽略
  }

  // 兼容已有数据库：添加 cover 字段
  try { db.run('ALTER TABLE books ADD COLUMN cover TEXT DEFAULT ""') } catch(e) {}

  // 兼容已有数据库：添加 group_name 字段
  try { db.run('ALTER TABLE tags ADD COLUMN group_name TEXT DEFAULT ""') } catch(e) {}

  // 创建反馈表
  db.run(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT DEFAULT 'bug',
      content TEXT NOT NULL,
      image TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // 初始化默认分类
  const result = db.exec('SELECT COUNT(*) as cnt FROM categories')
  const count = result[0]?.values[0]?.[0] || 0
  if (count === 0) {
    db.run("INSERT INTO categories (name) VALUES ('未分类')")
  }

  scheduleSave()
  return db
}

// 查询辅助：返回对象数组
function queryAll(sql, params = []) {
  const result = db.exec(sql, params)
  if (!result[0]) return []
  const columns = result[0].columns
  return result[0].values.map(row => {
    const obj = {}
    columns.forEach((col, i) => { obj[col] = row[i] })
    return obj
  })
}

// 查询辅助：返回单个对象
function queryOne(sql, params = []) {
  const rows = queryAll(sql, params)
  return rows[0] || null
}

// 执行辅助：INSERT/UPDATE/DELETE
function run(sql, params = []) {
  db.run(sql, params)
  scheduleSave()
  // 获取最后插入的行 ID
  const lastId = queryOne('SELECT last_insert_rowid() as id')
  return {
    lastInsertRowid: lastId ? lastId.id : 0,
    changes: db.getRowsModified()
  }
}

// 进程退出时保存数据库
process.on('exit', () => {
  if (db) {
    const data = db.export()
    fs.writeFileSync(DB_PATH, Buffer.from(data))
  }
})

process.on('SIGINT', () => {
  if (db) {
    const data = db.export()
    fs.writeFileSync(DB_PATH, Buffer.from(data))
  }
  process.exit(0)
})

module.exports = { initDatabase, queryAll, queryOne, run, scheduleSave, getDb: () => db }
