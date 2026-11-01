<template>
  <div class="feedback-view">
    <h1>反馈建议</h1>

    <div class="feedback-card">
      <p class="feedback-intro">遇到 Bug 或有功能建议，欢迎通过以下方式联系我：</p>

      <div class="contact-card" @click="copyMail">
        <span class="contact-icon">📧</span>
        <div class="contact-info">
          <span class="contact-title">邮件反馈</span>
          <span class="contact-value">yang_8211@foxmail.com</span>
        </div>
        <span class="contact-action" :class="{ copied: mailCopied }">{{ mailCopied ? '已复制' : '复制' }}</span>
      </div>

      <div class="contact-card" @click="copyXhs">
        <span class="contact-icon">📕</span>
        <div class="contact-info">
          <span class="contact-title">小红书私信留言</span>
          <span class="contact-value">@第四号垃圾桶（小红书号：26542863188）</span>
        </div>
        <span class="contact-action" :class="{ copied: xhsCopied }">{{ xhsCopied ? '已复制' : '复制' }}</span>
      </div>
    </div>

    <div class="notice-card">
      <p>
        反馈时请尽量描述清楚：使用的系统版本、操作步骤和预期效果，最好附上截图，这样能更快定位问题。感谢你的每一条反馈 ♥
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const mailCopied = ref(false)
const xhsCopied = ref(false)

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

function fallbackCopy(text, done) {
  const input = document.createElement('input')
  input.value = text
  document.body.appendChild(input)
  input.select()
  try { document.execCommand('copy') } catch (e) {}
  document.body.removeChild(input)
  done()
}

function copyMail() {
  copyText('yang_8211@foxmail.com', mailCopied)
}

function copyXhs() {
  copyText('26542863188', xhsCopied)
}
</script>

<style scoped>
.feedback-view {
  max-width: 600px;
}

.feedback-view h1 {
  font-size: 24px;
  margin: 0 0 24px;
}

.feedback-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
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
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 14px 16px;
  background: var(--input-bg);
  cursor: pointer;
  transition: all 0.2s;
}

.contact-card + .contact-card {
  margin-top: 12px;
}

.contact-card:hover {
  border-color: var(--primary-color);
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
  color: var(--text-color);
}

.contact-value {
  font-size: 13px;
  color: var(--text-secondary);
  word-break: break-all;
}

.contact-action {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--primary-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 4px 10px;
}

.contact-action.copied {
  color: #2e7d32;
  border-color: #2e7d32;
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
