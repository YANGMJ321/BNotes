<template>
  <div class="feedback-view">
    <div class="feedback-header">
      <button class="back-btn" @click="goBack">‹ 返回</button>
      <h1>反馈</h1>
    </div>

    <p class="feedback-intro">遇到 Bug 或有功能建议，欢迎通过以下方式联系我：</p>

    <div class="contact-card" @click="copyMail">
      <span class="contact-icon">📧</span>
      <div class="contact-info">
        <span class="contact-title">邮件反馈</span>
        <span class="contact-value">yang_8211@foxmail.com</span>
      </div>
      <span class="contact-arrow">{{ mailCopied ? '✓' : '⧉' }}</span>
    </div>

    <div class="contact-card" @click="copyXhs">
      <span class="contact-icon">📕</span>
      <div class="contact-info">
        <span class="contact-title">小红书私信留言</span>
        <span class="contact-value">@第四号垃圾桶（小红书号：26542863188）</span>
      </div>
      <span class="contact-arrow">{{ copied ? '✓' : '⧉' }}</span>
    </div>

    <p v-if="copied || mailCopied" class="copy-tip">{{ mailCopied ? '邮箱地址已复制' : '小红书号已复制，去小红书搜索添加吧' }}</p>

    <div class="notice-card">
      <p>
        反馈时请尽量描述清楚：使用的设备型号、系统版本、操作步骤和预期效果，最好附上截图，这样能更快定位问题。感谢你的每一条反馈 ♥
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const copied = ref(false)
const mailCopied = ref(false)

function copyText(text, flag) {
  const done = () => {
    flag.value = true
    setTimeout(() => { flag.value = false }, 2500)
  }
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done))
  } else {
    fallbackCopy(text, done)
  }
}

function copyMail() {
  copyText('yang_8211@foxmail.com', mailCopied)
}

function copyXhs() {
  copyText('26542863188', copied)
}

function fallbackCopy(text, done) {
  const input = document.createElement('input')
  input.value = text
  document.body.appendChild(input)
  input.select()
  try { document.execCommand('copy') } catch (e) {}
  document.body.removeChild(input)
  done()
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.replace('/more')
}
</script>

<style scoped>
.feedback-view {
  padding: 16px;
}

.feedback-header {
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

.feedback-header h1 {
  font-size: 20px;
  margin: 0;
}

.feedback-intro {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-color);
  margin: 0 0 16px;
}

.contact-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  text-decoration: none;
  color: var(--text-color);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.contact-card:active {
  background: var(--hover-bg);
}

.contact-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.contact-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.contact-title {
  font-size: 15px;
  font-weight: 500;
}

.contact-value {
  font-size: 13px;
  color: var(--text-secondary);
  word-break: break-all;
  text-align: left;
}

.contact-arrow {
  color: var(--text-secondary);
  font-size: 16px;
  flex-shrink: 0;
}

.copy-tip {
  font-size: 12px;
  color: var(--primary-color);
  text-align: center;
  margin: 4px 0 0;
}

.notice-card {
  background: var(--tag-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 14px 16px;
  margin-top: 16px;
}

.notice-card p {
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
  margin: 0;
}
</style>
