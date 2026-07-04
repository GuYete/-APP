<template>
  <div class="lock-screen">
    <div class="lock-card">
      <div class="lock-icon">🔒</div>
      <h2 class="lock-title">{{ t('lock.title') }}</h2>
      <p class="lock-hint">{{ t('lock.hint') }}</p>
      <div class="lock-input-row">
        <input
          ref="pwdInput"
          v-model="password"
          type="password"
          class="lock-input"
          placeholder="••••••"
          maxlength="20"
          @keydown.enter="onUnlock"
        />
      </div>
      <button class="unlock-btn" @click="onUnlock">{{ t('lock.unlock') }}</button>
      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{ unlocked: [] }>()
const settings = useSettingsStore()
const { t } = useI18n()

const password = ref('')
const errorMsg = ref('')
const pwdInput = ref<HTMLInputElement>()

function onUnlock(): void {
  if (!password.value) {
    errorMsg.value = t('settings.pwdRequired')
    return
  }
  if (settings.verifyPassword(password.value)) {
    emit('unlocked')
  } else {
    errorMsg.value = t('lock.error')
    password.value = ''
  }
}

onMounted(async () => {
  await nextTick()
  pwdInput.value?.focus()
})
</script>

<style scoped>
.lock-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: var(--bg);
}

.lock-card {
  text-align: center;
  padding: 40px 32px;
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: var(--shadow);
  width: 300px;
}

.lock-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.lock-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}

.lock-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.lock-input-row {
  margin-bottom: 16px;
}

.lock-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 18px;
  text-align: center;
  border: 2px solid var(--border);
  border-radius: 10px;
  outline: none;
  background: var(--bg);
  color: var(--text);
  letter-spacing: 4px;
  transition: border-color 0.2s;
}

.lock-input:focus {
  border-color: var(--primary);
}

.unlock-btn {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.unlock-btn:hover {
  background: var(--primary-light);
}

.error-msg {
  color: var(--danger);
  font-size: 13px;
  margin-top: 12px;
}
</style>
