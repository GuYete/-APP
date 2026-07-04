<template>
  <div class="settings-page">
    <div class="page-header">
      <h2 class="page-title">{{ t('settings.title') }}</h2>
    </div>

    <!-- 主题切换 -->
    <div class="setting-card">
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-icon">{{ settings.theme === 'dark' ? '🌙' : '☀️' }}</span>
          <div>
            <div class="setting-name">{{ t('settings.darkMode') }}</div>
            <div class="setting-desc">{{ settings.theme === 'dark' ? t('settings.on') : t('settings.off') }}</div>
          </div>
        </div>
        <label class="toggle-switch">
          <input
            type="checkbox"
            :checked="settings.theme === 'dark'"
            @change="settings.toggleTheme()"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <!-- 应用锁 -->
    <div class="setting-card">
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-icon">🔒</span>
          <div>
            <div class="setting-name">{{ t('settings.appLock') }}</div>
            <div class="setting-desc">{{ settings.lockEnabled ? t('settings.on') : t('settings.off') }}</div>
          </div>
        </div>
        <label class="toggle-switch">
          <input
            type="checkbox"
            :checked="settings.lockEnabled"
            @change="onToggleLock"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <!-- 设置/修改密码 -->
      <div v-if="settings.lockEnabled" class="lock-password-section">
        <input
          v-model="lockPwd"
          type="password"
          class="lock-pwd-input"
          :placeholder="t('settings.lockPwd')"
          maxlength="20"
        />
        <button class="save-pwd-btn" @click="onSavePassword">{{ t('settings.savePwd') }}</button>
      </div>
      <div v-if="showLockPwdInput" class="lock-password-section">
        <input
          v-model="lockPwd"
          type="password"
          class="lock-pwd-input"
          :placeholder="t('settings.setLockPwd')"
          maxlength="20"
        />
        <button class="save-pwd-btn" @click="onEnableLock">{{ t('settings.enableLock') }}</button>
      </div>
    </div>

    <!-- 预算管理 -->
    <div class="setting-card">
      <div class="setting-row clickable" @click="showBudget = !showBudget">
        <div class="setting-info">
          <span class="setting-icon">🎯</span>
          <div>
            <div class="setting-name">{{ t('settings.budget') }}</div>
            <div class="setting-desc">{{ t('settings.budgetDesc') }}</div>
          </div>
        </div>
        <span class="arrow" :class="{ open: showBudget }">›</span>
      </div>
      <div v-if="showBudget" class="expand-section">
        <BudgetManager />
      </div>
    </div>

    <!-- 存钱目标 -->
    <div class="setting-card">
      <div class="setting-row clickable" @click="showSaving = !showSaving">
        <div class="setting-info">
          <span class="setting-icon">🎯</span>
          <div>
            <div class="setting-name">{{ t('settings.saving') }}</div>
            <div class="setting-desc">{{ t('settings.savingDesc') }}</div>
          </div>
        </div>
        <span class="arrow" :class="{ open: showSaving }">›</span>
      </div>
      <div v-if="showSaving" class="expand-section">
        <SavingGoal />
      </div>
    </div>

    <!-- 定期账单 -->
    <div class="setting-card">
      <div class="setting-row clickable" @click="showRecurring = !showRecurring">
        <div class="setting-info">
          <span class="setting-icon">🔄</span>
          <div>
            <div class="setting-name">{{ t('settings.recurring') }}</div>
            <div class="setting-desc">{{ t('settings.recurringDesc') }}</div>
          </div>
        </div>
        <span class="arrow" :class="{ open: showRecurring }">›</span>
      </div>
      <div v-if="showRecurring" class="expand-section">
        <RecurringManager />
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="setting-card">
      <div class="section-title">{{ t('settings.dataSection') }}</div>
      <div class="setting-row clickable" @click="onExportData">
        <div class="setting-info">
          <span class="setting-icon">📤</span>
          <div>
            <div class="setting-name">{{ t('settings.exportData') }}</div>
            <div class="setting-desc">{{ t('settings.exportDataDesc') }}</div>
          </div>
        </div>
        <span class="arrow">›</span>
      </div>
      <div class="setting-row clickable" @click="onImportData">
        <div class="setting-info">
          <span class="setting-icon">📥</span>
          <div>
            <div class="setting-name">{{ t('settings.importData') }}</div>
            <div class="setting-desc">{{ t('settings.importDataDesc') }}</div>
          </div>
        </div>
        <span class="arrow">›</span>
      </div>
      <div class="setting-row clickable" @click="onExportExcel">
        <div class="setting-info">
          <span class="setting-icon">📊</span>
          <div>
            <div class="setting-name">{{ t('settings.exportExcel') }}</div>
            <div class="setting-desc">{{ t('settings.exportExcelDesc') }}</div>
          </div>
        </div>
        <span class="arrow">›</span>
      </div>
    </div>

    <!-- 导入账单 -->
    <div class="setting-card">
      <div class="setting-row clickable" @click="showImport = !showImport">
        <div class="setting-info">
          <span class="setting-icon">📥</span>
          <div>
            <div class="setting-name">{{ t('settings.importBill') }}</div>
            <div class="setting-desc">{{ t('settings.importBillDesc') }}</div>
          </div>
        </div>
        <span class="arrow" :class="{ open: showImport }">›</span>
      </div>
      <div v-if="showImport" class="expand-section">
        <BillImport />
      </div>
    </div>

    <!-- 分类管理 -->
    <div class="setting-card">
      <div class="setting-row clickable" @click="showCategories = !showCategories">
        <div class="setting-info">
          <span class="setting-icon">📂</span>
          <div>
            <div class="setting-name">📂 {{ t('settings.categories') }}</div>
            <div class="setting-desc">{{ t('settings.categoriesDesc') }}</div>
          </div>
        </div>
        <span class="arrow" :class="{ open: showCategories }">›</span>
      </div>
      <div v-if="showCategories" class="expand-section">
        <CategoryManager />
      </div>
    </div>

    <!-- 语言切换 -->
    <div class="setting-card">
      <div class="setting-row clickable" @click="toggleLanguage">
        <div class="setting-info">
          <span class="setting-icon">🌐</span>
          <div>
            <div class="setting-name">{{ t('settings.language') }}</div>
            <div class="setting-desc">{{ locale === 'zh-CN' ? '中文' : 'English' }} → 点击切换</div>
          </div>
        </div>
        <span class="arrow">›</span>
      </div>
    </div>

    <!-- 关于 -->
    <div class="setting-card">
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-icon">ℹ️</span>
          <div>
            <div class="setting-name">{{ t('settings.version') }}</div>
            <div class="setting-desc">v1.0.0</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import BudgetManager from '@/components/BudgetManager.vue'
