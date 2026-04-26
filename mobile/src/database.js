/**
 * BNotes 移动端纯前端数据库模块
 * 基于 sql.js + IndexedDB，在 WebView 中运行，无需 Node.js 后端
 */

const DB_NAME = 'bnotes-mobile'
const STORE_NAME = 'database'
const STORE_KEY = 'main'
const SAVE_DEBOUNCE_MS = 500

class Database {
  constructor() {
    this.db = null
    this._saveTimer = null
    this._saving = false
  }

  /**
   * 初始化数据库：加载 sql.js → 从 IndexedDB 恢复或创建新库 → 初始化 schema
   */
  async init() {
    if (this.db) return

    // 加载 sql.js
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    })

    // 尝试从 IndexedDB 恢复已有数据库
    const savedData = await this._loadFromIndexedDB()
    if (savedData) {
      this.db = new SQL.Database(new Uint8Array(savedData))
      console.log('[BNotes] 已从 IndexedDB 恢复数据库')
    } else {
      this.db = new SQL.Database()
      console.log('[BNotes] 已创建新数据库')
    }

    // 初始化表结构
    this._initSchema()

    // 执行迁移
    this._runMigrations()

    // 初始化默认分类
    this._initDefaultData()

    // 保存初始状态
    this.save()

    return this
  }

  /**
   * 初始化所有表（与后端 database.js 保持一致）
   */
  _initSchema() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_id INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)

    this.db.run(`
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

    this.db.run(`
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

    this.db.run(`
      CREATE TABLE IF NOT EXISTS book_tags (
        book_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (book_id, tag_id)
      );
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS note_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_note_id INTEGER NOT NULL,
        target_book_id INTEGER NOT NULL,
        keyword TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT DEFAULT 'bug',
        content TEXT NOT NULL,
        image TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)
  }

  /**
   * 兼容已有数据库的 ALTER TABLE 迁移
   */
  _runMigrations() {
    const migrations = [
      'ALTER TABLE notes ADD COLUMN note_date DATETIME',
      'ALTER TABLE books ADD COLUMN cover TEXT DEFAULT ""',
      'ALTER TABLE tags ADD COLUMN group_name TEXT DEFAULT ""'
    ]
    for (const sql of migrations) {
      try {
        this.db.run(sql)
      } catch (e) {
        // 字段已存在则忽略
      }
    }
  }

  /**
   * 初始化默认数据
   */
  _initDefaultData() {
    const result = this.db.exec('SELECT COUNT(*) as cnt FROM categories')
    const count = result[0]?.values[0]?.[0] || 0
    if (count === 0) {
      this.db.run("INSERT INTO categories (name) VALUES ('未分类')")
    }
  }

  /**
   * 查询多行，返回对象数组
   */
  queryAll(sql, params = []) {
    const result = this.db.exec(sql, params)
    if (!result[0]) return []
    const columns = result[0].columns
    return result[0].values.map(row => {
      const obj = {}
      columns.forEach((col, i) => { obj[col] = row[i] })
      return obj
    })
  }

  /**
   * 查询单行，返回对象或 null
   */
  queryOne(sql, params = []) {
    const rows = this.queryAll(sql, params)
    return rows[0] || null
  }

  /**
   * 执行写操作（INSERT/UPDATE/DELETE），自动触发防抖保存
   */
  run(sql, params = []) {
    this.db.run(sql, params)
    this.save()
    const lastId = this.queryOne('SELECT last_insert_rowid() as id')
    return {
      lastInsertRowid: lastId ? lastId.id : 0,
      changes: this.db.getRowsModified()
    }
  }

  /**
   * 防抖保存到 IndexedDB（500ms 内多次调用只执行一次）
   */
  save() {
    if (this._saveTimer) clearTimeout(this._saveTimer)
    this._saveTimer = setTimeout(() => {
      this._saveToIndexedDB()
    }, SAVE_DEBOUNCE_MS)
  }

  /**
   * 立即保存到 IndexedDB（用于关键操作后强制持久化）
   */
  async saveNow() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer)
      this._saveTimer = null
    }
    await this._saveToIndexedDB()
  }

  /**
   * 导出数据库为 Uint8Array（用于备份/导出）
   */
  export() {
    if (!this.db) return null
    return this.db.export()
  }

  /**
   * 从 Uint8Array 导入数据库（替换当前数据库）
   */
  async import(data) {
    if (this.db) {
      this.db.close()
    }
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    })
    this.db = new SQL.Database(new Uint8Array(data))
    await this.saveNow()
  }

  // ========== IndexedDB 操作 ==========

  /**
   * 从 IndexedDB 加载数据库二进制数据
   */
  _loadFromIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1)

      request.onupgradeneeded = (event) => {
        const idb = event.target.result
        if (!idb.objectStoreNames.contains(STORE_NAME)) {
          idb.createObjectStore(STORE_NAME)
        }
      }

      request.onsuccess = (event) => {
        const idb = event.target.result
        try {
          const tx = idb.transaction(STORE_NAME, 'readonly')
          const store = tx.objectStore(STORE_NAME)
          const getReq = store.get(STORE_KEY)

          getReq.onsuccess = () => {
            resolve(getReq.result || null)
          }
          getReq.onerror = () => {
            console.warn('[BNotes] IndexedDB 读取失败:', getReq.error)
            resolve(null)
          }
        } catch (e) {
          console.warn('[BNotes] IndexedDB 事务失败:', e)
          resolve(null)
        }
      }

      request.onerror = () => {
        console.warn('[BNotes] IndexedDB 打开失败:', request.error)
        resolve(null)
      }
    })
  }

  /**
   * 保存数据库二进制数据到 IndexedDB
   */
  _saveToIndexedDB() {
    if (!this.db || this._saving) return
    this._saving = true

    const data = this.db.export()

    const request = indexedDB.open(DB_NAME, 1)

    request.onupgradeneeded = (event) => {
      const idb = event.target.result
      if (!idb.objectStoreNames.contains(STORE_NAME)) {
        idb.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = (event) => {
      const idb = event.target.result
      try {
        const tx = idb.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        store.put(data, STORE_KEY)

        tx.oncomplete = () => {
          this._saving = false
        }
        tx.onerror = () => {
          console.error('[BNotes] IndexedDB 保存失败:', tx.error)
          this._saving = false
        }
      } catch (e) {
        console.error('[BNotes] IndexedDB 保存事务失败:', e)
        this._saving = false
      }
    }

    request.onerror = () => {
      console.error('[BNotes] IndexedDB 打开失败:', request.error)
      this._saving = false
    }
  }
}

// 单例模式：整个 app 共享一个数据库实例
const database = new Database()

export default database
