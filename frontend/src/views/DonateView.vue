<template>
  <div class="donate-view">
    <h1>打赏</h1>
    <p class="donate-intro">
      本项目完全开源免费，可自由使用、修改、分发。赞助属于自愿打赏，不构成付费购买。
      如果这个软件陪你读完了几本好书，欢迎请作者喝一瓶可乐——快乐水到位，更新更有劲。
    </p>

    <div v-if="qrList.length" class="qr-grid">
      <div v-for="qr in qrList" :key="qr.label" class="qr-item" @click="preview(qr.src)">
        <img :src="qr.src" :alt="qr.label" />
        <span class="qr-label">{{ qr.label }}</span>
      </div>
    </div>

    <p class="donate-thanks">感谢你的每一份鼓励 ♥</p>

    <div v-if="previewSrc" class="preview-mask" @click="previewSrc = null">
      <img :src="previewSrc" alt="二维码放大" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 打赏码属于个人收款码，永不入版本库（见 DEV_PROTOCOL.md）。
// 本地 assets/donate/ 缺失时此处为空对象，页面自动隐藏二维码区域，构建不报错。
const modules = import.meta.glob('../assets/donate/*.{jpg,jpeg,png}', { eager: true, import: 'default' })

function img(name) {
  const key = Object.keys(modules).find(k => k.endsWith(`/${name}`))
  return key ? modules[key] : ''
}

const qrList = [
  { label: '微信赞赏码', src: img('wechat-appreciation.jpg') },
  { label: '微信任意金额', src: img('wechat-pay.jpg') },
  { label: '支付宝任意金额', src: img('alipay.jpg') }
].filter(qr => qr.src)

const previewSrc = ref(null)

function preview(src) {
  previewSrc.value = src
}
</script>

<style scoped>
.donate-view {
  max-width: 720px;
}

.donate-view h1 {
  font-size: 18px;
  margin: 0 0 12px;
  color: var(--text-color);
}

.donate-intro {
  font-size: 13px;
  line-height: 1.8;
  color: var(--text-secondary);
  margin: 0 0 20px;
}

.qr-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.qr-item {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
}

.qr-item:hover {
  border-color: var(--primary-color);
}

.qr-item img {
  width: 100%;
  aspect-ratio: 1 / 1.4;
  object-fit: cover;
  border-radius: 6px;
}

.qr-label {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}

.donate-thanks {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
}

.preview-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  cursor: pointer;
}

.preview-mask img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 10px;
}
</style>
