import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { db } from '@/db'

export type ThemeMode = 'light' | 'dark'

export interface AppSettings {
  id?: number
  theme: ThemeMode
  lockEnabled: boolean
  lockPassword: string
}

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<ThemeMode>('light')
  const lockEnabled = ref(false)
  const lockPassword = ref('')
  const initialized = ref(false)

  // 从数据库加载设置
  async function loadSettings(): Promise<void> {
    const settings = await db.settings.toCollection().first()
    if (settings) {
      theme.value = settings.theme || 'light'
      lockEnabled.value = settings.lockEnabled || false
      lockPassword.value = settings.lockPassword || ''
    }
    applyTheme(theme.value)
    initialized.value = true
  }

  // 保存设置
  async function saveSettings(): Promise<void> {
    const existing = await db.settings.toCollection().first()
    const data: AppSettings = {
      theme: theme.value,
      lockEnabled: lockEnabled.value,
      lockPassword: lockPassword.value
    }
    if (existing?.id !== undefined) {
      await db.settings.update(existing.id, data)
    } else {
      await db.settings.add(data as any)
    }
  }

  // 切换主题
  async function toggleTheme(): Promise<void> {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    applyTheme(theme.value)
    await saveSettings()
  }

  // 设置主题
  function setTheme(mode: ThemeMode): void {
    theme.value = mode
    applyTheme(mode)
  }

  // 应用主题到 DOM
  function applyTheme(mode: ThemeMode): void {
    document.documentElement.setAttribute('theme', mode)
  }

  // 设置应用锁
  async function setLock(password: string): Promise<void> {
    lockEnabled.value = true
    lockPassword.value = hashPassword(password)
    await saveSettings()
  }

  // 关闭应用锁
  async function disableLock(): Promise<void> {
    lockEnabled.value = false
    lockPassword.value = ''
    await saveSettings()
  }

  // 验证密码
  function verifyPassword(password: string): boolean {
    return hashPassword(password) === lockPassword.value
  }

  // 简单哈希（不存储明文）
  function hashPassword(password: string): string {
    let hash = 0
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash |= 0
    }
    return hash.toString(36)
  }

  return {
    theme,
    lockEnabled,
    lockPassword,
    initialized,
    loadSettings,
    saveSettings,
    toggleTheme,
    setTheme,
    applyTheme,
    setLock,
    disableLock,
    verifyPassword
  }
})