import SavingGoal from '@/components/SavingGoal.vue'
import RecurringManager from '@/components/RecurringManager.vue'
import BillImport from '@/components/BillImport.vue'
import CategoryManager from '@/components/CategoryManager.vue'
import { useI18n } from 'vue-i18n'
import { useExpenseStore } from '@/stores/expense'
import { exportToJSON, importFromJSON, downloadFile, readFileAsText } from '@/utils/backup'
import { exportToExcel } from '@/utils/export'
import { ElMessage, ElMessageBox } from 'element-plus'

const settings = useSettingsStore()
const expenseStore = useExpenseStore()

const lockPwd = ref('')
const showLockPwdInput = ref(false)
const showBudget = ref(false)
const showSaving = ref(false)
const showRecurring = ref(false)
const showImport = ref(false)
const showCategories = ref(false)

// i18n
const { t, locale } = useI18n()

function toggleLanguage(): void {
  locale.value = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
  localStorage.setItem('language', locale.value)
}

function onToggleLock(): void {
  if (settings.lockEnabled) {
    settings.disableLock()
    ElMessage.success(t('settings.lockOff'))
  } else {
    showLockPwdInput.value = true
  }
}

async function onEnableLock(): Promise<void> {
  if (!lockPwd.value) {
    ElMessage.warning(t('settings.pwdRequired'))
    return
  }
  await settings.setLock(lockPwd.value)
  lockPwd.value = ''
  showLockPwdInput.value = false
  ElMessage.success(t('settings.lockOn'))
}

async function onSavePassword(): Promise<void> {
  if (!lockPwd.value) {
    ElMessage.warning(t('settings.pwdRequired'))
    return
  }
  await settings.setLock(lockPwd.value)
  lockPwd.value = ''
  ElMessage.success(t('settings.pwdUpdated'))
}

async function onExportData(): Promise<void> {
  try {
    const json = await exportToJSON()
    const filename = `黑马记账_备份_${new Date().toISOString().slice(0, 10)}.json`
    downloadFile(json, filename)
    ElMessage.success(t('settings.exportOk'))
  } catch {
    ElMessage.error(t('settings.exportFail'))
  }
}

async function onImportData(): Promise<void> {
  try {
    await ElMessageBox.confirm(
      t('settings.importConfirm'),
      '',
      { confirmButtonText: t('common.yes'), cancelButtonText: t('common.no'), type: 'warning' }
    )
    const json = await readFileAsText('.json')
    const result = await importFromJSON(json)
    await expenseStore.loadExpenses()
    ElMessage.success(t('settings.importOk', [result.imported, result.skipped]))
  } catch (e: any) {
    if (e !== 'cancel' && e?.message) {
      ElMessage.error(e.message || t('settings.importFail'))
    }
  }
}

async function onExportExcel(): Promise<void> {
  try {
    await expenseStore.loadExpenses()
    exportToExcel(expenseStore.expenses)
    ElMessage.success('Excel 报表已导出')
  } catch {
    ElMessage.error('导出失败')
  }
}
</script>

<style scoped>
.settings-page {
  padding: 20px 16px;
  max-width: 420px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

.setting-card {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 4px 0;
  margin-bottom: 12px;
  box-shadow: var(--shadow);
}

.section-title {
  font-size: 12px;
  color: var(--text-muted);
  padding: 10px 16px 4px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  transition: background 0.15s;
}

.setting-row.clickable {
  cursor: pointer;
}

.setting-row.clickable:hover {
  background: var(--bg);
}

.setting-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-icon {
  font-size: 22px;
}

.setting-name {
  font-size: 14px;
  color: var(--text);
}

.setting-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.arrow {
  font-size: 20px;
  color: var(--text-muted);
  transition: transform 0.2s;
}

.arrow.open {
  transform: rotate(90deg);
}

.expand-section {
  padding: 0 16px 16px;
  border-top: 1px solid var(--border-light);
}

/* 开关 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 26px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ccc;
  border-radius: 26px;
  transition: 0.3s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: 0.3s;
}

input:checked + .toggle-slider {
  background: var(--primary);
}

input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

/* 密码设置 */
.lock-password-section {
  display: flex;
  gap: 8px;
  padding: 0 16px 14px;
}

.lock-pwd-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  background: var(--bg);
  color: var(--text);
}

.save-pwd-btn {
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
</style>
