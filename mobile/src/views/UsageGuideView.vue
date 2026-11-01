<template>
  <div class="usage-guide">
    <div class="guide-header">
      <button class="back-btn" @click="goBack">‹ 返回</button>
      <h1>使用说明</h1>
      <span class="version">v1.9.4</span>
    </div>

    <section class="guide-card">
      <h2>📖 简介与上手</h2>
      <p>
        书记（BNotes）是一款简洁高效的读书笔记管理工具（安卓版）：书籍管理、Markdown
        笔记、阅读统计、导入导出、数据库备份与恢复、多主题。数据全部保存在手机本地，不上传任何服务器。
      </p>
      <p>点击书架页右上角的「+ 新建书籍」录入书名、作者，即可开始记录金句、读后感与笔记。</p>
    </section>

    <section class="guide-card">
      <h2>📚 功能速览</h2>
      <ul>
        <li>书架式管理：想读 / 在读 / 已读，进度追踪，封面、分类、标签</li>
        <li>每本书三个笔记板块：金句摘录 / 读后感 / 笔记整理，支持 Markdown</li>
        <li>编辑笔记时自动保存草稿：中途离开不丢内容，回到编辑页或首页草稿箱即可继续</li>
        <li>全局搜索与笔记流视图</li>
        <li>阅读统计：总览卡片、状态环形图、阅读趋势图</li>
        <li>导入导出：PDF / HTML / 纯文本导出，ZIP 备份导入导出</li>
        <li>5 套莫兰迪主题配色 + 明暗模式切换</li>
      </ul>
    </section>

    <section class="guide-card">
      <h2>💾 数据与备份</h2>
      <p>在「更多」页可一键备份数据库为 .db 文件并通过系统分享保存，也可随时从备份文件恢复。</p>
      <p>
        换新手机时：先在旧手机「更多 → 备份数据库」导出 .db 文件，拷贝到新手机后用「更多 →
        恢复备份」选择该文件即可完成迁移。重要数据建议定期备份。
      </p>
    </section>

    <section class="guide-card">
      <h2>🔄 版本更新</h2>
      <p>有新版本时，前往发布页下载新的安装包（APK），直接覆盖安装即可，手机本地数据不会丢失。</p>
      <p>更新前建议先在「更多 → 备份数据库」导出一份 .db 备份以防万一；更新完成后，旧版本安装包可自行删除。</p>
    </section>

    <section class="guide-card">
      <h2>📧 问题反馈</h2>
      <p>遇到 Bug 或有建议，欢迎发送邮箱：</p>
      <a class="email-link" href="mailto:yang_8211@foxmail.com">yang_8211@foxmail.com</a>
    </section>

    <section class="guide-card donate-card">
      <h2>💝 赞助支持</h2>
      <p>
        本项目完全开源免费，可自由使用、修改、分发。赞助属于自愿打赏，不构成付费购买，不提供售后、功能定制与服务承诺。
      </p>
      <p>如果这个软件陪你读完了几本好书，欢迎请作者喝一瓶可乐——快乐水到位，更新更有劲！</p>
      <router-link to="/donate" class="donate-btn">前往打赏 ›</router-link>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/more')
  }
}
</script>

<style scoped>
.usage-guide {
  padding: 16px;
}

.guide-header {
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

.guide-header h1 {
  font-size: 20px;
  margin: 0;
  flex: 1;
}

.version {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--tag-bg);
  padding: 2px 8px;
  border-radius: 10px;
}

.guide-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 18px 16px;
  margin-bottom: 14px;
}

.guide-card h2 {
  font-size: 16px;
  margin: 0 0 10px;
  color: var(--text-color);
}

.guide-card p {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-color);
  margin: 0 0 8px;
}

.guide-card ul {
  margin: 0;
  padding-left: 20px;
}

.guide-card li {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-color);
}

.email-link {
  color: var(--primary-color);
  font-size: 14px;
  text-decoration: none;
  word-break: break-all;
}

.donate-card {
  border-color: var(--primary-color);
}

.donate-btn {
  display: inline-block;
  margin-top: 6px;
  padding: 8px 18px;
  background: var(--primary-color);
  color: #fff;
  border-radius: 8px;
  font-size: 14px;
  text-decoration: none;
}
</style>
