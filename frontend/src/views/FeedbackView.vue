<template>
  <div class="feedback-view">
    <h1>反馈建议</h1>

    <div class="feedback-card">
      <div class="form-group">
        <label class="form-label">类型</label>
        <div class="type-selector">
          <button
            class="type-btn"
            :class="{ active: feedbackType === 'bug' }"
            @click="feedbackType = 'bug'"
          >
            Bug反馈
          </button>
          <button
            class="type-btn"
            :class="{ active: feedbackType === 'feature' }"
            @click="feedbackType = 'feature'"
          >
            功能建议
          </button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">内容描述</label>
        <textarea
          v-model="content"
          class="feedback-textarea"
          placeholder="请详细描述您遇到的问题或建议..."
          rows="6"
        ></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">截图（可选）</label>
        <div class="image-upload">
          <input
            type="file"
            accept="image/*"
            @change="handleImageUpload"
            ref="fileInput"
            class="file-input"
          />
          <button class="btn btn-secondary" @click="$refs.fileInput.click()">选择图片</button>
          <div v-if="imagePreview" class="image-preview">
            <img :src="imagePreview" alt="预览" />
            <button class="btn-remove-image" @click="removeImage">×</button>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button
          class="btn btn-primary"
          @click="submitFeedback"
          :disabled="!canSubmit || submitting"
        >
          {{ submitting ? '提交中...' : '提交反馈' }}
        </button>
      </div>

      <div v-if="validationError" class="validation-error">
        {{ validationError }}
      </div>
    </div>

    <div v-if="submitSuccess" class="success-message">
      <span class="success-icon">✓</span>
      反馈提交成功，感谢您的建议！
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBookStore } from '../stores/books'

const bookStore = useBookStore()

const feedbackType = ref('bug')
const content = ref('')
const imageData = ref(null)
const imagePreview = ref(null)
const submitting = ref(false)
const submitSuccess = ref(false)
const validationError = ref('')

const canSubmit = computed(() => {
  return content.value.trim() || imageData.value
})

function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    imageData.value = e.target.result
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

function removeImage() {
  imageData.value = null
  imagePreview.value = null
}

async function submitFeedback() {
  validationError.value = ''

  if (!content.value.trim() && !imageData.value) {
    validationError.value = '请至少填写内容描述或上传截图'
    return
  }

  submitting.value = true
  try {
    const data = await bookStore.submitFeedback({
      type: feedbackType.value,
      content: content.value,
      image: imageData.value
    })
    if (data.code === 200 || data.code === 201) {
      submitSuccess.value = true
      content.value = ''
      imageData.value = null
      imagePreview.value = null
      setTimeout(() => {
        submitSuccess.value = false
      }, 3000)
    }
  } catch (e) {
    console.error('Failed to submit feedback:', e)
    validationError.value = '提交失败，请稍后重试'
  }
  submitting.value = false
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

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-color);
}

.type-selector {
  display: flex;
  gap: 8px;
}

.type-btn {
  padding: 8px 20px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--card-bg);
  color: var(--text-color);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.type-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.type-btn:hover:not(.active) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.feedback-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
}

.feedback-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.image-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-input {
  display: none;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--tag-bg);
  color: var(--text-color);
  align-self: flex-start;
}

.btn-secondary:hover {
  background: var(--hover-bg);
}

.image-preview {
  position: relative;
  display: inline-block;
}

.image-preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.btn-remove-image {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #c62828;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.validation-error {
  margin-top: 12px;
  padding: 10px 14px;
  background: #ffebee;
  color: #c62828;
  border-radius: 8px;
  font-size: 13px;
}

.success-message {
  margin-top: 16px;
  padding: 16px 20px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.success-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #2e7d32;
  color: white;
  font-size: 14px;
  font-weight: bold;
}
</style>
