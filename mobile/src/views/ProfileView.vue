<template>
  <div class="profile-view">
    <div class="profile-header">
      <button class="back-btn" @click="goBack">‹ 返回</button>
      <h1>个人账号</h1>
    </div>

    <div class="avatar-section">
      <label class="avatar-wrap">
        <img v-if="avatar" :src="avatar" class="avatar-img" alt="头像" />
        <span v-else class="avatar-placeholder">{{ initial }}</span>
        <span class="avatar-edit">更换</span>
        <input type="file" accept="image/*" class="hidden-input" @change="handleAvatar" />
      </label>
      <button v-if="avatar" class="avatar-remove" @click="removeAvatar">移除头像</button>
    </div>

    <div class="form-card">
      <label class="form-label">昵称</label>
      <input
        v-model.trim="name"
        class="form-input"
        type="text"
        maxlength="20"
        placeholder="给自己起个名字吧"
      />
    </div>

    <div class="notice-card">
      <p class="notice-title">🔒 隐私说明</p>
      <p>
        账号昵称与头像<b>仅保存在本机应用数据中</b>，仅作为个人辨识使用。本应用无任何联网、注册、云端存储功能，账号信息不会上传到任何服务器。
      </p>
    </div>

    <div class="form-card toggle-card">
      <span class="toggle-text">在统计面板显示账号视图</span>
      <button class="toggle" :class="{ on: showInStats }" @click="showInStats = !showInStats">
        <span class="toggle-knob"></span>
      </button>
    </div>

    <button class="save-btn" :disabled="busy" @click="saveProfile">
      {{ busy ? '保存中...' : '保存' }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProfile } from '../composables/profile'

const router = useRouter()
const { profile, load, save } = useProfile()

const name = ref('')
const avatar = ref('')
const showInStats = ref(true)
const busy = ref(false)

const initial = computed(() => (name.value || '书').slice(0, 1).toUpperCase())

onMounted(async () => {
  const p = await load(true)
  name.value = p.name || ''
  avatar.value = p.avatar || ''
  showInStats.value = p.showInStats !== false
})

function handleAvatar(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (file.size > 7 * 1024 * 1024) {
    alert('图片请小于 7MB')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => { avatar.value = e.target.result }
  reader.readAsDataURL(file)
}

function removeAvatar() {
  avatar.value = ''
}

async function saveProfile() {
  busy.value = true
  try {
    await save({ name: name.value, avatar: avatar.value, showInStats: showInStats.value })
    alert('已保存')
    router.replace('/more')
  } finally {
    busy.value = false
  }
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.replace('/more')
}
</script>

<style scoped>
.profile-view {
  padding: 16px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
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

.profile-header h1 {
  font-size: 20px;
  margin: 0;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.avatar-wrap {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--primary-light);
  color: var(--primary-color);
  font-size: 36px;
  font-weight: 600;
}

.avatar-edit {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 3px 0;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 12px;
  text-align: center;
}

.hidden-input {
  display: none;
}

.avatar-remove {
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
}

.form-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 14px;
}

.form-label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 15px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.notice-card {
  background: var(--tag-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 14px;
}

.notice-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 6px;
}

.notice-card p {
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
  margin: 0;
}

.toggle-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toggle-text {
  font-size: 15px;
}

.toggle {
  position: relative;
  width: 46px;
  height: 26px;
  border: none;
  border-radius: 13px;
  background: var(--border-color);
  transition: background 0.2s;
  cursor: pointer;
  flex-shrink: 0;
}

.toggle.on {
  background: var(--primary-color);
}

.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: left 0.2s;
}

.toggle.on .toggle-knob {
  left: 23px;
}

.save-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: var(--primary-color);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
}

.save-btn:disabled {
  opacity: 0.6;
}
</style>
