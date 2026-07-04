<template>
  <div class="settings-page">
    <div class="page-header">
      <h2 class="page-title">设置</h2>
    </div>

    <!-- 主题切换 -->
    <div class="setting-card">
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-icon">{{ settings.theme === 'dark' ? '🌙' : '☀️' }}</span>
          <div>
            <div class="setting-name">深色模式</div>
            <div class="setting-desc">{{ settings.theme === 'dark' ? '已开启' : '已关闭' }}</div>
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
            <div class="setting-name">应用锁</div>
            <div class="setting-desc">{{ settings.lockEnabled ? '已开启' : '已关闭' }}</div>
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
          placeholder="输入新密码"
          maxlength="20"
        />
        <button class="save-pwd-btn" @click="onSavePassword">保存密码</button>
      </div>
      <div v-if="showLockPwdInput" class="lock-password-section">
        <input
          v-model="lockPwd"
          type="password"
          class="lock-pwd-input"
          placeholder="设置解锁密码"
          maxlength="20"
        />
        <button class="save-pwd-btn" @click="onEnableLock">启用应用锁</button>
      </div>
    </div>

    <!-- 预算管理 -->
    <div class="setting-card">
      <div class="setting-row clickable" @click="showBudget = !showBudget">
        <div class="setting-info">
          <span class="setting-icon">🎯</span>
          <div>
            <div class="setting-name">预算管理</div>
            <div class="setting-desc">设置每月预算和分类预算</div>
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
            <div class="setting-name">存钱目标</div>
            <div class="setting-desc">设定储蓄目标，追踪进度</div>
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
            <div class="setting-name">定期账单管理</div>
            <div class="setting-desc">房租、订阅等自动记录</div>
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
      <div class="section-title">数据管理</div>
      <div class="setting-row clickable" @click="onExportData">
        <div class="setting-info">
          <span class="setting-icon">📤</span>
          <div>
            <div class="setting-name">导出数据备份</div>
            <div class="setting-desc">将所有记账数据导出为 JSON 文件</div>
          </div>
        </div>
        <span class="arrow">›</span>
      </div>
      <div class="setting-row clickable" @click="onImportData">
        <div class="setting-info">
          <span class="setting-icon">📥</span>
          <div>
            <div class="setting-name">导入数据恢复</div>
            <div class="setting-desc">从备份文件恢复数据</div>
          </div>
        </div>
        <span class="arrow">›</span>
      </div>
      <div class="setting-row clickable" @click="onExportExcel">
        <div class="setting-info">
          <span class="setting-icon">📊</span>
          <div>
            <div class="setting-name">导出 Excel 报表</div>
            <div class="setting-desc">将所有数据导出为 Excel 文件</div>
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
            <div class="setting-name">导入账单</div>
            <div class="setting-desc">导入微信/支付宝 CSV 账单</div>
          </div>
        </div>
        <span class="arrow" :class="{ open: showImport }">›</span>
      </div>
      <div v-if="showImport" class="expand-section">
        <BillImport />
      </div>
    </div>

    <!-- 语言切换 -->
    <div class="setting-card">
      <div class="setting-row clickable" @click="toggleLanguage">
        <div class="setting-info">
          <span class="setting-icon">🌐</span>
          <div>
            <div class="setting-name">语言</div>
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
            <div class="setting-name">版本</div>
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

// i18n
const { t, locale } = useI18n()

function toggleLanguage(): void {
  locale.value = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
  localStorage.setItem('language', locale.value)
}

function onToggleLock(): void {
  if (settings.lockEnabled) {
    settings.disableLock()
    ElMessage.success('应用锁已关闭')
  } else {
    showLockPwdInput.value = true
  }
}

async function onEnableLock(): Promise<void> {
  if (!lockPwd.value) {
    ElMessage.warning('请设置密码')
    return
  }
  await settings.setLock(lockPwd.value)
  lockPwd.value = ''
  showLockPwdInput.value = false
  ElMessage.success('应用锁已开启')
}

async function onSavePassword(): Promise<void> {
  if (!lockPwd.value) {
    ElMessage.warning('请输入新密码')
    return
  }
  await settings.setLock(lockPwd.value)
  lockPwd.value = ''
  ElMessage.success('密码已更新')
}

async function onExportData(): Promise<void> {
  try {
    const json = await exportToJSON()
    const filename = `黑马记账_备份_${new Date().toISOString().slice(0, 10)}.json`
    downloadFile(json, filename)
    ElMessage.success('数据备份已导出')
  } catch {
    ElMessage.error('导出失败')
  }
}

async function onImportData(): Promise<void> {
  try {
    await ElMessageBox.confirm(
      '导入将合并数据（已存在的记录不会重复导入），确定继续吗？',
      '导入确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    const json = await readFileAsText('.json')
    const result = await importFromJSON(json)
    await expenseStore.loadExpenses()
    ElMessage.success(`导入完成：新增 ${result.imported} 条，跳过 ${result.skipped} 条`)
  } catch (e: any) {
    if (e !== 'cancel' && e?.message) {
      ElMessage.error(e.message || '导入失败')
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
