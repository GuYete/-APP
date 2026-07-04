<template>
  <div class="expense-list">
    <div class="page-header">
      <h2 class="page-title">{{ t('list.title') }}</h2>
    </div>

    <!-- 搜索框 -->
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input
        v-model="store.searchQuery"
        type="text"
        class="search-input"
        :placeholder="t('list.search')"
      />
    </div>

    <!-- 筛选区 -->
    <div class="filter-bar">
      <input
        v-model="searchMonth"
        type="month"
        class="month-input"
      />
      <select v-model="store.categoryFilter" class="category-select">
        <option value="">{{ t('list.allCategories') }}</option>
        <option v-for="cat in catStore.allCategories" :key="cat.name" :value="cat.name">
          {{ cat.icon }} {{ cat.name }}
        </option>
      </select>
      <select v-model="store.accountFilter" class="account-select">
        <option value="">{{ t('list.allAccounts') }}</option>
        <option v-for="acc in accounts" :key="acc.key" :value="acc.key">
          {{ acc.icon }} {{ acc.name }}
        </option>
      </select>
    </div>

    <!-- 本月合计 -->
    <div class="total-bar">
      <span class="total-label">{{ displayMonth }} {{ t('list.total') }}</span>
      <span class="total-amount">¥{{ totalAmount.toFixed(2) }}</span>
    </div>

    <!-- 花销列表 -->
    <div v-if="groupedExpenses.length === 0" class="empty-state">
      <span class="empty-icon">📭</span>
      <p>{{ t('list.empty') }}</p>
    </div>

    <div v-else class="list-wrapper">
      <div v-for="group in groupedExpenses" :key="group.date" class="date-group">
        <div class="date-header">
          <span class="date-text">{{ formatDate(group.date) }}</span>
          <span class="date-total">¥{{ group.total.toFixed(2) }}</span>
        </div>
        <div
          v-for="expense in group.items"
          :key="expense.id"
          class="expense-item"
          @click="onDelete(expense)"
        >
          <div class="item-left">
            <span
              class="item-icon"
              :style="{ background: getCatColor(expense.categoryL1) }"
            >
              {{ getCatIcon(expense.categoryL1) }}
            </span>
            <div class="item-info">
              <div class="item-category-row">
                <span class="item-category">{{ expense.categoryL2 }}</span>
                <span class="item-account">{{ getAccountIcon(expense.account) }}</span>
                <span v-if="expense.photo" class="photo-dot" @click.stop="onViewPhoto(expense.photo)">📷</span>
              </div>
              <span v-if="expense.note" class="item-note">{{ expense.note }}</span>
            </div>
          </div>
          <span class="item-amount">¥{{ expense.amount.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <PhotoViewer :visible="showPhoto" :src="viewPhotoSrc" @close="showPhoto = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useExpenseStore } from '@/stores/expense'
import { useCategoryStore } from '@/stores/category'
import { useI18n } from 'vue-i18n'
import { getCategoryByName } from '@/data/categories'
import { getAccountByKey } from '@/data/accounts'
import { accounts } from '@/data/accounts'
import { ElMessageBox } from 'element-plus'
import PhotoViewer from '@/components/PhotoViewer.vue'

const store = useExpenseStore()
const catStore = useCategoryStore()
const { t } = useI18n()

const searchMonth = ref(store.selectedMonth)
const showPhoto = ref(false)
const viewPhotoSrc = ref('')

function onViewPhoto(src: string): void {
  viewPhotoSrc.value = src
  showPhoto.value = true
}

const displayMonth = computed(() => {
  const [y, m] = searchMonth.value.split('-')
  return `${y}年${m}月`
})

// 当月搜索过滤后的总金额
const totalAmount = computed(() => {
  return groupedExpenses.value.reduce((sum, g) => sum + g.total, 0)
})

interface GroupedItem {
  date: string
  total: number
  items: typeof store.expenses.value
}

const groupedExpenses = computed<GroupedItem[]>(() => {
  // 先按月份筛选
  let list = store.filteredExpenses.filter(e => e.date.startsWith(searchMonth.value))

  // 按日期分组
  const groups = new Map<string, typeof list>()
  for (const item of list) {
    const existing = groups.get(item.date)
    if (existing) {
      existing.push(item)
    } else {
      groups.set(item.date, [item])
    }
  }

  return Array.from(groups.entries())
    .map(([date, items]) => ({
      date,
      items,
      total: items.reduce((sum, e) => sum + e.amount, 0)
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
})

function getCatIcon(name: string): string {
  return getCategoryByName(name)?.icon || '💰'
}

function getCatColor(name: string): string {
  return getCategoryByName(name)?.color || '#999'
}

function getAccountIcon(key: string): string {
  return getAccountByKey(key)?.icon || '💵'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日 周${weekdays[d.getDay()]}`
}

async function onDelete(expense: { id?: number; amount: number; categoryL2: string }): Promise<void> {
  try {
    await ElMessageBox.confirm(
      t('list.deleteConfirm', [expense.categoryL2, expense.amount.toFixed(2)]),
      t('list.deleteTitle'),
      {
        confirmButtonText: t('list.delete'),
        cancelButtonText: t('list.cancel'),
        type: 'warning'
      }
    )
    if (expense.id !== undefined) {
      await store.deleteExpense(expense.id)
    }
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  store.loadExpenses()
})
</script>

<style scoped>
.expense-list {
  padding: 20px 16px;
  max-width: 420px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

/* 搜索框 */
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-card);
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 10px;
  box-shadow: var(--shadow);
}

.search-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--text);
  background: transparent;
}

.search-input::placeholder {
  color: var(--text-muted);
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.month-input,
.category-select,
.account-select {
  flex: 1;
  padding: 7px 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 12px;
  color: var(--text);
  background: var(--bg-card);
  outline: none;
}

/* 合计栏 */
.total-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-card);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow);
}

.total-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.total-amount {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

/* 日期分组 */
.date-group {
  margin-bottom: 16px;
}

.date-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px;
}

.date-text {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.date-total {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 花销条目 */
.expense-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-card);
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: background 0.15s;
  box-shadow: var(--shadow-sm);
}

.expense-item:hover {
  background: var(--bg);
}

.item-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-category-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-category {
  font-size: 14px;
  color: var(--text);
}

.item-account {
  font-size: 12px;
}

.item-note {
  font-size: 12px;
  color: var(--text-muted);
}

.item-amount {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  flex-shrink: 0;
}
</style>
