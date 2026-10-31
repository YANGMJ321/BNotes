<template>
  <div class="stats-mobile">
    <div v-if="(profile.name || profile.avatar) && profile.showInStats !== false" class="profile-banner">
      <img v-if="profile.avatar" :src="profile.avatar" class="banner-avatar" alt="头像" />
      <span v-else class="banner-avatar banner-initial">{{ initial }}</span>
      <div class="banner-info">
        <span class="banner-name">{{ profile.name || '读书人' }}</span>
        <span class="banner-sub">这是我的读书档案</span>
      </div>
      <button class="banner-close" title="隐藏账号视图" @click="hideProfile">✕</button>
    </div>
    <StatisticsView />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import StatisticsView from '@desktop/views/StatisticsView.vue'
import { useProfile } from '../composables/profile'

const { profile, load, save } = useProfile()

const initial = computed(() => (profile.value.name || '书').slice(0, 1).toUpperCase())

onMounted(() => {
  load()
})

async function hideProfile() {
  await save({ showInStats: false })
}
</script>

<style scoped>
.stats-mobile {
  padding: 16px;
}

.profile-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 14px;
}

.banner-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.banner-initial {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-light);
  color: var(--primary-color);
  font-size: 18px;
  font-weight: 600;
}

.banner-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.banner-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.banner-sub {
  font-size: 12px;
  color: var(--text-secondary);
}

.banner-close {
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 15px;
  padding: 8px;
  margin: -8px -8px -8px 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
</style>
