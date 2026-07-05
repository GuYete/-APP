<template>
  <!-- 应用锁 -->
  <LockScreen v-if="showLock" @unlocked="showLock = false" />

  <!-- 主应用 -->
  <div v-else class="app-container" :class="{ 'theme-transition': themeReady }">
    <div class="app-content">
      <router-view />
    </div>
    <div class="bottom-nav">
      <div
        v-for="tab in tabs"
        :key="tab.path"
        class="nav-item"
        :class="{ active: route.path === tab.path }"
        @click="$router.push(tab.path)"
      >
        <span class="nav-icon">{{ tab.icon }}</span>
        <span class="nav-label">{{ tab.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useCategoryStore } from '@/stores/category'
import { useI18n } from 'vue-i18n'
import { db } from '@/db'
import LockScreen from '@/views/LockScreen.vue'

const route = useRoute()
const router = useRouter()
const settings = useSettingsStore()
const { t } = useI18n()

const showLock = ref(false)
const themeReady = ref(false)

const tabs = computed(() => [
  { path: '/add', icon: '✏️', label: t('nav.add') },
  { path: '/list', icon: '📋', label: t('nav.list') },
  { path: '/stats', icon: '📊', label: t('nav.stats') },
  { path: '/snake', icon: '🐍', label: t('nav.snake') },
  { path: '/settings', icon: '⚙️', label: t('nav.settings') }
])

// 全局快捷键
function onKeydown(e: KeyboardEvent): void {
  if (!(e.ctrlKey || e.metaKey)) return
  if (e.key === 'n' || e.key === 'N') { e.preventDefault(); router.push('/add') }
  if (e.key === 'f' || e.key === 'F') { e.preventDefault(); router.push('/list') }
  if (e.key === 'd' || e.key === 'D') { e.preventDefault(); router.push('/stats') }
}

// 自动记录定期账单
async function autoRecordRecurring(): Promise<void> {
  try {
    const bills = await db.recurring.where({ enabled: true }).toArray()
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    for (const bill of bills) {
      let shouldRecord = false
      const lastRecorded = bill.lastRecorded || ''

      if (bill.cycle === 'daily') {
        shouldRecord = lastRecorded !== todayStr
      } else if (bill.cycle === 'monthly') {
        shouldRecord = today.getDate() === bill.dayOfMonth && !lastRecorded.startsWith(todayStr.substring(0, 7))
      } else if (bill.cycle === 'weekly') {
        shouldRecord = today.getDay() === bill.dayOfWeek && lastRecorded !== todayStr
      }

      if (shouldRecord) {
        await db.expenses.add({
          amount: bill.amount, categoryL1: bill.categoryL1, categoryL2: bill.categoryL2,
          account: bill.account, date: todayStr, note: `${bill.name}（自动记录）`,
          photo: '', createdAt: Date.now()
        })
        await db.recurring.update(bill.id!, { lastRecorded: todayStr })
      }
    }
  } catch (e) {
    console.error('autoRecordRecurring:', e)
  }
}

onMounted(async () => {
  try {
    await settings.loadSettings()
    const catStore = useCategoryStore()
    await catStore.ensureLoaded()
    await autoRecordRecurring()
  } catch (e) {
    console.error('[App init]', e)
  }
  document.addEventListener('keydown', onKeydown)
  themeReady.value = true
  if (settings.lockEnabled) {
    showLock.value = true
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg);
  transition: background 0.3s;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 16px;
}

.bottom-nav {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 60px;
  background: var(--nav-bg);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  transition: background 0.3s, border-color 0.3s;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  color: var(--text-muted);
  transition: color 0.2s;
}

.nav-item.active {
  color: var(--primary);
}

.nav-icon {
  font-size: 22px;
}

.nav-label {
  font-size: 11px;
}
</style>
