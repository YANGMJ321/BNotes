<template>
  <div class="support-view">
    <div class="support-header">
      <button class="back-btn" @click="goBack">‹ 返回</button>
      <h1>💝 支持开发者</h1>
    </div>

    <div class="support-intro">
      <p>
        本项目完全免费，可自由使用、修改、分发。支持属于自愿行为，不构成付费购买，不提供售后、功能定制与服务承诺。
      </p>
      <p>如果这个软件陪你读完了几本好书，欢迎请作者喝一瓶可乐——快乐水到位，更新更有劲！</p>
    </div>

    <div class="qr-grid">
      <div v-if="wechatAppreciation" class="qr-item" @click="preview(wechatAppreciation)">
        <img :src="wechatAppreciation" alt="微信固定金额" />
        <span class="qr-label">微信</span>
      </div>
      <div v-if="wechatPay" class="qr-item" @click="preview(wechatPay)">
        <img :src="wechatPay" alt="微信任意金额" />
        <span class="qr-label">微信任意金额</span>
      </div>
      <div v-if="alipay" class="qr-item" @click="preview(alipay)">
        <img :src="alipay" alt="支付宝任意金额" />
        <span class="qr-label">支付宝任意金额</span>
      </div>
    </div>

    <p class="support-thanks">感谢你的每一份鼓励 ♥</p>
    <p class="support-tip">长按或点击二维码可放大查看，截图后到微信 / 支付宝「扫一扫」中选择相册识别即可。</p>

    <div v-if="previewSrc" class="preview-mask" @click="previewSrc = null">
      <img :src="previewSrc" alt="二维码放大" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// 个人图片资源不入版本库，统一在本地忽略规则中维护。
// 本地 assets/support/ 缺失时此处为空对象，页面自动隐藏二维码区域，构建不报错。
const modules = import.meta.glob('../assets/support/*.{jpg,jpeg,png}', { eager: true, import: 'default' })

function img(name) {
  const key = Object.keys(modules).find(k => k.endsWith(`/${name}`))
  return key ? modules[key] : ''
}

const wechatAppreciation = img('wechat-appreciation.jpg')
const wechatPay = img('wechat-pay.jpg')
const alipay = img('alipay.jpg')

const router = useRouter()
const previewSrc = ref(null)

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/more')
  }
}

function preview(src) {
  previewSrc.value = src
}
</script>

<style scoped>
.support-view {
  padding: 16px;
}

.support-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.back-btn {
  border: none;
  background: none;
  color: var(--primary-color);
  font-size: 16px;
  padding: 6px 10px;
  margin-left: -10px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.support-header h1 {
  font-size: 20px;
  margin: 0;
}

.support-intro {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.support-intro p {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-color);
  margin: 0 0 8px;
}

.support-intro p:last-child {
  margin-bottom: 0;
}

.qr-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.qr-item {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.qr-item:active {
  background: var(--hover-bg);
}

.qr-item img {
  width: 100%;
  aspect-ratio: 1 / 1.4;
  object-fit: cover;
  border-radius: 8px;
}

.qr-label {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-color);
  text-align: center;
}

.support-thanks {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: var(--text-color);
}

.support-tip {
  margin-top: 8px;
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.preview-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.preview-mask img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 12px;
}
</style>
