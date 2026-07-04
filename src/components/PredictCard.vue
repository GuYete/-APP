<template>
  <div class="predict-card">
    <div class="predict-title">🔮 消费预测</div>

    <div v-if="total === 0" class="predict-empty">本月暂无消费记录</div>

    <template v-else>
      <div class="predict-stats">
        <div class="stat-item">
          <span class="stat-value">¥{{ avgDaily.toFixed(0) }}</span>
          <span class="stat-label">日均消费</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">¥{{ predicted.toFixed(0) }}</span>
          <span class="stat-label">预测月底</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ passedDays }}天</span>
          <span class="stat-label">本月已过</span>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="predict-bar">
        <div class="predict-bar-bg">
          <div
            class="predict-bar-fill"
            :class="{ over: predicted > (budget || Infinity) }"
            :style="{ width: barPercent + '%' }"
          ></div>
        </div>
        <div class="bar-labels">
          <span>{{ barPercent }}%</span>
          <span v-if="budget > 0">预算 ¥{{ budget.toFixed(0) }}</span>
        </div>
      </div>

      <!-- 预算对比 -->
      <div v-if="budget > 0" class="predict-verdict" :class="{ over: predicted > budget }">
        {{ predicted > budget ? `⚠️ 按此趋势将超支 ¥${(predicted - budget).toFixed(0)}` : `✅ 预计不超预算，剩余 ¥${(budget - predicted).toFixed(0)}` }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useExpenseStore } from '@/stores/expense'

const store = useExpenseStore()

const props = defineProps<{
  total: number
}>()

const now = new Date()
const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
const passedDays = Math.min(now.getDate(), totalDays)

const avgDaily = computed(() => (passedDays > 0 ? props.total / passedDays : 0))
const predicted = computed(() => avgDaily.value * totalDays)
const budget = computed(() => store.getBudget(yearMonth, '') || store.getBudget('', ''))

const barPercent = computed(() => {
  const max = budget.value > 0 ? Math.max(budget.value, predicted.value) : predicted.value
  if (max === 0) return 0
  return Math.min(Math.round((predicted.value / max) * 100), 100)
})
</script>

<style scoped>
.predict-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow);
}

.predict-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
}

.predict-empty {
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  padding: 16px;
}

.predict-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 14px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
}

.predict-bar {
  margin-bottom: 8px;
}

.predict-bar-bg {
  height: 8px;
  background: var(--bg);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.predict-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #409EFF, #66B1FF);
  border-radius: 4px;
  transition: width 0.6s;
}

.predict-bar-fill.over {
  background: linear-gradient(90deg, #F56C6C, #E6A23C);
}

.bar-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-muted);
}

.predict-verdict {
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  padding: 8px;
  border-radius: 8px;
  background: rgba(103, 194, 58, 0.1);
  color: var(--success);
}

.predict-verdict.over {
  background: rgba(245, 108, 108, 0.1);
  color: var(--danger);
}
</style>
