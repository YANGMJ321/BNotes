import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
// Apply theme from localStorage before mount to avoid flash
try {
  const saved = localStorage.getItem('bnotes-theme')
  if (saved) {
    const theme = JSON.parse(saved)
    const root = document.documentElement
    if (theme.preset && theme.preset !== 'custom') {
      root.classList.add(`theme-${theme.preset}`)
    } else if (theme.preset === 'custom' && theme.customHue != null) {
      root.style.setProperty('--theme-hue', String(theme.customHue))
    } else {
      root.classList.add('theme-slate')
    }
    if (theme.darkMode) {
      root.classList.add('dark')
    }
  } else {
    document.documentElement.classList.add('theme-slate')
  }
} catch (e) {
  document.documentElement.classList.add('theme-slate')
}

app.mount('#app')
