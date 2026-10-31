import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import App from './App.vue'
import router from './router'
import '@desktop/styles/main.css'

// 启动时加载主题避免闪烁
const saved = localStorage.getItem('bnotes-theme')
if (saved) {
  try {
    const s = JSON.parse(saved)
    const root = document.documentElement
    root.classList.remove('theme-rose', 'theme-sage', 'theme-sand', 'theme-lavender', 'theme-slate')
    if (s.preset && s.preset !== 'custom') root.classList.add(`theme-${s.preset}`)
    else if (s.preset === 'custom' && s.customHue != null) root.style.setProperty('--theme-hue', String(s.customHue))
    if (s.darkMode) root.classList.add('dark')
  } catch (e) {}
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// 安卓实体返回键：优先返回上一界面，其次回主页，仅主页时才退出应用
if (Capacitor.isNativePlatform()) {
  // 提供给共享视图（如 PDF 导出）使用，避免桌面端引入原生插件依赖
  window.__bnotesNative = { Filesystem, Share }

  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    const current = router.currentRoute.value.path
    if (canGoBack && window.history.length > 1) {
      window.history.back()
    } else if (current !== '/') {
      router.replace('/')
    } else {
      CapacitorApp.exitApp()
    }
  })
}
