import { createApp } from 'vue'
import { createPinia } from 'pinia'
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
