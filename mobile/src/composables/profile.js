import { ref } from 'vue'
import { useBookStore } from '../stores/books'

const PROFILE_KEY = 'profile'
const DEFAULT_PROFILE = { name: '', avatar: '', showInStats: true }

// 全局共享响应式 profile，More / 统计 / 编辑页共用
const profile = ref({ ...DEFAULT_PROFILE })
let loaded = false

export function useProfile() {
  const bookStore = useBookStore()

  async function load(force = false) {
    if (loaded && !force) return profile.value
    try {
      const raw = await bookStore.getSetting(PROFILE_KEY)
      if (raw) {
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw
        profile.value = { ...DEFAULT_PROFILE, ...data }
      }
      loaded = true
    } catch (e) {
      console.warn('[BNotes] 读取账号信息失败:', e)
    }
    return profile.value
  }

  async function save(data) {
    profile.value = { ...profile.value, ...data }
    try {
      await bookStore.saveSetting(PROFILE_KEY, JSON.parse(JSON.stringify(profile.value)))
    } catch (e) {
      console.warn('[BNotes] 保存账号信息失败:', e)
    }
    return profile.value
  }

  return { profile, load, save }
}
