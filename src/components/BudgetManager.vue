<template>
  <div class="budget-manager">
    <!-- 总预算设置 -->
    <div class="budget-section">
      <div class="budget-section-title">{{ t('budget.totalMonthly') }}</div>
      <div class="budget-input-row">
        <span class="currency">¥</span>
        <input
          v-model.number="totalBudget"
          type="number"
          class="budget-input"
          :placeholder="t('budget.totalMonthly')"
          min="0"
          step="100"
        />
        <button class="save-btn-sm" @click="saveTotalBudget">{{ t('budget.save') }}</button>
      </div>
      <div v-if="totalBudget > 0" class="budget-hint">
        {{ t('budget.totalHint') }}
      </div>
    </div>

    <!-- 特定月份总预算 -->
    <div class="budget-section">
      <div class="budget-section-title">📅 {{ currentMonth }} {{ t('budget.totalMonth') }}</div>
      <div class="budget-input-row">
        <span class="currency">¥</span>
        <input
          v-model.number="monthBudget"
          type="number"
          class="budget-input"
          :placeholder="t('budget.totalMonth')"
          min="0"
          step="100"
        />
        <button class="save-btn-sm" @click="saveMonthBudget">{{ t('budget.save') }}</button>
      </div>
      <div v-if="monthBudget > 0" class="budget-hint">
        {{ t('budget.monthSpent') }} ¥{{ monthSpent.toFixed(0) }}，{{ t('budget.remaining') }} ¥{{ (monthBudget - monthSpent).toFixed(0) }}
      </div>
    </div>

    <!-- 分类预算 -->
    <div class="budget-section">
      <div class="budget-section-title">{{ t('budget.categoryBudget') }}</div>
      <div
        v-for="cat in catStore.allCategories"
        :key="cat.name"
        class="category-budget-row"
      >
        <span class="cat-budget-icon">{{ cat.icon }}</span>
        <span class="cat-budget-name">{{ cat.name }}</span>
        <input
          v-model.number="categoryBudgets[cat.name]"
          type="number"
          class="cat-budget-input"
          :placeholder="t('budget.noLimit')"
          min="0"
          step="100"
        />
        <button
          v-if="categoryBudgets[cat.name] > 0"
          class="save-cat-btn"
          @click="saveCategoryBudget(cat.name)"
        >✓</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useExpenseStore } from '@/stores/expense'
import { useCategoryStore } from '@/stores/category'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'

const store = useExpenseStore()
const catStore = useCategoryStore()
const { t } = useI18n()

const currentMonth = store.selectedMonth
const monthSpent = ref(0)

const totalBudget = ref(0)
const monthBudget = ref(0)
const categoryBudgets = ref<Record<string, number>>({})

onMounted(async () => {
  await store.loadBudgets()
  monthSpent.value = store.getMonthTotal(currentMonth)

  // 加载已有预算
  totalBudget.value = store.getBudget('', '')
  monthBudget.value = store.getBudget(currentMonth, '')

  for (const cat of catStore.allCategories) {
    const b = store.getBudget(currentMonth, cat.name) || store.getBudget('', cat.name)
    if (b > 0) {
      categoryBudgets.value[cat.name] = b
    } else {
      categoryBudgets.value[cat.name] = 0
    }
  }
})

async function saveTotalBudget(): Promise<void> {
  if (totalBudget.value < 0) return
  if (totalBudget.value === 0) {
    // 删除
    const b = store.budgets.find(bb => bb.yearMonth === '' && bb.categoryL1 === '')
    if (b?.id) await store.deleteBudget(b.id)
  } else {
    await store.saveBudget({ yearMonth: '', categoryL1: '', amount: totalBudget.value })
  }
  ElMessage.success(t('budget.totalSaved'))
}

async function saveMonthBudget(): Promise<void> {
  if (monthBudget.value < 0) return
  if (monthBudget.value === 0) {
    const b = store.budgets.find(bb => bb.yearMonth === currentMonth && bb.categoryL1 === '')
    if (b?.id) await store.deleteBudget(b.id)
  } else {
    await store.saveBudget({ yearMonth: currentMonth, categoryL1: '', amount: monthBudget.value })
  }
  ElMessage.success(currentMonth + ' ' + t('budget.monthSaved'))
}

async function saveCategoryBudget(catName: string): Promise<void> {
  const amount = categoryBudgets.value[catName]
  if (!amount || amount <= 0) return
  await store.saveBudget({ yearMonth: currentMonth, categoryL1: catName, amount })
  ElMessage.success(catName + ' ' + t('budget.catSaved'))
}
</script>

<style scoped>
.budget-manager {
  padding: 0;
}

.budget-section {
  margin-bottom: 16px;
}

.budget-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
}

.budget-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.currency {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary);
}

.budget-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  outline: none;
  background: var(--bg);
  color: var(--text);
}

.save-btn-sm {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.budget-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
}

.category-budget-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--border-light);
}

.cat-budget-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.cat-budget-name {
  font-size: 13px;
  color: var(--text);
  width: 72px;
  flex-shrink: 0;
}

.cat-budget-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: var(--bg);
  color: var(--text);
  width: 80px;
  text-align: right;
}

.save-cat-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: var(--success);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}
</style>
